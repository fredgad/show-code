import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, HostListener, NgZone, OnInit, PLATFORM_ID, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AvatarComponent } from '@features';
import { copyText } from '@shared/helpers';
import { LangTextI, VideoDataI } from '@shared/interfaces';
import { AuthService, LangService } from '@shared/services';
import { HeaderComponent } from '@widgets/header';
import { EMPTY, Subject, catchError, distinctUntilChanged, finalize, forkJoin, map, of, startWith, switchMap, takeUntil, tap } from 'rxjs';
import { TRUST_ACCESS_TEXT, trustDate } from '../../../widgets/trusted-people/access/trust-access.text';
import { TrustAccessApiService, TrustCatalog, TrustContact } from '../../../widgets/trusted-people/access/trust-access-api.service';
import { TrustedAccessSettingsComponent } from '../../../widgets/trusted-people/access/trusted-access-settings.component';
import { TRUSTED_PEOPLE_TEXT } from '../../../widgets/trusted-people/components/trusted-people.text';
import { PROFILE_NAVIGATION } from '../../profile/profile-navigation';
import { PROFILE_TEXT } from '../../profile/profile.text';
import { VaultApiService } from '../../profile/vault/vault-api.service';
import { locationPoint } from '../../profile/vault/vault-geo';
import { VaultPlayerComponent } from '../../profile/vault/vault-player.component';
import { vaultSaveText } from '../../profile/vault/vault-save.text';
import { isVaultMediaAvailable } from '../../profile/vault/vault.models';
import {
  PersonRecord, RecordingMessage, TrustedLiveStream, TrustedPersonDetail, TrustedProfileContentService,
  liveWatchId, recordFromMessage, recordFromVideo,
} from './trusted-profile-content.service';
import { TRUSTED_PROFILE_TEXT } from './trusted-profile.text';
import { TrustedRecordCardComponent } from './trusted-record-card.component';

const copy = { ...TRUSTED_PEOPLE_TEXT, ...TRUST_ACCESS_TEXT, ...TRUSTED_PROFILE_TEXT, support: PROFILE_TEXT.support };
const vaultText = {
  save: vaultSaveText.saveRecording,
  saved: vaultSaveText.saveDone,
  quota: vaultSaveText.quota,
  error: vaultSaveText.saveError,
  saving: { ENG: 'Saving…', RUS: 'Сохраняем…', ESP: 'Guardando…', EST: 'Salvestamine…', ARM: 'Պահվում է…' },
  unsealed: {
    ENG: 'The evidence version is still unavailable.', RUS: 'Доказательная версия пока недоступна.',
    ESP: 'La versión probatoria sigue sin estar disponible.', EST: 'Tõendusversioon pole veel saadaval.',
    ARM: 'Ապացուցողական տարբերակը դեռ հասանելի չէ։'
  },
} satisfies Record<string, LangTextI>;

type VaultSaveLabel = keyof typeof vaultText;
type ContentTab = 'sos' | 'messages';
type MediaSelection = { kind: 'live'; id: string } | { kind: 'record'; id: string; tab: ContentTab };
const watchLanguages = { ENG: 'en', RUS: 'ru', ESP: 'es', EST: 'et', ARM: 'hy' } as const;

