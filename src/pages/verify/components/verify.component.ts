import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { HeaderComponent } from '@widgets/header';
import { FooterComponent } from '@widgets/footer';
import { EvidenceVerificationStatus, EvidenceVerifyResponseI, LangTextI } from '@shared/interfaces';
import { EvidenceService, LangService, NotificationService } from '@shared/services';
import { TEXT_VERIFY, VerifyTextKey } from '../common/verify.text';

type VerifyFileKind = 'mp4' | 'package';
type VerificationSource = 'file' | 'url';

type EvidencePackageEntry = {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
  dataStart: number;
};

type EvidencePackagePayload = {
  evidenceId: string | null;
  manifest: Record<string, unknown>;
  videoFile: File;
};

const STATUS_TITLE_KEYS: Record<EvidenceVerificationStatus, VerifyTextKey> = {
  valid: 'status_valid',
  pending: 'status_pending',
  unknown: 'status_unknown',
  tampered: 'status_tampered',
  invalid_signature: 'status_invalid_signature',
  failed: 'status_failed',
};

const STATUS_BADGE_KEYS: Record<EvidenceVerificationStatus, VerifyTextKey> = {
  valid: 'badge_valid',
  pending: 'badge_pending',
  unknown: 'badge_unknown',
  tampered: 'badge_tampered',
  invalid_signature: 'badge_invalid_signature',
  failed: 'badge_failed',
};

const REMOTE_FILE_TIMEOUT_MS = 5 * 60 * 1000;

