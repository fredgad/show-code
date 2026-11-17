import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, EventEmitter, Input,
  OnChanges, Output, SimpleChanges, ViewChild, computed, inject, signal
} from '@angular/core';
import type { LangEnum } from '@shared/interfaces';
import { LangService } from '@shared/services';
import { Observable, Subscription, finalize } from 'rxjs';
import {
  ContractDocument, ContractDocumentKind, OrganizationContract, OrganizationContractsApiService
} from './organization-contracts-api.service';
import { contractText } from './organization-contracts.text';

type TextKey = keyof typeof contractText;
type Proposal = { kind: 'confirm'; contract: OrganizationContract }
  | { kind: 'upload'; contract: OrganizationContract; file: File };

const locales = { ENG: 'en', RUS: 'ru', ESP: 'es', EST: 'et', ARM: 'hy' } satisfies Record<LangEnum, string>;
const uploadLimit = 15 * 1024 * 1024;

@Component({
  selector: 'org-organization-contracts',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './organization-contracts.component.html',
  styleUrls: ['./organization-contracts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganizationContractsComponent implements OnChanges {
  private readonly api = inject(OrganizationContractsApiService);
  private readonly language = inject(LangService);
  private readonly document = inject(DOCUMENT);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private request: Subscription | null = null;

  @Input({ required: true }) trustedTargetId!: string;
  @Input() required = false;
  @Output() readonly currentContractChange = new EventEmitter<OrganizationContract | null>();
  @ViewChild('confirmation', { static: true }) private confirmation?: ElementRef<HTMLDialogElement>;

  private readonly contracts = signal<OrganizationContract[]>([]);
  readonly busy = signal(false);
  readonly loaded = signal(false);
  readonly error = signal<TextKey | null>(null);
  readonly notice = signal<TextKey | null>(null);
  readonly expandedId = signal<string | null>(null);
  readonly proposal = signal<Proposal | null>(null);
  readonly checked = signal(false);
  readonly current = computed(() => this.contracts().find(contract => contract.isCurrent) ?? null);
  readonly history = computed(() => this.contracts().filter(contract => !contract.isCurrent));

  constructor() {
    inject(DestroyRef).onDestroy(() => this.request?.unsubscribe());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['trustedTargetId']) return;
    this.request?.unsubscribe();
    this.closeDialog();
    this.contracts.set([]);
    this.loaded.set(false);
    this.expandedId.set(null);
    this.currentContractChange.emit(null);
    this.refresh();
  }

  refresh(): void {
    if (this.busy() || !this.trustedTargetId) return;
    this.notice.set(null);
    this.load();
  }

  text(key: TextKey): string {
    return this.language.resolveText(contractText[key]);
  }

  date(value: string, withTime = false): string {
    const date = new Date(value);
    if (!Number.isFinite(date.valueOf())) return '—';
    const options: Intl.DateTimeFormatOptions = withTime
      ? { dateStyle: 'medium', timeStyle: 'short' }
      : { dateStyle: 'medium', timeZone: 'UTC' };
    return new Intl.DateTimeFormat(this.locale, options).format(date);
  }

  size(bytes: number): string {
    const mebibytes = bytes >= 1024 * 1024;
    const size = mebibytes ? bytes / (1024 * 1024) : bytes / 1024;
    return `${new Intl.NumberFormat(this.locale, { maximumFractionDigits: 2 }).format(size)} ${mebibytes ? 'MiB' : 'KiB'}`;
  }

  price(price: NonNullable<OrganizationContract['price']>): string {
    const amount = price.amount === null
      ? ''
      : `${new Intl.NumberFormat(this.locale, { maximumFractionDigits: 2 }).format(price.amount)} ${price.currency}`;
    return [amount, price.description].filter(Boolean).join(' · ');
  }

  partyRows(contract: OrganizationContract): { heading: TextKey; rows: { label: string; value?: string }[] }[] {
    const organization = contract.organizationParty;
    const user = contract.userParty;
    const parties: { heading: TextKey; rows: { label: string; value?: string }[] }[] = [
      {
        heading: 'organization',
        rows: [
          { label: this.text('name'), value: organization?.fullName },
          { label: 'Key ID', value: organization?.publicKeyId },
          { label: this.text('address'), value: organization?.legalAddress },
          { label: this.text('taxId'), value: organization?.taxId },
          { label: this.text('registration'), value: organization?.registrationNumber },
          { label: this.text('representative'), value: organization?.representativeName },
          { label: this.text('basis'), value: organization?.representativeBasis },
          { label: this.text('contact'), value: organization?.contactEmail }
        ].filter(row => row.value)
      },
      {
        heading: 'user',
        rows: [
          { label: this.text('username'), value: user?.username },
          { label: 'Key ID', value: user?.keyId },
          { label: 'Email', value: user?.email }
        ].filter(row => row.value)
      }
    ];
    return parties.filter(party => party.rows.length > 0);
  }

  selectedServices(contract: OrganizationContract): OrganizationContract['services'] {
    return contract.services.filter(service => service.selected !== false);
  }

  steps(contract: OrganizationContract): { label: TextKey; done: boolean; current: boolean }[] {
    const progress = contract.progress;
    const pending = this.pending(contract);
    const steps = [
      { label: 'viewed' as const, done: progress.viewed, current: pending && !progress.viewed },
      { label: 'terms_confirmed' as const, done: progress.termsConfirmed, current: pending && progress.viewed && !progress.termsConfirmed }
    ];
    return contract.mode === 'signed_copy_required'
      ? [...steps, { label: 'verified', done: progress.approved, current: pending && progress.termsConfirmed && !progress.approved }]
      : steps;
  }

  pending(contract: OrganizationContract): boolean {
    return contract.isCurrent && contract.trustStatus === 'pending';
  }

  toggle(contract: OrganizationContract): void {
    if (this.busy()) return;
    const opening = this.expandedId() !== contract.contractId;
    this.expandedId.set(opening ? contract.contractId : null);
    if (opening && this.pending(contract) && contract.actions.canMarkViewed && !contract.progress.viewed) {
      this.run(this.api.markViewed(this.trustedTargetId, contract), result => this.update(result), 'actionFailed');
    }
  }

  confirm(contract: OrganizationContract): void {
    if (this.busy() || !this.pending(contract) || !contract.actions.canConfirmTerms) return;
    this.openDialog({ kind: 'confirm', contract });
  }

  selectCopy(input: HTMLInputElement, contract: OrganizationContract): void {
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.busy() || !this.pending(contract) || !contract.actions.canUploadSignedCopy) return;
    this.notice.set(null);
    if (!file.size || !/\.(pdf|jpe?g|png)$/i.test(file.name)) {
      this.error.set('invalidFile');
    } else if (file.size > uploadLimit) {
      this.error.set('fileTooBig');
    } else {
      this.openDialog({ kind: 'upload', contract, file });
    }
  }

  closeDialog(): void {
    this.confirmation?.nativeElement.close();
    this.proposal.set(null);
    this.checked.set(false);
  }

  submit(): void {
    const proposal = this.proposal();
    const current = this.current();
    if (!proposal || !current || this.busy()) return;
    if (!this.pending(current) || !this.sameSnapshot(current, proposal.contract)) {
      this.closeDialog();
      this.error.set('changed');
      return;
    }
    if (proposal.kind === 'confirm') {
      if (!this.checked() || !current.actions.canConfirmTerms) return;
      this.closeDialog();
      this.run(this.api.confirm(this.trustedTargetId, current), result => {
        this.update(result);
        this.notice.set('confirmed');
      }, 'actionFailed');
    } else {
      if (!current.actions.canUploadSignedCopy) return;
      this.closeDialog();
      this.run(this.api.upload(this.trustedTargetId, current, proposal.file), result => {
        this.update(result);
        this.notice.set('saved');
      }, 'actionFailed');
    }
  }

  download(contract: OrganizationContract, kind: ContractDocumentKind, document: ContractDocument): void {
    if (this.busy() || (kind === 'source' && !contract.actions.canDownloadSource)) return;
    this.run(this.api.download(this.trustedTargetId, contract, kind), blob => {
      this.save(blob, document.filename);
      // The completed source stream writes the download audit and unlocks upload.
      if (kind === 'source' && this.pending(contract) && !contract.progress.sourceDownloaded) this.load();
    }, 'downloadFailed');
  }

  private get locale(): string {
    return locales[this.language.getLang$i()];
  }

  private openDialog(proposal: Proposal): void {
    this.error.set(null);
    this.notice.set(null);
    this.checked.set(false);
    this.proposal.set(proposal);
    this.changeDetector.detectChanges();
    this.confirmation?.nativeElement.showModal();
  }

  private load(preserveError = false): void {
    this.run(this.api.list(this.trustedTargetId), contracts => {
      const expanded = this.contracts().find(contract => contract.contractId === this.expandedId());
      if (expanded && !contracts.some(contract => this.sameSnapshot(contract, expanded) && contract.isCurrent === expanded.isCurrent)) {
        this.expandedId.set(null);
      }
      this.contracts.set(contracts);
      this.loaded.set(true);
      this.currentContractChange.emit(this.current());
    }, 'unavailable', preserveError);
  }

  private update(contract: OrganizationContract): void {
    this.contracts.update(contracts => contracts.map(previous => this.sameSnapshot(previous, contract)
      ? { ...contract, isCurrent: previous.isCurrent, trustStatus: previous.trustStatus }
      : previous));
    this.currentContractChange.emit(this.current());
  }

  private sameSnapshot(left: OrganizationContract, right: OrganizationContract): boolean {
    return left.contractId === right.contractId && left.snapshotHash === right.snapshotHash;
  }

  private save(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = filename;
    this.document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  private run<T>(
    operation: Observable<T>, next: (value: T) => void, fallback: TextKey, preserveError = false
  ): void {
    if (!preserveError) this.error.set(null);
    const request = new Subscription();
    this.request = request;
    this.busy.set(true);
    request.add(operation.pipe(finalize(() => {
      if (this.request === request) {
        this.request = null;
        this.busy.set(false);
      }
    })).subscribe({
      next,
      error: (error: HttpErrorResponse) => {
        const key = this.errorText(error, fallback);
        this.error.set(key);
        if (fallback === 'unavailable') this.currentContractChange.emit(null);
        if (key === 'changed' && fallback !== 'unavailable') {
          this.currentContractChange.emit(null);
          this.load(true);
        }
      }
    }));
  }

  private errorText(response: HttpErrorResponse, fallback: TextKey): TextKey {
    switch (response.error?.error) {
      case 'contract_signed_copy_version_limit_reached': return 'versionLimit';
      case 'vault_quota_exceeded': return 'organizationStorageFull';
      case 'contract_signed_copy_image_invalid': return 'invalidFile';
    }
    switch (response.status) {
      case 409: return 'changed';
      case 413: return 'fileTooBig';
      case 415: return 'invalidFile';
      case 429: return 'rateLimit';
      default: return fallback;
    }
  }
}
