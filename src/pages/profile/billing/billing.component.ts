import { DatePipe, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LangService } from '@shared/services';
import { Observable, finalize } from 'rxjs';
import { BillingAccount, BillingApiService, BillingOffer, ProGrantKind, ProviderId, VaultQuota } from './billing-api.service';
import { billingLocales, billingText } from './billing.text';

type Message = keyof typeof billingText;

@Component({
  selector: 'org-billing',
  standalone: true,
  imports: [FormsModule, RouterLink],
  providers: [DatePipe],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingComponent implements OnInit {
  private readonly api = inject(BillingApiService);
  private readonly language = inject(LangService);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly dates = inject(DatePipe);
  private readonly destroyRef = inject(DestroyRef);
  private readonly locale = computed(() => billingLocales[this.language.getLang$i()]);
  private readonly dateFormat = computed(() => new Intl.DateTimeFormat(this.locale(), {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }));
  private readonly grantAttempts = new Map<string, string>();
  private readonly checkoutAttempts = new Map<string, string>();

  readonly admin = this.route.snapshot.data['billingAdmin'] === true;
  readonly canManage = signal(this.admin);
  readonly account = signal<BillingAccount | null>(null);
  readonly vaultQuota = signal<VaultQuota | null>(null);
  readonly vaultQuotaLoading = signal(false);
  readonly offers = signal<BillingOffer[] | null>(null);
  readonly offersError = signal(false);
  readonly busy = signal(false);
  readonly error = signal<Message | null>(null);
  readonly saved = signal(false);
  readonly hasSubscription = computed(() => this.account()?.subscriptions.some(item => item.manageable) ?? false);
  readonly giftUntil = computed(() => {
    let latest: string | null = null;
    for (const grant of this.account()?.accessGrants ?? []) {
      const expiresAt = grant.expiresAt;
      if (grant.kind === 'gift' && grant.status === 'active' && expiresAt &&
          (latest === null || Date.parse(expiresAt) > Date.parse(latest))) {
        latest = expiresAt;
      }
    }
    return latest;
  });
  query = '';
  grantKind: ProGrantKind = 'temporary';
  grantDays: number | null = 30;
  grantReason = '';
  revokeId = '';
  revokeReason = '';

  ngOnInit(): void {
    this.refresh();
  }

  text(key: Message): string {
    return this.language.resolveText(billingText[key]);
  }

  plan(code: string): string {
    if (code === 'free_plus' || code === 'free_plus_lifetime') return 'Free+';
    if (code === 'pro' || code === 'pro_access' || code === 'care') return 'Pro';
    return code === 'free' ? 'Free' : code;
  }

  provider(id: ProviderId): string {
    if (id === 'app_store') return 'App Store';
    if (id === 'google_play') return 'Google Play';
    return this.text('website');
  }

  source(code: string): string {
    return code === 'promotion' || code === 'support' || code === 'migration' ? this.text(code) : code;
  }

  date(value: string, utc = false): string {
    if (utc) return `${this.dates.transform(value, 'yyyy-MM-dd HH:mm', 'UTC')} UTC`;
    return this.dateFormat().format(new Date(value));
  }

  bytes(value: number): string {
    const mib = value / 1_048_576;
    return `${new Intl.NumberFormat(this.locale(), { maximumFractionDigits: 1 }).format(mib >= 1_024 ? mib / 1_024 : mib)} ${this.text(mib >= 1_024 ? 'gib' : 'mib')}`;
  }

  amount(minor: number, currency: string, digits: number): string {
    return new Intl.NumberFormat(this.locale(), {
      style: 'currency', currency, minimumFractionDigits: digits, maximumFractionDigits: digits,
    }).format(minor / 10 ** digits);
  }

  managementUrl(provider: ProviderId): string | null {
    if (provider === 'app_store') return 'https://apps.apple.com/account/subscriptions';
    if (provider === 'google_play') return 'https://play.google.com/store/account/subscriptions';
    return null;
  }

  manage(subscriptionId: string): void {
    this.run(this.api.manage(subscriptionId), result => this.document.location.assign(result.url));
  }

  refresh(): void {
    if (this.busy()) return;
    if (this.admin) {
      const ownerId = this.account()?.account?.id ?? this.route.snapshot.paramMap.get('ownerId');
      if (ownerId) this.run(this.api.adminAccount(ownerId), account => this.account.set(account));
      return;
    }
    this.run(this.api.account(), account => {
      this.account.set(account);
      if (!this.hasSubscription()) this.loadOffers();
    });
    this.loadVaultQuota();
  }

  loadOffers(): void {
    this.offersError.set(false);
    this.api.purchaseOptions().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => this.offers.set(result.products),
      error: () => {
        this.offers.set(null);
        this.offersError.set(true);
      },
    });
  }

  lookup(): void {
    if (!this.canManage() || !this.query.trim() || this.busy()) return;
    this.account.set(null);
    this.revokeId = '';
    this.revokeReason = '';
    this.grantReason = '';
    this.run(this.api.lookup(this.query.trim()), account => this.account.set(account));
  }

  loadMore(): void {
    const previous = this.account();
    if (!previous?.nextCursor) return;
    this.run(this.api.payments(previous.nextCursor, previous.account?.id), result => {
      const known = new Set(previous.payments.map(payment => payment.id));
      this.account.set({
        ...previous,
        payments: [...previous.payments, ...result.payments.filter(payment => !known.has(payment.id))],
        nextCursor: result.nextCursor,
      });
    });
  }

  checkout(offer: BillingOffer, provider: ProviderId): void {
    if (this.busy() || this.hasSubscription()) return;
    const key = `${offer.code}/${provider}`;
    const requestId = this.checkoutAttempts.get(key) ?? crypto.randomUUID();
    this.checkoutAttempts.set(key, requestId);
    this.run(this.api.startPurchase(offer.code, provider, requestId), result => {
      this.checkoutAttempts.delete(key);
      this.document.location.assign(result.action.url);
    });
  }

  get canIssue(): boolean {
    const days = this.grantDays;
    return !this.busy() && Boolean(this.grantReason.trim()) &&
      (this.grantKind === 'gift' || (days !== null && Number.isInteger(days) && days >= 1 && days <= 365));
  }

  issue(): void {
    const ownerId = this.account()?.account?.id;
    if (!ownerId || !this.canIssue) return;
    const kind = this.grantKind;
    const days = kind === 'temporary' ? this.grantDays : null;
    const reason = this.grantReason.trim();
    const key = JSON.stringify([ownerId, kind, days, reason]);
    const requestId = this.grantAttempts.get(key) ?? crypto.randomUUID();
    this.grantAttempts.set(key, requestId);
    this.run(this.api.issue(ownerId, { kind, ...(days !== null && { days }), reason, requestId }), account => {
      this.grantAttempts.delete(key);
      this.grantReason = '';
      this.account.set(account);
      this.saved.set(true);
    });
  }

  revoke(): void {
    const ownerId = this.account()?.account?.id;
    if (!ownerId || !this.revokeId || !this.revokeReason.trim() || this.busy()) return;
    this.run(this.api.revoke(ownerId, this.revokeId, this.revokeReason.trim()), account => {
      this.revokeId = '';
      this.revokeReason = '';
      this.account.set(account);
      this.saved.set(true);
    });
  }

  private loadVaultQuota(): void {
    if (this.vaultQuotaLoading()) return;
    this.vaultQuotaLoading.set(true);
    this.api.vaultQuota().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.vaultQuotaLoading.set(false))
    ).subscribe({
      next: quota => this.vaultQuota.set(quota),
      error: () => this.vaultQuota.set(null),
    });
  }

  private run<T>(request: Observable<T>, onSuccess: (result: T) => void): void {
    if (this.busy()) return;
    this.error.set(null);
    this.saved.set(false);
    this.busy.set(true);
    request.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.busy.set(false))).subscribe({
      next: onSuccess,
      error: (error: HttpErrorResponse) => {
        if ((error.status === 401 || error.status === 403) && this.admin) {
          this.canManage.set(false);
          this.account.set(null);
        }
        this.error.set(error.status === 401 ? 'signedOut' : error.status === 403 ? 'forbidden' :
          error.error?.error === 'billing_user_not_found' ? 'missing' :
          error.error?.error === 'billing_subscription_already_active' ? 'alreadySubscribed' :
          error.error?.error === 'billing_reason_invalid' ? 'invalidReason' :
          error.error?.error === 'billing_grant_invalid' ? 'invalidGrant' : 'error');
      },
    });
  }
}
