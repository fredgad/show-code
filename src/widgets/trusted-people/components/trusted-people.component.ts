import { DOCUMENT, Location, NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, NgZone, OnInit, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AvatarComponent } from '@features';
import { copyText } from '@shared/helpers';
import { AuthService, LangService } from '@shared/services';
import { AppStoreFacade } from '@store';
import { Observable, Subject, catchError, distinctUntilChanged, finalize, map, of, switchMap, throwError } from 'rxjs';
import { PROFILE_NAVIGATION } from '../../../pages/profile/profile-navigation';
import {
  TrustedOrganizationApiService, TrustedOrganizationRelationship, organizationHasContract, organizationLogoUrl
} from '../../../pages/trusted-organization/trusted-organization.api';
import { OperatorInvitation, TrustAccessApiService, TrustCatalog, TrustContact, contactIdentity } from '../access/trust-access-api.service';
import { TRUST_ACCESS_TEXT, trustDate } from '../access/trust-access.text';
import { TrustedAccessSettingsComponent } from '../access/trusted-access-settings.component';
import { TRUSTED_PEOPLE_TEXT } from './trusted-people.text';

type Panel = 'people' | 'incoming' | 'outgoing';
type Action = 'accept' | 'decline' | 'cancel' | 'remove';

interface ListedContact extends TrustContact {
  operatorInviteId?: string;
  requiresContract?: boolean;
}

const copy = { ...TRUSTED_PEOPLE_TEXT, ...TRUST_ACCESS_TEXT };

const actionText = {
  accept: { question: 'confirmAccept', done: 'accepted' },
  decline: { question: 'confirmDecline', done: 'declined' },
  cancel: { question: 'confirmCancel', done: 'cancelled' },
  remove: { question: 'confirmRemove', done: 'removed' }
} as const;