@Component({
  selector: 'org-verify',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './verify.component.html',
  styleUrls: [
    './verify.component.scss',
    './verify-source.component.scss',
    './verify-feedback.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerifyComponent {
  private evidenceService = inject(EvidenceService);
  private notificationService = inject(NotificationService);
  private langService = inject(LangService);
  private cdr = inject(ChangeDetectorRef);

  @HostBinding('class') hostClass = 'page';

  public selectedFile: File | null = null;
  public isDragging = false;
  public isProcessing = false;
  public errorMessage = '';
  public verifyResult: EvidenceVerifyResponseI | null = null;
  public lastHashHex = '';
  public extractedEvidenceId: string | null = null;
  public selectedFileKind: VerifyFileKind = 'mp4';
  public verificationSource: VerificationSource = 'file';
  public sourceUrl = '';
  public packageManifest: Record<string, unknown> | null = null;
  public text: Record<string, LangTextI> = TEXT_VERIFY;

  public get hasFile(): boolean {
    return !!this.selectedFile;
  }

  public get statusTone(): string {
    switch (this.verifyResult?.status) {
      case 'valid':
        return 'success';
      case 'pending':
        return 'pending';
      case 'tampered':
      case 'invalid_signature':
      case 'failed':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  public get statusTitle(): string {
    const status = this.verifyResult?.status ?? 'unknown';
    return this.t(STATUS_TITLE_KEYS[status]);
  }

  public get statusBadge(): string {
    const status = this.verifyResult?.status ?? 'unknown';
    return this.t(STATUS_BADGE_KEYS[status]);
  }

  public get hasLocation(): boolean {
    const location = this.verifyResult?.evidence?.location;
    return typeof location?.lat === 'number' && typeof location?.lng === 'number';
  }

  public get originalAuthorText(): string {
    const author = this.verifyResult?.evidence?.originalAuthor;
    if (!author?.confirmed) {
      return this.t('fragment_author_unconfirmed');
    }
    if (author.disclosed && author.displayName) {
      return author.displayName;
    }
    return this.t('fragment_author_confirmed_private');
  }

  public get verificationModeText(): string {
    if (this.verificationSource === 'url') {
      return this.t('mode_url');
    }
    return this.selectedFileKind === 'package' ? this.t('mode_package') : this.t('mode_mp4');
  }

  public get selectedFileHelpText(): string {
    if (this.verificationSource === 'url') {
      return this.t('url_selected_hint');
    }
    return this.selectedFileKind === 'package'
      ? this.t('package_selected_hint')
      : this.t('mp4_selected_hint');
  }

  public get processingText(): string {
    return this.verificationSource === 'url'
      ? this.t('processing_url_text')
      : this.t('processing_text');
  }

  public get canVerifyUrl(): boolean {
    return !this.isProcessing && this.sourceUrl.trim().length > 0;
  }

  public get evidenceIdLabel(): string {
    return this.selectedFileKind === 'package'
      ? this.t('package_evidence_id')
      : this.t('embedded_evidence_id');
  }

  public t(key: VerifyTextKey): string {
    return this.translate(this.text[key]);
  }

  public matchedByText(): string {
    switch (this.verifyResult?.matchedBy) {
      case 'evidenceId':
        return this.t('matched_evidence_id');
      case 'hash':
        return this.t('matched_hash');
      case 'filename':
        return this.t('matched_filename');
      default:
        return this.t('matched_not_found');
    }
  }

  public formatFragmentOffset(value: number | null | undefined): string {
    const totalMs = Math.max(0, Number(value) || 0);
    const totalSeconds = Math.floor(totalMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const tenths = Math.floor((totalMs % 1000) / 100);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;
  }

  public onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  public onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  public onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;

    const file = event.dataTransfer?.files?.item(0) || null;
    this.setSelectedFile(file);
  }

  public onFileInput(event: Event, preferredKind?: VerifyFileKind): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) || null;
    this.setSelectedFile(file, preferredKind);
    input.value = '';
  }

  public onSourceUrlInput(event: Event): void {
    this.sourceUrl = (event.target as HTMLInputElement).value;
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  public clearSelection(): void {
    this.selectedFile = null;
    this.extractedEvidenceId = null;
    this.lastHashHex = '';
    this.verifyResult = null;
    this.errorMessage = '';
    this.selectedFileKind = 'mp4';
    this.verificationSource = 'file';
    this.sourceUrl = '';
    this.packageManifest = null;
    this.cdr.markForCheck();
  }

  public async verifySelectedFile(): Promise<void> {
    if (!this.selectedFile || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.verifyResult = null;
    this.lastHashHex = '';
    this.packageManifest = null;
    this.cdr.markForCheck();

    try {
      await this.performVerification(this.selectedFile, this.selectedFileKind);
    } catch (error) {
      this.errorMessage = this.resolveErrorMessage(error);
      this.notificationService.showError(this.errorMessage);
    } finally {
      this.isProcessing = false;
      this.cdr.markForCheck();
    }
  }

  public async verifyFromUrl(): Promise<void> {
    if (!this.canVerifyUrl) {
      return;
    }

    let normalizedUrl: string;
    try {
      normalizedUrl = this.normalizeSourceUrl(this.sourceUrl);
    } catch (error) {
      this.handleVerificationError(error);
      return;
    }

    this.isProcessing = true;
    this.verificationSource = 'url';
    this.sourceUrl = normalizedUrl;
    this.errorMessage = '';
    this.verifyResult = null;
    this.lastHashHex = '';
    this.packageManifest = null;
    this.cdr.markForCheck();

    try {
      const remoteFile = await this.downloadRemoteMp4(normalizedUrl);
      this.setSelectedFile(remoteFile, 'mp4', 'url');
      await this.performVerification(remoteFile, 'mp4');
    } catch (error) {
      this.handleVerificationError(error);
    } finally {
      this.isProcessing = false;
      this.cdr.markForCheck();
    }
  }

  private setSelectedFile(
    file: File | null,
    preferredKind?: VerifyFileKind,
    source: VerificationSource = 'file'
  ): void {
    if (!file) {
      return;
    }

    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    const isMp4 = fileName.endsWith('.mp4') || fileType === 'video/mp4';
    const isZip =
      fileName.endsWith('.estream') ||
      fileName.endsWith('.zip') ||
      fileName.endsWith('.estream.zip') ||
      fileType === 'application/zip' ||
      fileType === 'application/x-zip-compressed' ||
      fileType === 'application/octet-stream' ||
      preferredKind === 'package';
    const fileKind: VerifyFileKind = preferredKind ?? (isMp4 ? 'mp4' : 'package');

    if (fileKind === 'mp4' && !isMp4) {
      this.errorMessage = this.t('unsupported_file_error');
      this.selectedFile = null;
      this.verifyResult = null;
      this.extractedEvidenceId = null;
      this.lastHashHex = '';
      this.packageManifest = null;
      this.cdr.markForCheck();
      return;
    }

    if (fileKind === 'package' && !isZip) {
      this.errorMessage = this.t('unsupported_file_error');
      this.selectedFile = null;
      this.verifyResult = null;
      this.extractedEvidenceId = null;
      this.lastHashHex = '';
      this.packageManifest = null;
      this.cdr.markForCheck();
      return;
    }

    this.selectedFile = file;
    this.selectedFileKind = fileKind;
    this.verificationSource = source;
    if (source === 'file') {
      this.sourceUrl = '';
    }
    this.verifyResult = null;
    this.errorMessage = '';
    this.extractedEvidenceId = null;
    this.lastHashHex = '';
    this.packageManifest = null;
    this.cdr.markForCheck();
  }

  private async performVerification(file: File, fileKind: VerifyFileKind): Promise<void> {
    const target = fileKind === 'package'
      ? await this.extractEvidencePackage(file)
      : {
        evidenceId: await this.extractEvidenceId(file),
        manifest: null,
        videoFile: file,
      };
    const fileHashHex = await this.computeFileHashHex(target.videoFile);

    this.lastHashHex = fileHashHex;
    this.extractedEvidenceId = target.evidenceId;
    this.packageManifest = target.manifest;

    this.verifyResult = await firstValueFrom(
      this.evidenceService.verifyEvidence({
        evidenceId: target.evidenceId || undefined,
        fileHashHex,
        fileSize: target.videoFile.size,
        fileName: target.videoFile.name,
        packageManifest: target.manifest || undefined,
        packageType: fileKind === 'package' ? 'estream_zip' : 'mp4',
      })
    );
  }

  private normalizeSourceUrl(value: string): string {
    try {
      const url = new URL(value.trim());
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error();
      }
      return url.href;
    } catch {
      throw new Error(this.t('url_invalid_error'));
    }
  }

  private async downloadRemoteMp4(sourceUrl: string): Promise<File> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REMOTE_FILE_TIMEOUT_MS);

    try {
      const response = await fetch(sourceUrl, {
        method: 'GET',
        credentials: 'omit',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        signal: controller.signal,
      });

      if (response.status === 425) {
        throw new Error(this.t('url_pending_error'));
      }
      if (!response.ok) {
        throw new Error(
          this.t('url_http_error').replace('{status}', response.status.toString())
        );
      }

      const contentType = (response.headers.get('content-type') || '')
        .split(';')[0]
        .trim()
        .toLowerCase();
      const responsePath = new URL(response.url || sourceUrl).pathname.toLowerCase();
      const isMp4 = contentType === 'video/mp4' || responsePath.endsWith('.mp4');
      if (!isMp4 || contentType === 'text/html') {
        throw new Error(this.t('url_not_mp4_error'));
      }

      const blob = await response.blob();
      if (!blob.size) {
        throw new Error(this.t('url_empty_error'));
      }

      return new File(
        [blob],
        this.resolveRemoteFileName(response, sourceUrl),
        { type: 'video/mp4', lastModified: Date.now() }
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(this.t('url_timeout_error'));
      }
      if (error instanceof TypeError) {
        throw new Error(this.t('url_fetch_error'));
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  private resolveRemoteFileName(response: Response, sourceUrl: string): string {
    const disposition = response.headers.get('content-disposition') || '';
    const utfFileName = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
    const plainFileName = /filename="?([^";]+)"?/i.exec(disposition)?.[1];
    const pathFileName = new URL(response.url || sourceUrl).pathname.split('/').pop();
    const candidate = utfFileName || plainFileName || pathFileName || 'remote-video.mp4';
    let decoded = candidate;

    try {
      decoded = decodeURIComponent(candidate);
    } catch {
      decoded = candidate;
    }

    const safeName = decoded.replace(/[\\/\r\n]/g, '-').trim() || 'remote-video.mp4';
    return safeName.toLowerCase().endsWith('.mp4') ? safeName : `${safeName}.mp4`;
  }

  private handleVerificationError(error: unknown): void {
    this.errorMessage = this.resolveErrorMessage(error);
    this.notificationService.showError(this.errorMessage);
    this.cdr.markForCheck();
  }

  private async computeFileHashHex(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buffer);

    return Array.from(new Uint8Array(digest))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  private async extractEvidenceId(file: File): Promise<string | null> {
    const sampleSize = Math.min(file.size, 1024 * 1024);
    const buffer = await file.slice(0, sampleSize).arrayBuffer();
    const text = new TextDecoder('latin1').decode(new Uint8Array(buffer));
    const match = /estream:evidenceId=([a-zA-Z0-9_]+)/.exec(text);

    return match?.[1] || null;
  }

  private async extractEvidencePackage(file: File): Promise<EvidencePackagePayload> {
    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);
    const entries = this.readZipEntries(buffer, view);
    const manifestEntry = entries.get('evidence.json');
    const videoEntry = entries.get('video.mp4');

    if (!manifestEntry || !videoEntry) {
      throw new Error(this.t('package_missing_entries'));
    }

    if (manifestEntry.compressionMethod !== 0 || videoEntry.compressionMethod !== 0) {
      throw new Error(this.t('package_unsupported_compression'));
    }

    const manifestText = new TextDecoder('utf-8').decode(
      new Uint8Array(buffer, manifestEntry.dataStart, manifestEntry.uncompressedSize)
    );
    const manifest = JSON.parse(manifestText) as Record<string, unknown>;
    const evidenceId = typeof manifest['evidenceId'] === 'string'
      ? manifest['evidenceId'] as string
      : null;
    const videoBytes = buffer.slice(
      videoEntry.dataStart,
      videoEntry.dataStart + videoEntry.uncompressedSize
    );
    const videoFile = new File([videoBytes], 'video.mp4', { type: 'video/mp4' });

    return {
      evidenceId,
      manifest,
      videoFile,
    };
  }

  private readZipEntries(buffer: ArrayBuffer, view: DataView): Map<string, EvidencePackageEntry> {
    const eocdOffset = this.findEndOfCentralDirectory(view);
    if (eocdOffset < 0) {
      throw new Error(this.t('package_invalid_zip'));
    }

    const totalEntries = view.getUint16(eocdOffset + 10, true);
    const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
    const entries = new Map<string, EvidencePackageEntry>();
    let cursor = centralDirectoryOffset;

    for (let index = 0; index < totalEntries; index += 1) {
      if (view.getUint32(cursor, true) !== 0x02014b50) {
        throw new Error(this.t('package_invalid_zip'));
      }

      const compressionMethod = view.getUint16(cursor + 10, true);
      const compressedSize = view.getUint32(cursor + 20, true);
      const uncompressedSize = view.getUint32(cursor + 24, true);
      const fileNameLength = view.getUint16(cursor + 28, true);
      const extraLength = view.getUint16(cursor + 30, true);
      const commentLength = view.getUint16(cursor + 32, true);
      const localHeaderOffset = view.getUint32(cursor + 42, true);
      const name = new TextDecoder('utf-8').decode(
        new Uint8Array(buffer, cursor + 46, fileNameLength)
      );

      if (view.getUint32(localHeaderOffset, true) !== 0x04034b50) {
        throw new Error(this.t('package_invalid_zip'));
      }

      const localNameLength = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
      const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;

      entries.set(name, {
        name,
        compressionMethod,
        compressedSize,
        uncompressedSize,
        localHeaderOffset,
        dataStart,
      });

      cursor += 46 + fileNameLength + extraLength + commentLength;
    }

    return entries;
  }

  private findEndOfCentralDirectory(view: DataView): number {
    const minOffset = Math.max(0, view.byteLength - 66000);

    for (let offset = view.byteLength - 22; offset >= minOffset; offset -= 1) {
      if (view.getUint32(offset, true) === 0x06054b50) {
        return offset;
      }
    }

    return -1;
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return (
        error.error?.error ||
        error.error?.reason ||
        error.message ||
        this.t('request_failed')
      );
    }

    if (error instanceof Error) {
      return error.message;
    }

    return this.t('verification_failed');
  }

  private translate(text: LangTextI): string {
    return this.langService.resolveText(text);
  }
}
