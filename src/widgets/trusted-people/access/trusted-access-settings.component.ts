import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, EventEmitter, Input, Output, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AvatarComponent } from '@features';
import { LangService } from '@shared/services';
import { finalize } from 'rxjs';
import { TRUSTED_PEOPLE_TEXT } from '../components/trusted-people.text';
import { contactIdentity, TrustAccessApiService, TrustCatalog, TrustContact } from './trust-access-api.service';
import { TRUST_ACCESS_TEXT, trustDate } from './trust-access.text';

interface Change {
  kind: 'pause' | 'resume' | 'transfer-slot';
  target: TrustContact;
  revision: number;
  donor?: TrustContact;
}

const copy = { ...TRUSTED_PEOPLE_TEXT, ...TRUST_ACCESS_TEXT };

@Component({
  selector: 'org-trusted-access-settings',
  standalone: true,
  imports: [AvatarComponent, RouterLink],
  templateUrl: './trusted-access-settings.component.html',
  styleUrls: ['./trust-controls.scss', './trusted-access-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrustedAccessSettingsComponent {
  private readonly api = inject(TrustAccessApiService);
  private readonly language = inject(LangService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly data = signal<TrustCatalog | null>(null);
  @ViewChild('dialog', { static: true }) private dialog!: ElementRef<HTMLDialogElement>;

  @Input() set catalog(value: TrustCatalog | null) { this.data.set(value); }
  @Input() loading = false;
  @Output() readonly changed = new EventEmitter<TrustCatalog>();
  @Output() readonly refreshCatalog = new EventEmitter<void>();
  @Output() readonly removeContact = new EventEmitter<TrustContact>();

  readonly target = signal<TrustContact | null>(null);
  readonly current = computed(() => {
    const target = this.target();
    return target && this.data()?.contacts.find(contact => contactIdentity(contact) === contactIdentity(target));
  });
  readonly donors = computed(() => this.data()?.contacts.filter(contact => contact.policy?.actions.canDonateSlot) ?? []);
  readonly busy = signal(false);
  readonly proposal = signal<Change | null>(null);
  readonly error = signal('');
  readonly notice = signal('');
  readonly contactIdentity = contactIdentity;

  open(target: TrustContact): void {
    this.target.set(target);
    this.proposal.set(null);
    this.error.set('');
    this.notice.set('');
    this.dialog.nativeElement.showModal();
  }

  close(): void { if (!this.busy()) this.dialog.nativeElement.close(); }

  text(label: keyof typeof copy): string {
    return this.language.resolveText(copy[label]);
  }

  deadline(value: string): string {
    return this.text('deadline').replace('{date}', () => trustDate(value, this.language.getLang$i()));
  }

  request(kind: Change['kind'], donorId?: string): void {
    const target = this.current();
    const catalog = this.data();
    if (this.busy() || this.loading || !target || !catalog) return;
    const change: Change = { kind, target, revision: catalog.summary.revision };
    if (kind === 'transfer-slot') {
      change.donor = this.donors().find(contact => contactIdentity(contact) === donorId);
      if (!change.donor) return;
    }
    this.error.set('');
    this.notice.set('');
    if (kind === 'resume') this.apply(change);
    else this.proposal.set(change);
  }

  question(change: Change): string {
    return change.kind === 'pause'
      ? this.text('pauseConfirm').replace('{name}', () => change.target.username || change.target.keyId)
      : this.text('transferConfirm').replace('{from}', () => change.donor?.username || change.donor?.keyId || '')
        .replace('{to}', () => change.target.username || change.target.keyId);
  }

  apply(change: Change): void {
    if (this.busy() || this.loading) return;
    this.busy.set(true);
    this.error.set('');
    this.api.changeAccess(change.kind, change.target, change.revision, change.donor).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.busy.set(false))
    ).subscribe({
      next: catalog => {
        this.data.set(catalog);
        this.proposal.set(null);
        this.notice.set(this.text('updated'));
        this.changed.emit(catalog);
      },
      error: (response: HttpErrorResponse) => {
        this.proposal.set(null);
        this.error.set(this.text(response.status === 409 ? 'policyConflict' : 'actionError'));
        this.refreshCatalog.emit();
      }
    });
  }

  remove(target: TrustContact): void {
    this.close();
    this.removeContact.emit(target);
  }
}
