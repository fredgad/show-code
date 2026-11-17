import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { APP_API_URL } from '@shared/constants';
import { map } from 'rxjs';

export type ProviderId = 'app_store' | 'google_play' | `web:${string}`;
export type PaymentStatus = 'paid' | 'partially_refunded' | 'refunded';
export type SubscriptionStatus = 'active' | 'cancelled' | 'grace' | 'expired' | 'revoked' | 'on_hold';
export type GrantStatus = 'active' | 'revoked' | 'expired' | 'scheduled';
export type ProGrantKind = 'temporary' | 'gift';

export interface BillingPayment {
  id: string;
  provider: ProviderId;
  productCode: string;
  status: PaymentStatus;
  amountMinor: number;
  currencyDecimals: number;
  refundedMinor: number;
  currency: string;
  paidAt: string;
  updatedAt: string;
}

export interface BillingSubscription {
  id: string;
  provider: ProviderId;
  productCode: string;
  status: SubscriptionStatus;
  active: boolean;
  manageable: boolean;
  periodStartsAt: string;
  periodEndsAt: string;
  accessUntil: string | null;
  renewsAt: string | null;
  updatedAt: string;
}

export interface BillingGrant {
  id: string;
  code: string;
  sourceType: string;
  kind?: ProGrantKind;
  status: GrantStatus;
  expiresAt: string | null;
  issuedAt: string | null;
  revokedAt: string | null;
  support?: { reason: string; issuedBy: string; revocationReason: string | null; revokedBy: string | null } | null;
}

interface BillingPaymentPage {
  payments: BillingPayment[];
  nextCursor: string | null;
}

export interface BillingAccount extends BillingPaymentPage {
  account?: { id: string; username: string; email: string; keyId: string };
  canManageBilling: boolean;
  planCode: string;
  recording: { usedBytes: number; limitBytes: number; resetsAt: string };
  storageLimitBytes: number;
  maxTrusted: number;
  subscriptions: BillingSubscription[];
  accessGrants: BillingGrant[];
}

export interface VaultQuota {
  usedBytes: number;
  limitBytes: number;
}

export interface BillingOffer {
  code: 'pro_monthly';
  interval: 'month';
  providers: { id: ProviderId; name: string; displayPrice: string | null }[];
}

@Injectable({ providedIn: 'root' })
export class BillingApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${APP_API_URL}/api/billing`;

  account() {
    return this.http.get<BillingAccount>(`${this.base}/account`);
  }

  vaultQuota() {
    return this.http.get<{ quota?: VaultQuota }>(`${APP_API_URL}/api/vault/quota`).pipe(
      map(({ quota }) =>
        quota &&
        Number.isFinite(quota.usedBytes) && quota.usedBytes >= 0 &&
        Number.isFinite(quota.limitBytes) && quota.limitBytes >= 0
          ? quota
          : null
      )
    );
  }

  purchaseOptions() {
    return this.http.get<{ products: BillingOffer[] }>(`${this.base}/purchase-options?channel=web`);
  }

  startPurchase(productCode: string, provider: ProviderId, requestId: string) {
    return this.http.post<{ action: { kind: 'redirect'; url: string } }>(`${this.base}/purchases/start`, {
      productCode, provider, requestId, channel: 'web',
    });
  }

  manage(subscriptionId: string) {
    return this.http.post<{ url: string }>(`${this.base}/subscriptions/${encodeURIComponent(subscriptionId)}/manage`, {});
  }

  lookup(query: string) {
    return this.http.post<BillingAccount>(`${this.base}/admin/accounts/lookup`, { query });
  }

  adminAccount(ownerId: string) {
    return this.http.get<BillingAccount>(`${this.base}/admin/accounts/${encodeURIComponent(ownerId)}`);
  }

  payments(cursor: string, ownerId?: string) {
    const path = ownerId ? `/admin/accounts/${encodeURIComponent(ownerId)}/payments` : '/payments';
    return this.http.get<BillingPaymentPage>(`${this.base}${path}`, { params: new HttpParams().set('cursor', cursor) });
  }

  issue(ownerId: string, input: { kind: ProGrantKind; days?: number; reason: string; requestId: string }) {
    return this.http.post<BillingAccount>(`${this.base}/admin/accounts/${encodeURIComponent(ownerId)}/pro-grants`, input);
  }

  revoke(ownerId: string, grantId: string, reason: string) {
    return this.http.post<BillingAccount>(
      `${this.base}/admin/accounts/${encodeURIComponent(ownerId)}/pro-grants/${encodeURIComponent(grantId)}/revoke`,
      { reason }
    );
  }
}