@Component({
  selector: 'org-trusted-profile',
  standalone: true,
  imports: [
    HeaderComponent, AvatarComponent, RouterLink,
    TrustedAccessSettingsComponent, TrustedRecordCardComponent, VaultPlayerComponent,
  ],
  templateUrl: './trusted-profile.component.html',
  styleUrl: './trusted-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrustedProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly language = inject(LangService);
  private readonly document = inject(DOCUMENT);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly sanitizer = inject(DomSanitizer);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly vaultApi = inject(VaultApiService);
  private readonly accessApi = inject(TrustAccessApiService);
  private readonly contentApi = inject(TrustedProfileContentService);
  private readonly vaultSaveState = signal(new Map<string, VaultSaveLabel>());
  private readonly refreshRequested = new Subject<void>();
  private readonly protectRevoked = new Subject<void>();
  private readonly acknowledgedReads = new Set<string>();
  private readonly pendingReads = signal(new Set<string>());
  private readonly messages = signal<RecordingMessage[]>([]);
  private readonly checkedIncoming = signal(false);

  private destroyed = false;
  private keyId = '';
  private refreshTimer?: number;
  private deadlineTimer?: number;
  private viewTrigger?: HTMLButtonElement;

  @ViewChild('viewer', { static: true }) private viewer!: ElementRef<HTMLDialogElement>;
  @ViewChild('removeDialog', { static: true }) private removeDialog!: ElementRef<HTMLDialogElement>;

  readonly people = PROFILE_NAVIGATION.trustedPeople;
  readonly catalog = signal<TrustCatalog | null>(null);
  readonly contact = computed(() => this.catalog()?.contacts.find(contact =>
    contact.targetType === 'user' && contact.keyId === this.keyId
  ));
  readonly incoming = computed(() => this.checkedIncoming() && this.contact()?.policy?.access?.receivesTheirData === true);
  readonly tab = signal<ContentTab>('sos');
  readonly loading = signal(true);
  readonly profileError = signal(false);
  readonly messagesLoading = signal(false);
  readonly messagesError = signal(false);
  readonly liveError = signal(false);
  readonly copyFeedback = signal<'copied' | 'copyError' | null>(null);
  readonly archived = signal<PersonRecord[]>([]);
  readonly delivered = computed(() => this.messages().map(message => recordFromMessage({
    ...message, isRead: message.isRead || this.pendingReads().has(message.deliveryId),
  })));
  readonly unread = computed(() => this.delivered().filter(record => !record.message?.isRead).length);
  readonly live = signal<TrustedLiveStream | null>(null);
  readonly removing = signal(false);
  readonly removeError = signal(false);
  readonly selection = signal<MediaSelection | null>(null);
  readonly activeRecording = computed(() => {
    const selected = this.selection();
    if (selected?.kind !== 'record' || !this.incoming()) return null;
    return (selected.tab === 'sos' ? this.archived() : this.delivered())
      .find(record => record.id === selected.id && isVaultMediaAvailable(record.item)) ?? null;
  });
  readonly liveUrl = computed(() => {
    const selected = this.selection();
    const live = this.live();
    if (selected?.kind !== 'live' || !live || !this.incoming() || liveWatchId(live) !== selected.id) return null;
    // The ID comes from the authorized stream list and is restricted to an opaque path segment.
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `/watch/${encodeURIComponent(selected.id)}?lang=${watchLanguages[this.language.getLang$i()]}`
    );
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(
      map(params => params.get('keyId') ?? ''),
      distinctUntilChanged(),
      switchMap(key => {
        this.keyId = key;
        this.catalog.set(null);
        this.clearProtected();
        this.closeRemove();
        this.copyFeedback.set(null);
        this.tab.set('sos');
        return this.refreshRequested.pipe(
          startWith(undefined),
          switchMap(() => this.fetchProfile(key))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();

    if (this.browser) {
      this.destroyRef.onDestroy(() => {
        this.destroyed = true;
        this.clearTimers();
      });
    }

    this.vaultApi.items('saved').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ items }) => this.vaultSaveState.update(current => {
        const next = new Map(current);
        for (const item of items) {
          if (item.sourceMediaAssetId && next.get(item.sourceMediaAssetId) !== 'saving') {
            next.set(item.sourceMediaAssetId, 'saved');
          }
        }
        return next;
      }),
      error: () => undefined
    });
  }

  refresh(): void { this.refreshRequested.next(); }

  @HostListener('document:visibilitychange')
  refreshVisibleAccess(): void {
    if (this.document.visibilityState === 'visible') this.refresh();
  }

  accessChanged(catalog: TrustCatalog): void {
    this.catalog.set(catalog);
    if (!this.incoming()) this.clearProtected();
    this.refresh();
  }

  async copyKey(keyId: string): Promise<void> {
    try {
      await copyText(this.document, keyId);
      if (this.keyId === keyId) this.copyFeedback.set('copied');
    } catch {
      if (this.keyId === keyId) this.copyFeedback.set('copyError');
    }
  }

  peopleLabel(): string { return this.language.resolveText(this.people.label); }
  text(label: keyof typeof copy): string { return this.language.resolveText(copy[label]); }
  date(value: string): string { return trustDate(value, this.language.getLang$i()); }

  keyInTabs(event: KeyboardEvent, target: ContentTab): void {
    const choices: ContentTab[] = ['sos', 'messages'];
    const next = event.key === 'Home' ? choices[0] : event.key === 'End' ? choices[1]
      : ['ArrowRight', 'ArrowLeft'].includes(event.key) ? choices[1 - choices.indexOf(target)] : null;
    if (!next) return;
    event.preventDefault();
    this.tab.set(next);
    this.document.getElementById(`trusted-tab-${next}`)?.focus();
  }

  openRecording(record: PersonRecord, trigger: HTMLButtonElement): void {
    if (!this.incoming() || !isVaultMediaAvailable(record.item)) return;
    this.selection.set({ kind: 'record', id: record.id, tab: record.message ? 'messages' : 'sos' });
    this.openViewer(trigger);
    if (record.message && !record.message.isRead) this.markRead(record.message.deliveryId);
  }

  openLive(stream: TrustedLiveStream, trigger: HTMLButtonElement): void {
    const id = liveWatchId(stream);
    if (!id || !this.incoming()) return;
    this.selection.set({ kind: 'live', id });
    this.openViewer(trigger);
  }

  closeViewer(): void {
    if (this.viewer?.nativeElement.open) this.viewer.nativeElement.close?.();
    this.viewerClosed();
  }

  viewerClosed(): void {
    if (this.viewer?.nativeElement.open) return;
    this.selection.set(null);
    if (this.viewTrigger?.isConnected) this.viewTrigger.focus({ preventScroll: true });
    this.viewTrigger = undefined;
  }

  viewerTitle(): string {
    const selection = this.selection();
    if (selection?.kind === 'live') return this.live()?.title || this.text('stream');
    return this.activeRecording()?.item.customTitle || this.text(selection?.tab === 'messages' ? 'message' : 'recording');
  }

  mapUrl(location: unknown): string | null {
    const point = locationPoint(location);
    return point ? `https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lng}#map=16/${point.lat}/${point.lng}` : null;
  }

  confirmRemove(target: TrustContact): void {
    if (target.targetType !== 'user' || target.keyId !== this.keyId) return;
    this.removeError.set(false);
    this.removeDialog.nativeElement.showModal();
  }

  closeRemove(): void {
    if (this.removeDialog?.nativeElement.open) this.removeDialog.nativeElement.close?.();
  }

  removeContact(): void {
    if (!this.contact() || this.removing()) return;
    const keyId = this.keyId;
    this.removing.set(true);
    this.removeError.set(false);
    this.auth.removeTrustedUser(keyId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.removing.set(false);
        if (keyId !== this.keyId) return;
        this.catalog.set(null);
        this.clearProtected();
        this.closeRemove();
        this.refresh();
        void this.router.navigateByUrl(this.people.route);
      },
      error: () => {
        this.removing.set(false);
        if (keyId === this.keyId) this.removeError.set(true);
      },
    });
  }

  saveState(assetId: string): VaultSaveLabel {
    return this.vaultSaveState().get(assetId) ?? 'save';
  }

  vaultLabel(key: VaultSaveLabel): string {
    return this.language.resolveText(vaultText[key]);
  }

  saveToVault(video: Pick<VideoDataI, 'mediaAssetId' | 'evidenceStatus'>): void {
    const assetId = video.mediaAssetId;
    if (!this.incoming() || !assetId || video.evidenceStatus !== 'sealed' ||
      ['saving', 'saved'].includes(this.saveState(assetId))) return;
    this.setVaultSaveState(assetId, 'saving');
    this.vaultApi.saveTrustedRecording(assetId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.setVaultSaveState(assetId, 'saved'),
      error: (response: HttpErrorResponse) => {
        const code = response.error?.error;
        this.setVaultSaveState(assetId, code === 'vault_quota_exceeded' ? 'quota'
          : code === 'vault_requires_sealed_evidence' ? 'unsealed' : 'error');
      }
    });
  }

  private setVaultSaveState(assetId: string, value: VaultSaveLabel): void {
    this.vaultSaveState.update(current => new Map(current).set(assetId, value));
  }

  private fetchProfile(keyId: string) {
    this.clearTimers();
    this.loading.set(true);
    this.profileError.set(false);
    const detail = keyId ? this.auth.getTrustedUsersByKeyIds([keyId], false) : of([]);
    return forkJoin({ catalog: this.accessApi.catalog(), people: detail }).pipe(
      switchMap(({ catalog, people }) => {
        this.catalog.set(catalog);
        this.profileError.set(false);
        const person: TrustedPersonDetail | undefined = people.find(item => item.keyId === keyId);
        if (person?.trustPolicy?.access?.receivesTheirData !== true ||
            this.contact()?.policy?.access?.receivesTheirData !== true) {
          this.clearProtected();
          return EMPTY;
        }

        this.checkedIncoming.set(true);
        this.archived.set((person.videos ?? []).map(recordFromVideo)
          .sort((a, b) => Date.parse(b.item.createdAt ?? '') - Date.parse(a.item.createdAt ?? '')));
        this.reconcileViewer();
        const senderId = person._id ?? person.id ?? person.userId;
        this.messagesLoading.set(this.messages().length === 0 && !this.messagesError());

        return forkJoin({
          live: this.contentApi.liveStream(keyId).pipe(
            tap(stream => {
              this.live.set(stream);
              this.liveError.set(false);
            }),
            catchError(error => {
              this.live.set(null);
              this.liveError.set(true);
              if (error?.status === 401 || error?.status === 403) this.clearProtected();
              return of(null);
            })
          ),
          messages: senderId ? this.contentApi.messages(senderId).pipe(
            tap(messages => this.reconcileMessages(messages)),
            catchError(error => {
              this.messages.set([]);
              this.messagesError.set(true);
              if (error?.status === 401 || error?.status === 403) this.clearProtected();
              return of([]);
            })
          ) : of([]).pipe(tap(() => this.messagesError.set(true))),
        }).pipe(
          tap(() => this.reconcileViewer()),
          takeUntil(this.protectRevoked)
        );
      }),
      catchError(() => {
        this.clearProtected();
        this.profileError.set(true);
        return EMPTY;
      }),
      finalize(() => {
        this.messagesLoading.set(false);
        this.loading.set(false);
        this.scheduleRefresh();
      }),
    );
  }

  private reconcileMessages(messages: RecordingMessage[]): void {
    this.messagesError.set(false);
    this.messages.set(messages.map(message => this.acknowledgedReads.has(message.deliveryId)
      ? { ...message, isRead: true }
      : message
    ));
  }

  private markRead(deliveryId: string): void {
    if (this.pendingReads().has(deliveryId) || this.acknowledgedReads.has(deliveryId)) return;
    this.pendingReads.update(ids => new Set(ids).add(deliveryId));
    this.contentApi.markRead(deliveryId).pipe(
      takeUntil(this.protectRevoked),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.pendingReads.update(ids => {
        const next = new Set(ids);
        next.delete(deliveryId);
        return next;
      }))
    ).subscribe({
      next: () => {
        this.acknowledgedReads.add(deliveryId);
        this.reconcileMessages(this.messages());
      },
      error: error => {
        if (error?.status === 401 || error?.status === 403) {
          this.clearProtected();
          this.refresh();
        }
      },
    });
  }

  private clearProtected(): void {
    this.checkedIncoming.set(false);
    this.protectRevoked.next();
    this.closeViewer();
    this.archived.set([]);
    this.messages.set([]);
    this.pendingReads.set(new Set());
    this.acknowledgedReads.clear();
    this.messagesError.set(false);
    this.liveError.set(false);
    this.live.set(null);
  }

  private openViewer(trigger: HTMLButtonElement): void {
    this.viewTrigger = trigger;
    this.cdr.detectChanges();
    this.viewer.nativeElement.showModal();
  }

  private reconcileViewer(): void {
    if (this.selection() && !this.activeRecording() && !this.liveUrl()) this.closeViewer();
  }

  private clearTimers(): void {
    const view = this.document.defaultView;
    view?.clearTimeout(this.refreshTimer);
    view?.clearTimeout(this.deadlineTimer);
  }

  private scheduleRefresh(): void {
    if (!this.browser || this.destroyed) return;
    this.clearTimers();
    const view = this.document.defaultView;
    if (!view) return;
    const catalog = this.catalog();
    const now = Date.now() + (catalog?.clockOffset ?? 0);
    const deadline = Date.parse(this.contact()?.policy?.graceEndsAt ?? '');
    const pendingEvidence = this.archived().some(record => !isVaultMediaAvailable(record.item) &&
      Date.parse(record.item.evidenceProcessingDeadlineAt ?? '') > now);
    this.zone.runOutsideAngular(() => {
      this.refreshTimer = view.setTimeout(() => this.zone.run(() => this.refreshVisibleAccess()), pendingEvidence ? 3_000 : 15_000);
      if (this.incoming() && deadline > now) {
        this.deadlineTimer = view.setTimeout(() => this.zone.run(() => {
          this.clearProtected();
          this.refreshVisibleAccess();
        }), deadline - now + 50);
      }
    });
  }
}
