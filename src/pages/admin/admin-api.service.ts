import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { APP_API_URL } from '@shared/constants';
import { LocalStorageService } from '@shared/services';
import { Observable, finalize, shareReplay } from 'rxjs';
import type { BillingPayment } from '../profile/billing/billing-api.service';

export interface AdminSession {
  id: string;
  username: string;
  permissions: { users: boolean; billing: boolean };
}

export interface AdminPage<T> {
  items: T[];
  nextCursor: string | null;
}

export type AdminProSource = 'paid' | 'gift' | 'support' | 'migration' | 'subscription' | 'other';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  keyId: string;
  planCode: 'free' | 'free_plus' | 'pro';
  proSources?: AdminProSource[];
}

export interface AdminPayment extends BillingPayment {
  ownerId: string;
  account: Pick<AdminUser, 'username' | 'email'> | null;
}

export interface AdminAuditEvent {
  id: string;
  action: 'pro_granted' | 'pro_revoked' | 'gift_pro_granted' | 'gift_pro_revoked';
  occurredAt: string;
  expiresAt: string | null;
  reason: string;
  actor: { id: string; username: string | null };
  account: Pick<AdminUser, 'id' | 'username' | 'email'>;
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(LocalStorageService);
  private readonly base = `${APP_API_URL}/api/admin`;
  private sessionRequest?: { token: string | null; request: Observable<{ admin: AdminSession }> };

  session() {
    const token = this.storage.getItem('token');
    if (this.sessionRequest && this.sessionRequest.token === token) {
      return this.sessionRequest.request;
    }
    const request = this.http.get<{ admin: AdminSession }>(`${this.base}/session`).pipe(
      finalize(() => {
        if (this.sessionRequest?.request === request) this.sessionRequest = undefined;
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    this.sessionRequest = { token, request };
    return request;
  }

  users(filters: { q: string; plan: string; proSource: string }, cursor?: string) {
    return this.page<AdminUser>('users', filters, cursor);
  }

  payments(filters: { provider: string; status: string }, cursor?: string) {
    return this.page<AdminPayment>('payments', filters, cursor);
  }

  audit(filters: { action: string; mine: string }, cursor?: string) {
    return this.page<AdminAuditEvent>('audit', filters, cursor);
  }

  private page<T>(path: string, filters: Record<string, string>, cursor?: string) {
    const params = new HttpParams({ fromObject: Object.fromEntries(
      Object.entries({ ...filters, cursor }).filter((entry): entry is [string, string] => Boolean(entry[1]))
    ) });
    return this.http.get<AdminPage<T>>(`${this.base}/${path}`, { params });
  }
}
