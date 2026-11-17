import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LangService } from '@shared/services';
import { finalize, Observable } from 'rxjs';
import { billingLocales } from '../profile/billing/billing.text';
import { AdminApiService, AdminAuditEvent, AdminPage, AdminPayment, AdminProSource, AdminUser } from './admin-api.service';
import { adminText } from './admin.text';

@Component({
  selector: 'org-admin-records',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-records.component.html',
  styleUrl: './admin-records.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRecordsComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly language = inject(LangService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly locale = computed(() => billingLocales[this.language.getLang$i()]);
  private readonly dates = computed(() => new Intl.DateTimeFormat(this.locale(), { dateStyle: 'medium', timeStyle: 'short' }));

  readonly section: 'users' | 'payments' | 'audit' = inject(ActivatedRoute).snapshot.data['section'];
  readonly users = signal<AdminUser[]>([]);
  readonly payments = signal<AdminPayment[]>([]);
  readonly audit = signal<AdminAuditEvent[]>([]);
  readonly busy = signal(false);
  readonly cursor = signal<string | null>(null);
  readonly error = signal<'error' | 'adminForbidden' | 'loginRequired' | null>(null);
  readonly plans = { free: 'Free', free_plus: 'Free+', pro: 'Pro' };
  readonly proSourceLabels = {
    paid: 'proPaid', gift: 'proGift', support: 'proSupport', migration: 'proMigration',
    subscription: 'proUnconfirmed', other: 'proOther',
  } as const satisfies Record<AdminProSource, keyof typeof adminText>;
  readonly proSourceOptions = Object.keys(this.proSourceLabels) as AdminProSource[];
  readonly paymentStatuses = ['paid', 'partially_refunded', 'refunded'] as const;
  readonly auditActionLabels = {
    pro_granted: 'granted',
    pro_revoked: 'revokedPro',
    gift_pro_granted: 'giftGranted',
    gift_pro_revoked: 'giftRevoked',
  } as const satisfies Record<AdminAuditEvent['action'], keyof typeof adminText>;
  query = '';
  plan = '';
  proSource: AdminProSource | '' = '';
  providerFilter = '';
  status = '';
  mine = false;
  action = '';

  private userFilters = { q: '', plan: '', proSource: '' };
  private paymentFilters = { provider: '', status: '' };
  private auditFilters = { mine: '', action: '' };

  ngOnInit(): void {
    this.applyFilters();
  }

  text(key: keyof typeof adminText): string {
    return this.language.resolveText(adminText[key]);
  }

  date(date: string): string {
    return this.dates().format(new Date(date));
  }

  provider(value: string): string {
    if (value === 'app_store') return 'App Store';
    if (value === 'google_play') return 'Google Play';
    return this.text('website');
  }

  money(amount: number, { currency, currencyDecimals }: AdminPayment): string {
    return new Intl.NumberFormat(this.locale(), {
      style: 'currency', currency, minimumFractionDigits: currencyDecimals, maximumFractionDigits: currencyDecimals,
    }).format(amount / 10 ** currencyDecimals);
  }

  applyFilters(): void {
    if (this.busy()) return;
    this.userFilters = { q: this.query.trim(), plan: this.plan, proSource: this.proSource };
    this.paymentFilters = { provider: this.providerFilter, status: this.status };
    this.auditFilters = { mine: this.mine ? '1' : '', action: this.action };
    this.refresh();
  }

  refresh(cursor?: string): void {
    if (this.busy()) return;
    switch (this.section) {
      case 'users': return this.load(this.api.users(this.userFilters, cursor), this.users, Boolean(cursor));
      case 'payments': return this.load(this.api.payments(this.paymentFilters, cursor), this.payments, Boolean(cursor));
      case 'audit': return this.load(this.api.audit(this.auditFilters, cursor), this.audit, Boolean(cursor));
    }
  }

  private load<T extends { id: string }>(request: Observable<AdminPage<T>>, rows: WritableSignal<T[]>, append: boolean) {
    this.error.set(null);
    if (!append) {
      rows.set([]);
      this.cursor.set(null);
    }
    this.busy.set(true);
    request.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.busy.set(false))).subscribe({
      next: result => {
        if (append) {
          const known = new Set(rows().map(row => row.id));
          rows.update(previous => [...previous, ...result.items.filter(row => !known.has(row.id))]);
        } else {
          rows.set(result.items);
        }
        this.cursor.set(result.nextCursor);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          rows.set([]);
          this.cursor.set(null);
        }
        this.error.set(error.status === 401 ? 'loginRequired' : error.status === 403 ? 'adminForbidden' : 'error');
      },
    });
  }
}
