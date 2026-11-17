import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, EventEmitter,
  Input, Output, ViewChild, inject, signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { copyText } from '@shared/helpers';
import { LangService } from '@shared/services';
import { Observable, firstValueFrom } from 'rxjs';
import { VAULT_ACTIONS_TEXT } from './vault-actions.text';
import { VaultApiService } from './vault-api.service';
import { locationPoint } from './vault-geo';
import { VaultMediaService } from './vault-media.service';
import { VaultFolder, VaultItem, isVaultMediaAvailable } from './vault.models';

type Message = keyof typeof VAULT_ACTIONS_TEXT;
type Dialog = 'rename' | 'move' | 'create' | 'remove' | 'scheduled' | 'delete' | 'qrDuplicate' | 'qr' | 'linkInfo' | 'package' | 'map';
type QrRenderer = Pick<typeof import('qrcode'), 'toDataURL'>;

const ERROR_MESSAGES: Record<string, Message> = {
  vault_quota_exceeded: 'quota',
  vault_entry_title_too_long: 'titleTooLong',
  vault_folder_duplicate: 'folderDuplicate',
  vault_folder_limit_reached: 'folderLimit',
  vault_folder_name_required: 'folderInvalid',
  vault_folder_name_too_long: 'folderInvalid',
  vault_folder_not_found: 'folderMissing',
  vault_qr_watermark_already_processing: 'qrPending',
  vault_qr_watermark_rate_limited: 'qrRateLimit',
  vault_qr_watermark_source_not_found: 'qrSourceMissing',
  vault_qr_watermark_source_not_available: 'qrSourceUnavailable'
};