@Component({
  selector: 'org-trusted-people',
  standalone: true,
  imports: [AvatarComponent, NgTemplateOutlet, RouterLink, TrustedAccessSettingsComponent],
  templateUrl: './trusted-people.component.html',
  styleUrl: './trusted-people.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrustedPeopleComponent implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly auth = inject(AuthService);
  private readonly language = inject(LangService);
  private readonly store = inject(AppStoreFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly api = inject(TrustAccessApiService);
  private readonly organizationApi = inject(TrustedOrganizationApiService);
  private readonly zone = inject(NgZone);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);
  private readonly catalogRequests = new Subject<void>();
  private readonly invitationRequests = new Subject<void>();
  private readonly account = toSignal(this.store.userData$);
  private readonly trustedPeople = toSignal(this.store.trustedPeople$, { initialValue: [] });
  private readonly requestProfiles = toSignal(this.store.userData$.pipe(
    map(({ incomingReq, outgoingReq }) => ({ incomingReq, outgoingReq })),
    distinctUntilChanged((left, right) => left.incomingReq === right.incomingReq && left.outgoingReq === right.outgoingReq),
    switchMap(({ incomingReq, outgoingReq }) => this.auth.getTrustedUsersByKeyIds(
      [...(incomingReq ?? []), ...(outgoingReq ?? [])], false
    ).pipe(catchError(() => of([]))))
  ), { initialValue: [] });

  readonly destination = PROFILE_NAVIGATION.trustedPeople;
  readonly panel = toSignal(this.route.queryParamMap.pipe(
    map((params): Panel => {
      const requests = params.get('requests');
      return requests === 'incoming' || requests === 'outgoing' ? requests : 'people';
    })
  ), { initialValue: 'people' });

  readonly status = toSignal(this.store.userLoadStatus$, { initialValue: 'idle' });
  readonly loading = computed(() => this.status() === 'idle' || this.status() === 'loading');
  readonly incoming = computed(() => this.account()?.incomingReq ?? []);
  readonly outgoing = computed(() => this.account()?.outgoingReq ?? []);
  private readonly trustedOrganizations = computed(() => this.account()?.trustedOrganizations ?? []);
  private readonly organizationRequests = computed(() => {
    const account = this.account();
    return account?.incomingOrganizationTrustRequests ?? account?.organizationTrustRequests ?? [];
  });
  private readonly operatorInvitations = signal<OperatorInvitation[]>([]);
  readonly invitationsLoading = signal(false);
  readonly invitationsError = signal(false);
  readonly incomingCount = computed(() => this.incoming().length + this.organizationRequests().length + this.operatorInvitations().length);
  readonly catalog = signal<TrustCatalog | null>(null);
  readonly catalogLoading = signal(false);
  cardIdentity(person: ListedContact): string {
    if (person.operatorInviteId) return `operator:${person.operatorInviteId}`;
    return person.trustedTargetId ? `organization:${person.trustedTargetId}` : contactIdentity(person);
  }
  readonly people = computed<TrustContact[]>(() => {
    const catalog = this.catalog();
    const organizations = this.trustedOrganizations();
    if (catalog) return catalog.contacts.map(person => {
      if (person.targetType === 'user') return person;
      return {
        ...person,
        image: organizationLogoUrl(person.image),
        trustedTargetId: person.trustedTargetId ?? organizations.find(item => item.organization?.publicKeyId === person.keyId)?.trustedTargetId
      };
    });
    const pending = new Set([...this.incoming(), ...this.outgoing()]);
    const people = this.trustedPeople().filter(person => person?.keyId && !pending.has(person.keyId))
      .map((person): TrustContact => ({ ...person, targetType: 'user', username: person.username || person.keyId }));
    return [...organizations.map(relationship => this.organizationContact(relationship)), ...people];
  });
  readonly visiblePeople = computed<ListedContact[]>(() => {
    const panel = this.panel();
    if (panel === 'people') return this.people();
    const profiles = this.requestProfiles();
    const requests = panel === 'incoming' ? this.incoming() : this.outgoing();
    const personal = requests.map((keyId): ListedContact => {
      const profile = profiles.find(person => person.keyId === keyId);
      return { targetType: 'user', keyId, username: profile?.username || keyId, email: profile?.email ?? undefined, image: profile?.image };
    });
    if (panel !== 'incoming') return personal;
    return [
      ...this.organizationRequests().map(relationship => this.organizationContact(relationship)),
      ...this.operatorInvitations().map((invite): ListedContact => ({
        targetType: 'organization',
        operatorInviteId: invite.inviteId,
        keyId: invite.organization?.publicKeyId ?? '',
        username: invite.organization?.name ?? '',
        image: organizationLogoUrl(invite.organization?.logoUrl)
      })),
      ...personal
    ];
  });

  readonly ownKey = computed(() => this.account()?.keyId);
  readonly notice = signal('');
  readonly working = signal(false);
  readonly disabled = computed(() => this.status() !== 'ready' || this.working());
  readonly dialogError = signal('');
  readonly copiedKey = signal<string | null>(null);
  readonly confirmation = signal<{ action: Action; person: ListedContact } | null>(null);

  constructor() {
    this.catalogRequests.pipe(
      switchMap(() => {
        this.catalogLoading.set(true);
        return this.api.catalog().pipe(
          catchError(() => of(null)),
          finalize(() => this.catalogLoading.set(false))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(catalog => this.catalog.set(catalog));

    this.invitationRequests.pipe(
      switchMap(() => {
        this.invitationsLoading.set(true);
        this.invitationsError.set(false);
        return this.api.operatorInvitations().pipe(
          catchError(() => {
            this.invitationsError.set(true);
            return of([]);
          }),
          finalize(() => this.invitationsLoading.set(false))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(invites => this.operatorInvitations.set(invites));

    effect(onCleanup => {
      const catalog = this.catalog();
      const deadline = Date.parse(catalog?.summary.nextDeadlineAt ?? '');
      if (!this.browser || !catalog || !Number.isFinite(deadline)) return;
      const delay = deadline - Date.now() - catalog.clockOffset;
      const timeout = this.zone.runOutsideAngular(() => window.setTimeout(
        () => this.zone.run(() => this.refreshCatalog()), Math.max(1000, delay + 1000)
      ));
      onCleanup(() => window.clearTimeout(timeout));
    });
  }

  ngOnInit(): void {
    const state = this.location.getState() as Record<string, unknown> | null;
    const organizationNotice = state?.['trustedOrganizationNotice'];
    if (state?.['savedTrustSlots'] || typeof organizationNotice === 'string') {
      this.notice.set(typeof organizationNotice === 'string' ? organizationNotice : this.text('saved'));
      const historyState = { ...state };
      delete historyState['savedTrustSlots'];
      delete historyState['trustedOrganizationNotice'];
      this.location.replaceState(this.location.path(true), '', historyState);
    }
    this.refresh();
  }

  @HostListener('document:visibilitychange')
  refreshAfterReturn(): void {
    if (this.document.visibilityState === 'visible' && !this.working()) this.refresh();
  }

  title(): string {
    return this.language.resolveText(this.destination.label);
  }

  text(label: keyof typeof copy): string {
    return this.language.resolveText(copy[label]);
  }

  name(person: TrustContact): string {
    return person.username?.trim() || person.keyId || this.text('organization');
  }

  detailRoute(person: ListedContact): string[] | null {
    if (person.trustedTargetId) return ['/trusted-organization', person.trustedTargetId];
    return this.panel() === 'people' && person.targetType === 'user'
      ? ['/trusted-profile', person.keyId]
      : null;
  }

  refresh(): void {
    this.store.getUserData(true);
    this.refreshCatalog();
    this.invitationRequests.next();
  }

  refreshCatalog(): void {
    this.catalogRequests.next();
  }

  catalogChanged(catalog: TrustCatalog): void {
    this.catalog.set(catalog);
    this.store.getUserData(true);
  }

  deadline(value: string): string {
    return this.text('deadline').replace('{date}', () => trustDate(value, this.language.getLang$i()));
  }

  occupied(used: number, limit: number): string {
    return this.text('occupied').replace('{used}', String(used)).replace('{limit}', String(limit));
  }

  hasClosedAccess(person: TrustContact): boolean {
    const access = person.policy?.access;
    return !!access && (access.sharesMyData !== true || access.receivesTheirData !== true);
  }

  openAdd(dialog: HTMLDialogElement, input: HTMLInputElement): void {
    this.dialogError.set('');
    input.value = '';
    dialog.showModal();
  }

  submitAdd(event: SubmitEvent, dialog: HTMLDialogElement, input: HTMLInputElement): void {
    event.preventDefault();
    if (this.working()) return;
    const keyId = input.value.trim();
    if (!keyId) {
      this.dialogError.set(this.text('keyRequired'));
      input.focus();
      return;
    }

    this.working.set(true);
    this.dialogError.set('');
    this.auth.addUserByKeyId(keyId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.working.set(false))
    ).subscribe({
      next: result => this.finish(dialog, result?.targetType === 'organization' && result.message ? result.message : this.text('sent')),
      error: error => this.dialogError.set(this.errorText(error))
    });
  }

  openConfirmation(dialog: HTMLDialogElement, action: Action, person: ListedContact): void {
    if (this.disabled()) return;
    this.dialogError.set('');
    this.confirmation.set({ action, person });
    dialog.showModal();
  }

  confirmationTitle(action: Action, person: ListedContact): string {
    if (person.operatorInviteId && action === 'accept') {
      return this.text('confirmOperatorInvite').replace('{name}', () => this.name(person));
    }
    return this.text(actionText[action].question).replace('{name}', () => this.name(person));
  }

  submitConfirmation(event: SubmitEvent, dialog: HTMLDialogElement): void {
    event.preventDefault();
    const selected = this.confirmation();
    if (!selected || this.working()) return;
    const { action, person } = selected;
    this.working.set(true);
    this.dialogError.set('');
    this.applyAction(action, person).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.working.set(false))
    ).subscribe({
      next: result => {
        const done = person.operatorInviteId && action === 'accept' ? 'operatorInviteAccepted' : actionText[action].done;
        this.finish(dialog, result && person.targetType === 'organization' && result.message
          ? result.message : this.text(done));
      },
      error: error => {
        if (person.targetType === 'organization' && error instanceof HttpErrorResponse && [404, 409].includes(error.status)) {
          dialog.close();
          this.notice.set(this.text('organizationRequestChanged'));
          this.refresh();
        } else {
          this.dialogError.set(person.targetType === 'organization' ? this.text('actionError') : this.errorText(error));
        }
      }
    });
  }

  async copyKey(keyId: string, inDialog = false): Promise<void> {
    try {
      await copyText(this.document, keyId);
      this.copiedKey.set(keyId);
    } catch {
      if (inDialog) this.dialogError.set(this.text('copyError'));
      else this.notice.set(this.text('copyError'));
    }
  }

  private organizationContact(relationship: TrustedOrganizationRelationship): ListedContact {
    return {
      targetType: 'organization',
      trustedTargetId: relationship.trustedTargetId,
      keyId: relationship.organization?.publicKeyId ?? '',
      username: relationship.organization?.name ?? '',
      image: organizationLogoUrl(relationship.organization?.logoUrl),
      policy: relationship.trustPolicy ?? undefined,
      requiresContract: organizationHasContract(relationship)
    };
  }

  private applyAction(action: Action, person: ListedContact): Observable<{ message?: string } | void> {
    if (person.operatorInviteId && (action === 'accept' || action === 'decline')) {
      return this.api.respondToOperatorInvitation(person.operatorInviteId, action);
    }
    if (person.targetType === 'organization') {
      const relationship = this.trustedOrganizations().find(item => person.trustedTargetId
        ? item.trustedTargetId === person.trustedTargetId
        : item.organization?.publicKeyId === person.keyId);
      return relationship && action === 'remove'
        ? this.organizationApi.remove(relationship)
        : throwError(() => new HttpErrorResponse({ status: 409 }));
    }
    const { keyId } = person;
    switch (action) {
      case 'accept': return this.auth.acceptTrustedUser(keyId);
      case 'decline': return this.auth.cancelRequest(keyId, 'incoming');
      case 'cancel': return this.auth.cancelRequest(keyId, 'outgoing');
      case 'remove': return this.auth.removeTrustedUser(keyId);
    }
  }

  private finish(dialog: HTMLDialogElement, message: string): void {
    dialog.close();
    this.notice.set(message);
    this.refresh();
  }

  private errorText(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status >= 400 && error.status < 500) {
      const message: unknown = error.error?.error;
      if (typeof message === 'string' && message && message !== 'trust_request_not_found') return message;
    }
    return this.text('actionError');
  }
}
