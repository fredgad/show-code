import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, NgZone, PLATFORM_ID, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { copyText } from '@shared/helpers';
import { LangService } from '@shared/services';
import { AppStoreFacade } from '@store';
import { HeaderComponent } from '@widgets/header';
import { Subject, catchError, distinctUntilChanged, finalize, map, of, startWith, switchMap, tap } from 'rxjs';
import { TrustAccessApiService, TrustCatalog } from '../../widgets/trusted-people/access/trust-access-api.service';
import { trustDate } from '../../widgets/trusted-people/access/trust-access.text';
import { TrustedAccessSettingsComponent } from '../../widgets/trusted-people/access/trusted-access-settings.component';
import { PROFILE_NAVIGATION } from '../profile/profile-navigation';
import { PROFILE_TEXT } from '../profile/profile.text';
import { OrganizationContract } from './contracts/organization-contracts-api.service';
import { OrganizationContractsComponent } from './contracts/organization-contracts.component';
import { TrustedOrganizationApiService, TrustedOrganizationRelationship, organizationHasContract, organizationLogoUrl } from './trusted-organization.api';
import { TRUSTED_ORGANIZATION_TEXT } from './trusted-organization.text';

type Status = 'loading' | 'ready' | 'unavailable' | 'error';
type Action = 'accept' | 'decline' | 'remove';
interface Confirmation {
  action: 'decline' | 'remove';
  targetId: string;
  requestRevision: string;
  contractId?: string;
  snapshotHash?: string;
}