@Component({
  selector: 'org-vault-actions',
  standalone: true,
  templateUrl: './vault-actions.component.html',
  styleUrl: './vault-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VaultActionsComponent {
  private readonly api = inject(VaultApiService);
  private readonly media = inject(VaultMediaService);
  private readonly lang = inject(LangService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  @ViewChild('panel', { static: true }) private readonly panel!: ElementRef<HTMLDialogElement>;
  @ViewChild('more') private readonly more?: ElementRef<HTMLDetailsElement>;

  @Input({ required: true }) item!: VaultItem;
  @Input() folders: readonly VaultFolder[] = [];
  @Input() folderCounts: ReadonlyMap<string | null, number> = new Map();
  @Input() deletionPasswordRequired = false;
  @Output() readonly changed = new EventEmitter<void>();
  @Output() readonly notice = new EventEmitter<string>();
  @Output() readonly openTrim = new EventEmitter<VaultItem>();

  readonly mode = signal<Dialog | null>(null);
  readonly busy = signal(false);
  readonly value = signal('');
  readonly feedback = signal('');
  readonly dialogError = signal('');
  readonly duplicateCount = signal(1);
  readonly passwordRequested = signal(false);
  readonly qrImage = signal('');
  private returnFocus: HTMLElement | null = null;

  get isRecording(): boolean {
    return this.item.itemType === 'recording';
  }

  get canDownload(): boolean {
    return isVaultMediaAvailable(this.item);
  }

  get canDerive(): boolean {
    return this.editable && !this.item.playbackRequiresSession
      && this.item.evidenceStatus === 'sealed' && this.canDownload;
  }

  get canDelete(): boolean {
    return this.isRecording
      ? Boolean(this.item.recordingId || this.item.url)
      : this.editable && !(this.item.sourceType === 'derived_verified' && this.item.processingStatus === 'processing');
  }

  get editable(): boolean {
    return !this.isRecording && Boolean(this.item.vaultEntryId);
  }

  get canSave(): boolean {
    return this.isRecording && Boolean(this.item.recordingId);
  }

  get canCopy(): boolean {
    return Boolean(this.item.url && !this.item.playbackRequiresSession);
  }

  get canShowLinkInfo(): boolean {
    return this.canCopy && this.item.derivationType !== 'qr_watermark';
  }

  get publicWatchUrl(): string | null {
    const playbackId = this.item.playbackId?.trim();
    return !this.item.playbackRequiresSession && playbackId && /^[A-Za-z0-9_-]+$/.test(playbackId)
      ? `https://e-stream.app/watch/${encodeURIComponent(playbackId)}`
      : null;
  }

  get point() {
    return locationPoint(this.item.location);
  }

  get mapUrl(): string {
    const point = this.point;
    return point ? `https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lng}#map=16/${point.lat}/${point.lng}` : '';
  }

  get needsPassword(): boolean {
    return this.deletionPasswordRequired || this.passwordRequested();
  }

  get titleLength(): number {
    return Array.from(this.value().normalize('NFKC').replace(/\s+/g, ' ').trim()).length;
  }

  get dialogTitle(): string {
    switch (this.mode()) {
      case 'rename': return this.text(this.item.customTitle ? 'renameTitle' : 'nameTitle');
      case 'move': return this.text('moveTitle');
      case 'create': return this.text('newFolder');
      case 'remove': return this.text('deleteSaved');
      case 'scheduled': return this.text('cancelScheduled');
      case 'delete': return this.text(this.needsPassword ? 'passwordTitle' : 'deleteRecording');
      case 'qrDuplicate': return this.text('qrDuplicate');
      case 'qr': return this.text('qr');
      case 'linkInfo': return this.text('linkTitle');
      case 'package': return this.text('sharePackage');
      case 'map': return this.text('map');
      default: return '';
    }
  }

  get dialogAction(): Message | null {
    switch (this.mode()) {
      case 'rename': return 'saveTitle';
      case 'create': return 'createFolder';
      case 'remove': return 'deleteSavedAction';
      case 'scheduled': return 'cancelScheduledAction';
      case 'delete': return 'deleteAction';
      case 'qrDuplicate': return 'qrCreateMore';
      case 'package': return 'packageDownload';
      default: return null;
    }
  }

  get matchedFolders(): readonly VaultFolder[] {
    const query = this.value().trim().toLocaleLowerCase();
    return this.folders.filter(folder => folder.name.toLocaleLowerCase().includes(query));
  }

  get showUngrouped(): boolean {
    return this.text('ungrouped').toLocaleLowerCase().includes(this.value().trim().toLocaleLowerCase());
  }

  text(key: Message): string {
    return this.lang.resolveText(VAULT_ACTIONS_TEXT[key]);
  }

  show(mode: Dialog): void {
    const panel = this.panel.nativeElement;
    if (!panel.open) {
      this.returnFocus = this.document.activeElement as HTMLElement | null;
      if (this.more?.nativeElement.open) {
        this.returnFocus = this.more.nativeElement.querySelector('summary');
      }
    }
    this.closeMore();
    this.feedback.set('');
    this.dialogError.set('');
    this.mode.set(mode);
    this.value.set(mode === 'rename' ? this.item.customTitle ?? '' : '');
    this.cdr.detectChanges();
    if (!panel.open) panel.showModal();
    else panel.querySelector<HTMLElement>('[autofocus]')?.focus();
  }

  closeMore(): void {
    this.more?.nativeElement.removeAttribute('open');
  }

  dismiss(): void {
    if (!this.busy()) this.panel.nativeElement.close();
  }

  backdrop(event: MouseEvent): void {
    if (event.target === this.panel.nativeElement) this.dismiss();
  }

  onCancel(event: Event): void {
    if (this.busy()) event.preventDefault();
  }

  onClose(): void {
    if (this.panel.nativeElement.open) return;
    this.mode.set(null);
    this.value.set('');
    this.qrImage.set('');
    this.dialogError.set('');
    if (this.returnFocus?.isConnected) this.returnFocus.focus();
    this.returnFocus = null;
  }

  async showQr(): Promise<void> {
    const url = this.publicWatchUrl;
    if (!url) return;
    this.qrImage.set('');
    this.show('qr');
    try {
      const module: QrRenderer & { default?: QrRenderer } = await import('qrcode');
      const qr = module.default ?? module;
      const image = await qr.toDataURL(url, {
        width: 300,
        margin: 4,
        errorCorrectionLevel: 'H',
        color: { dark: '#143551', light: '#ffffff' }
      });
      if (this.mode() === 'qr' && this.publicWatchUrl === url) this.qrImage.set(image);
    } catch {
      if (this.mode() === 'qr') this.dialogError.set(this.text('qrImageError'));
    }
  }

  async copy(url: string | null): Promise<void> {
    if (!url) return;
    try {
      await copyText(this.document, url);
      this.report('copied');
    } catch {
      this.report('copyError', true);
    }
  }

  async share(url: string): Promise<void> {
    const navigator = this.document.defaultView?.navigator;
    if (!navigator?.share || (navigator.canShare && !navigator.canShare({ url }))) {
      await this.copy(url);
      return;
    }
    try {
      await navigator.share({ url });
    } catch (error) {
      if (!(error instanceof Error) || error.name !== 'AbortError') this.report('shareError', true);
    }
  }

  startTrim(): void {
    this.closeMore();
    if (this.canDerive) this.openTrim.emit(this.item);
  }

  download(): Promise<void> {
    if (!this.canDownload) return Promise.resolve();
    return this.perform(async () => {
      const notice = this.item.evidenceStatus === 'pending' ? 'downloadPending'
        : this.item.evidenceStatus === 'failed' ? 'downloadUnverified' : null;
      if (notice) this.report(notice);
      await this.response(this.media.downloadVideo(this.item));
      this.report('downloadStarted');
    }, 'downloadError');
  }

  save(): Promise<void> {
    const recordingId = this.item.recordingId;
    this.closeMore();
    if (!recordingId || this.item.isSaved) return Promise.resolve();
    return this.perform(async () => {
      await this.response(this.api.saveRecording(recordingId));
      this.mutated('saveDone');
    }, 'saveError');
  }

  move(folderId: string | null): Promise<void> {
    const id = this.item.vaultEntryId;
    if (!id || !this.editable) return Promise.resolve();
    if (folderId === (this.item.folderId ?? null)) {
      this.dismiss();
      return Promise.resolve();
    }
    return this.perform(async () => {
      await this.response(this.api.moveEntry(id, folderId));
      this.mutated('moveDone');
    }, 'moveError');
  }

  undoDelete(): Promise<void> {
    if (!this.isRecording || !this.item.scheduledForDeletionAt || !this.canDelete) return Promise.resolve();
    return this.perform(async () => {
      await this.response(this.api.cancelRecordingDeletion(this.item));
      this.mutated('deletionCancelled');
    }, 'undoDeleteError');
  }

  makeQrVersion(allowDuplicate = false): Promise<void> {
    const id = this.item.vaultEntryId;
    this.closeMore();
    if (!id || !this.canDerive) return Promise.resolve();
    return this.perform(async () => {
      try {
        await this.response(this.api.createQrWatermark(id, allowDuplicate));
      } catch (error) {
        if (!allowDuplicate && this.serverCode(error) === 'vault_qr_watermark_exists') {
          const count = error instanceof HttpErrorResponse ? error.error?.existingCount : null;
          this.duplicateCount.set(typeof count === 'number' && count > 0 ? count : 1);
          this.show('qrDuplicate');
          return;
        }
        const errorId = error instanceof HttpErrorResponse ? error.error?.errorId : null;
        const code = this.serverCode(error);
        const technical = [code, typeof errorId === 'string' ? errorId : ''].filter(Boolean).join(' · ');
        this.report(ERROR_MESSAGES[code] ?? 'qrError', true, technical);
        return;
      }
      this.mutated('qrQueued');
    }, 'qrError');
  }

  submit(event: Event): void {
    event.preventDefault();
    const mode = this.mode();
    if (mode === 'rename') void this.rename();
    else if (mode === 'create') void this.createAndMove();
    else if (mode === 'remove' || mode === 'scheduled') void this.removeSaved(mode === 'scheduled');
    else if (mode === 'delete') void this.removeRecording();
    else if (mode === 'qrDuplicate') void this.makeQrVersion(true);
    else if (mode === 'package') void this.downloadEvidence();
  }

  private rename(): Promise<void> {
    const id = this.item.vaultEntryId;
    const title = this.value().trim() || null;
    if (!id || !this.editable || this.titleLength > 16) return Promise.resolve();
    if (title === (this.item.customTitle ?? null)) {
      this.dismiss();
      return Promise.resolve();
    }
    return this.perform(async () => {
      await this.response(this.api.renameEntry(id, title));
      this.mutated(title ? 'titleSaved' : 'titleRemoved');
    }, 'titleError');
  }

  private createAndMove(): Promise<void> {
    const id = this.item.vaultEntryId;
    const name = this.value().trim();
    if (!id || !name || name.length > 60 || !this.editable) return Promise.resolve();
    return this.perform(async () => {
      const folder = await this.response(this.api.createFolder(name));
      try {
        await this.response(this.api.moveEntry(id, folder.folderId));
        this.mutated('moveDone');
      } catch (error) {
        this.show('move');
        this.changed.emit();
        this.report(ERROR_MESSAGES[this.serverCode(error)] ?? 'moveError', true);
      }
    }, 'folderError');
  }

  private removeSaved(cancelScheduled: boolean): Promise<void> {
    const id = this.item.vaultEntryId;
    if (!id || this.isRecording || !this.canDelete) return Promise.resolve();
    return this.perform(async () => {
      try {
        const result = await this.response(this.api.deleteEntry(id, cancelScheduled));
        this.mutated(result.remainsInMyRecordings ? 'remains' : 'removed');
      } catch (error) {
        if (!cancelScheduled && this.serverCode(error) === 'vault_scheduled_delivery_confirmation_required') {
          this.show('scheduled');
          return;
        }
        throw error;
      }
    }, 'removeError');
  }

  private removeRecording(): Promise<void> {
    const password = this.needsPassword ? this.value().trim() : undefined;
    if (!this.isRecording || !this.canDelete || (this.needsPassword && !password)) return Promise.resolve();
    return this.perform(async () => {
      this.value.set('');
      try {
        const result = await this.response(this.api.deleteRecording(this.item, password));
        this.mutated(result.scheduledForDeletionAt ? 'deletionScheduled' : 'deleted');
      } catch (error) {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          const message = this.serverCode(error);
          if (message) this.dialogError.set(message);
          else this.report('deleteError', true);
          if (!password) this.passwordRequested.set(true);
          return;
        }
        throw error;
      }
    }, 'deleteError');
  }

  private downloadEvidence(): Promise<void> {
    if (!this.item.evidenceId || this.item.evidenceStatus !== 'sealed') return Promise.resolve();
    return this.perform(async () => {
      await this.response(this.media.downloadEvidence(this.item));
      this.panel.nativeElement.close();
      this.report('downloadStarted');
    }, 'packageError');
  }

  private response<T>(request: Observable<T>): Promise<T> {
    return firstValueFrom(request.pipe(takeUntilDestroyed(this.destroyRef)));
  }

  private async perform(action: () => Promise<void>, fallback: Message): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.feedback.set('');
    this.dialogError.set('');
    try {
      await action();
    } catch (error) {
      if (!(error instanceof Error) || error.name !== 'AbortError') {
        this.report(ERROR_MESSAGES[this.serverCode(error)] ?? fallback, true);
      }
    } finally {
      this.busy.set(false);
    }
  }

  private serverCode(error: unknown): string {
    return error instanceof HttpErrorResponse && typeof error.error?.error === 'string'
      ? error.error.error
      : '';
  }

  private mutated(message: Message): void {
    this.panel.nativeElement.close();
    this.report(message);
    this.changed.emit();
  }

  private report(key: Message, error = false, technical = ''): void {
    const message = technical ? `${this.text(key)} ${this.text('errorCode')} ${technical}` : this.text(key);
    if (error && this.panel.nativeElement.open) this.dialogError.set(message);
    else this.feedback.set(message);
    this.notice.emit(message);
  }
}
