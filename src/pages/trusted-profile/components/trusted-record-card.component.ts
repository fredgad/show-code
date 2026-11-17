import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { copyText } from '@shared/helpers';
import { LangService } from '@shared/services';
import { finalize } from 'rxjs';
import { VAULT_ACTIONS_TEXT } from '../../profile/vault/vault-actions.text';
import { VaultMediaService } from '../../profile/vault/vault-media.service';
import { VaultPosterComponent } from '../../profile/vault/vault-poster.component';
import { isVaultMediaAvailable } from '../../profile/vault/vault.models';
import { TRUSTED_PROFILE_TEXT } from './trusted-profile.text';
import { PersonRecord } from './trusted-profile-content.service';
import { trustDate } from '../../../widgets/trusted-people/access/trust-access.text';

const copy = { ...VAULT_ACTIONS_TEXT, ...TRUSTED_PROFILE_TEXT, close: {
  ENG: 'Close', RUS: 'Закрыть', ESP: 'Cerrar', EST: 'Sulge', ARM: 'Փակել'
} };

@Component({
  selector: 'org-trusted-record-card',
  standalone: true,
  imports: [VaultPosterComponent],
  templateUrl: './trusted-record-card.component.html',
  styleUrl: './trusted-record-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrustedRecordCardComponent implements OnChanges {
  private readonly document = inject(DOCUMENT);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly language = inject(LangService);
  private readonly media = inject(VaultMediaService);
  @ViewChild('details', { static: true }) private readonly details!: ElementRef<HTMLDialogElement>;

  @Input({ required: true }) record!: PersonRecord;
  @Output() readonly play = new EventEmitter<HTMLButtonElement>();

  readonly dialog = signal<'package' | 'qr' | null>(null);
  readonly busy = signal(false);
  readonly feedback = signal<keyof typeof copy | null>(null);
  readonly qrImage = signal('');

  get available(): boolean { return isVaultMediaAvailable(this.record.item); }
  get title(): string {
    return this.record.item.customTitle?.trim() || this.text(this.record.message ? 'message' : 'recording');
  }

  get publicWatchUrl(): string | null {
    const id = this.record.item.playbackId;
    return this.available && id && /^[A-Za-z0-9_-]+$/.test(id)
      ? `https://e-stream.app/watch/${encodeURIComponent(id)}`
      : null;
  }

  get duration(): string {
    const seconds = this.record.item.duration;
    if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return '';
    const rounded = Math.round(seconds);
    return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
  }

  get evidenceLabel(): keyof typeof copy | null {
    if (this.record.message) return null;
    switch (this.record.item.evidenceStatus) {
      case 'sealed': return 'sealed';
      case 'pending': return 'evidencePending';
      case 'failed': return 'evidenceFailed';
      default: return null;
    }
  }

  ngOnChanges(): void {
    if (!this.available) this.close();
  }

  text(key: keyof typeof copy): string { return this.language.resolveText(copy[key]); }
  date(value: string | null | undefined): string { return value ? trustDate(value, this.language.getLang$i()) : ''; }

  download(isPackage = false): void {
    if (!this.available || this.busy()) return;
    this.close();
    const item = this.record.item;
    const request = isPackage ? this.media.downloadEvidence(item) : this.media.downloadVideo(item);
    this.feedback.set(null);
    this.busy.set(true);
    request.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.busy.set(false))).subscribe({
      next: () => this.feedback.set('downloadStarted'),
      error: error => {
        if (error?.name !== 'AbortError') this.feedback.set(isPackage ? 'packageError' : 'downloadError');
      }
    });
  }

  async copyLink(qr = false): Promise<void> {
    if (!this.available) return;
    this.media.playbackUrl(this.record.item).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: url => {
        const source = qr ? this.publicWatchUrl : url;
        if (!source) return;
        void copyText(this.document, source).then(
          () => this.feedback.set('copied'),
          () => this.feedback.set('copyError')
        );
      },
      error: () => this.feedback.set('copyError'),
    });
  }

  async show(kind: 'package' | 'qr'): Promise<void> {
    if (!this.available) return;
    const url = this.publicWatchUrl;
    if (kind === 'qr' && !url) return;
    this.feedback.set(null);
    this.qrImage.set('');
    this.dialog.set(kind);
    this.cdr.detectChanges();
    this.details.nativeElement.showModal();
    if (kind !== 'qr' || !url) return;
    try {
      const qr = await import('qrcode');
      const image = await qr.toDataURL(url, { width: 260, margin: 4, errorCorrectionLevel: 'H' });
      if (this.details.nativeElement.open && this.dialog() === 'qr' && this.publicWatchUrl === url) {
        this.qrImage.set(image);
      }
    } catch {
      if (this.details.nativeElement.open && this.dialog() === 'qr') this.feedback.set('qrImageError');
    }
  }

  close(): void {
    if (this.details?.nativeElement.open) this.details.nativeElement.close?.();
    this.dialog.set(null);
  }
}