@Component({
  selector: 'org-trusted-organization',
  standalone: true,
  imports: [HeaderComponent, RouterLink, TrustedAccessSettingsComponent, OrganizationContractsComponent],
  templateUrl: './trusted-organization.component.html',
  styleUrls: ['../../widgets/trusted-people/access/trust-controls.scss', './trusted-organization.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrustedOrganizationComponent {
  private readonly api = inject(TrustedOrganizationApiService);
  private readonly trustApi = inject(TrustAccessApiService);
  private readonly language = inject(LangService);
  private readonly store = inject(AppStoreFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly accountRequests = new Subject<void>();
  private readonly catalogRequests = new Subject<void>();
  private readonly contract = signal<OrganizationContract | null>(null);

  @ViewChild(OrganizationContractsComponent) private contracts?: OrganizationContractsComponent;
  @ViewChild('confirmationDialog') private confirmationDialog?: ElementRef<HTMLDialogElement>;
  @ViewChild('logoDialog') private logoDialog?: ElementRef<HTMLDialogElement>;

  readonly destination = PROFILE_NAVIGATION.trustedPeople;
  readonly relation = signal<TrustedOrganizationRelationship | null>(null);
  readonly organizationName = computed(() => this.relation()?.organization?.name?.trim() || this.text('organization'));
  readonly initials = computed(() => this.organizationName().split(/\s+/)
    .map(word => word.match(/[\p{L}\p{N}]/u)?.[0] ?? '')
    .filter(Boolean).slice(0, 2).join('').toLocaleUpperCase() || 'ES');
  readonly logoFailed = signal(false);
  readonly logo = computed(() => this.logoFailed() ? null : organizationLogoUrl(this.relation()?.organization?.logoUrl));
  readonly description = computed(() => this.relation()?.organization?.description?.trim()
    || this.text(this.relation()?.status === 'pending' ? 'pendingDescription' : 'activeDescription'));
  readonly since = computed(() => {
    const relation = this.relation();
    const date = relation?.respondedAt ?? relation?.createdAt;
    return date ? this.text('trustedSince').replace('{date}', () => this.date(date)) : '';
  });
  readonly status = signal<Status>('loading');
  readonly refreshing = signal(false);
  readonly working = signal(false);
  readonly notice = signal('');
  readonly error = signal('');
  readonly copied = signal(false);
  readonly tab = signal<'video' | 'messages'>('video');
  readonly catalog = signal<TrustCatalog | null>(null);
  readonly catalogLoading = signal(false);
  readonly confirmation = signal<Confirmation | null>(null);
  readonly policy = computed(() => this.relation()?.trustPolicy);
  readonly canOpenContent = computed(() => this.policy()?.access.receivesTheirData === true);
  readonly showDetails = computed(() => this.relation()?.status === 'pending' || this.canOpenContent());
  readonly hasContract = computed(() => {
    const relation = this.relation();
    return !!relation && organizationHasContract(relation);
  });
  readonly contractIdentity = computed(() => {
    const contract = this.contract();
    const relation = this.relation();
    if (!this.hasContract()) return { noContract: true } as const;
    if (!contract?.contractId || !contract.snapshotHash || contract.contractId !== (relation?.contractId ?? relation?.contract?.contractId)) return null;
    return { contractId: contract.contractId, snapshotHash: contract.snapshotHash };
  });
  readonly canRespond = computed(() => !!this.relation()?.requestRevision && !!this.contractIdentity());
  readonly canAccept = computed(() => this.canRespond() && (!this.hasContract() || this.contract()?.actions?.canAcceptTrust === true));
  readonly contact = computed(() => {
    const relation = this.relation();
    const keyId = relation?.organization?.publicKeyId;
    return keyId && relation?.status === 'active' ? {
      targetType: 'organization' as const,
      keyId,
      username: this.organizationName(),
      image: this.logo(),
      policy: this.policy() ?? undefined
    } : null;
  });

  constructor() {
    this.route.paramMap.pipe(
      map(params => params.get('trustedTargetId') ?? ''),
      distinctUntilChanged(),
      tap(() => this.reset()),
      switchMap(id => this.accountRequests.pipe(
        startWith(undefined),
        switchMap(() => {
          this.refreshing.set(true);
          return this.api.account().pipe(
            map(account => {
              const incoming = account.incomingOrganizationTrustRequests ?? account.organizationTrustRequests ?? [];
              const relation = [...incoming, ...(account.trustedOrganizations ?? [])].find(item => item.trustedTargetId === id);
              return { relation: relation ?? null, status: relation ? 'ready' as const : 'unavailable' as const };
            }),
            catchError(() => of({ relation: null, status: 'error' as const })),
            finalize(() => this.refreshing.set(false))
          );
        })
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ relation, status }) => {
      const previous = this.relation();
      if (previous?.organization?.logoUrl !== relation?.organization?.logoUrl) this.logoFailed.set(false);
      if (previous?.organization?.publicKeyId !== relation?.organization?.publicKeyId) this.copied.set(false);
      this.relation.set(relation);
      this.status.set(status);
      if (!this.showDetails() && this.logoDialog?.nativeElement.open) this.logoDialog.nativeElement.close();
      if (relation?.contractId !== previous?.contractId || relation?.requestRevision !== previous?.requestRevision) {
        this.contract.set(null);
        this.contracts?.refresh();
      }
    });

    this.catalogRequests.pipe(
      switchMap(() => {
        this.catalogLoading.set(true);
        return this.trustApi.catalog().pipe(catchError(() => of(null)), finalize(() => this.catalogLoading.set(false)));
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(catalog => this.catalog.set(catalog));

    if (this.browser) {
      const timer = this.zone.runOutsideAngular(() => window.setInterval(
        () => this.zone.run(() => this.refreshVisibleAccess()), 30_000
      ));
      this.destroyRef.onDestroy(() => window.clearInterval(timer));
      effect(onCleanup => {
        const grace = this.policy();
        const deadline = Date.parse(grace?.graceEndsAt ?? '');
        if (grace?.allocationState !== 'grace' || !Number.isFinite(deadline)) return;
        const timeout = this.zone.runOutsideAngular(() => window.setTimeout(
          () => this.zone.run(() => this.refreshVisibleAccess()), Math.max(1000, deadline - Date.now() + 1000)
        ));
        onCleanup(() => window.clearTimeout(timeout));
      });
    }
  }

  text(label: keyof typeof TRUSTED_ORGANIZATION_TEXT): string {
    return this.language.resolveText(TRUSTED_ORGANIZATION_TEXT[label]);
  }

  peopleLabel(): string {
    return this.language.resolveText(this.destination.label);
  }

  supportLabel(): string { return this.language.resolveText(PROFILE_TEXT.support); }

  date(value: string): string {
    return trustDate(value, this.language.getLang$i());
  }

  accessSummary(): string {
    const policy = this.policy();
    if (!policy) return this.text('unknown');
    if (policy.allocationState === 'suspended') return this.text('tariffPaused');
    if (policy.allocationState === 'grace' && policy.graceEndsAt) {
      return this.text('deadline').replace('{date}', () => this.date(policy.graceEndsAt!));
    }
    if (policy.manualPausedAt) return this.text('pausedByMe');
    return this.text(this.canOpenContent() ? 'accessSummary' : 'accessClosed');
  }

  @HostListener('document:visibilitychange')
  refreshAfterReturn(): void {
    if (this.document.visibilityState !== 'visible') return;
    this.refreshVisibleAccess();
    if (!this.working()) this.contracts?.refresh();
  }

  refreshVisibleAccess(): void {
    if (this.document.visibilityState !== 'visible' || this.working() || this.refreshing()) return;
    this.accountRequests.next();
    if (this.catalog() && !this.catalogLoading()) this.refreshCatalog();
  }

  refresh(): void {
    this.accountRequests.next();
    this.contracts?.refresh();
  }

  refreshCatalog(): void { this.catalogRequests.next(); }

  catalogChanged(catalog: TrustCatalog): void {
    this.catalog.set(catalog);
    this.accountRequests.next();
    this.store.getUserData(true);
  }

  openSettings(settings: TrustedAccessSettingsComponent): void {
    const contact = this.contact();
    if (!contact) return;
    settings.open(contact);
    this.refreshCatalog();
  }

  setContract(contract: OrganizationContract | null): void { this.contract.set(contract); }

  contractBusy(): boolean { return this.contracts?.busy() ?? false; }

  async copyKey(keyId: string): Promise<void> {
    const id = this.relation()?.trustedTargetId;
    this.error.set('');
    try {
      await copyText(this.document, keyId);
      if (id === this.relation()?.trustedTargetId) this.copied.set(true);
    } catch {
      if (id === this.relation()?.trustedTargetId) this.error.set(this.text('copyError'));
    }
  }

  ask(dialog: HTMLDialogElement, action: 'decline' | 'remove'): void {
    const relation = this.relation();
    const identity = this.contractIdentity();
    if (this.working() || !relation?.requestRevision || (action === 'decline' && (!identity || this.contractBusy()))) return;
    this.error.set('');
    this.confirmation.set({
      action,
      targetId: relation.trustedTargetId,
      requestRevision: relation.requestRevision,
      ...(action === 'decline' && identity && 'contractId' in identity && identity)
    });
    dialog.showModal();
  }

  confirmationTitle(action: 'decline' | 'remove'): string {
    return this.text(action === 'decline' ? 'confirmDecline' : 'confirmRemove')
      .replace('{name}', () => this.organizationName());
  }

  submit(event: SubmitEvent, dialog: HTMLDialogElement, confirmation: Confirmation): void {
    event.preventDefault();
    const relation = this.relation();
    const identity = this.contractIdentity();
    const contract = identity && 'contractId' in identity ? identity : null;
    const contractChanged = confirmation.action === 'decline'
      && (!identity || confirmation.contractId !== contract?.contractId || confirmation.snapshotHash !== contract?.snapshotHash);
    if (!relation || confirmation.targetId !== relation.trustedTargetId || confirmation.requestRevision !== relation.requestRevision || contractChanged) {
      this.error.set(this.text('requestChanged'));
      return;
    }
    this.respond(confirmation.action, dialog);
  }

  respond(action: Action, dialog?: HTMLDialogElement): void {
    const relation = this.relation();
    if (this.working() || !relation?.requestRevision) return;
    const identity = this.contractIdentity();
    if (action === 'remove' ? relation.status !== 'active' || this.policy()?.actions.canRemove !== true
      : relation.status !== 'pending' || !identity || this.contractBusy() || (action === 'accept' && !this.canAccept())) return;
    const request = action === 'remove' ? this.api.remove(relation) : this.api.respond(relation, action, identity!);

    this.working.set(true);
    this.error.set('');
    this.notice.set('');
    request.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.working.set(false))).subscribe({
      next: () => {
        this.store.getUserData(true);
        if (this.relation()?.trustedTargetId !== relation.trustedTargetId) return;
        dialog?.close();
        if (action === 'accept') {
          this.notice.set(this.text('acceptedOrganization'));
          this.refresh();
        } else {
          const trustedOrganizationNotice = action === 'decline' ? this.text('declined') : this.text('removedOrganization');
          void this.router.navigate([this.destination.route], {
            queryParams: action === 'decline' ? { requests: 'incoming' } : null,
            state: { trustedOrganizationNotice }
          });
        }
      },
      error: (response: HttpErrorResponse) => {
        if (this.relation()?.trustedTargetId !== relation.trustedTargetId) return;
        const changed = response.status === 404 || response.status === 409;
        const limit = ['trust_slot_limit_reached', 'trust_existing_relationships_waiting'].includes(response.error?.code);
        this.error.set(limit && typeof response.error.error === 'string'
          ? response.error.error : this.text(changed ? 'requestChanged' : 'actionError'));
        if (changed) this.refresh();
      }
    });
  }

  private reset(): void {
    if (this.confirmationDialog?.nativeElement.open) this.confirmationDialog.nativeElement.close();
    if (this.logoDialog?.nativeElement.open) this.logoDialog.nativeElement.close();
    this.relation.set(null);
    this.status.set('loading');
    this.contract.set(null);
    this.copied.set(false);
    this.error.set('');
    this.notice.set('');
    this.tab.set('video');
  }
}
