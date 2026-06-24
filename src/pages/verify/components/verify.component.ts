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

@Component({
  selector: 'org-verify',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.scss',
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

  public get verificationModeText(): string {
    return this.selectedFileKind === 'package' ? this.t('mode_package') : this.t('mode_mp4');
  }

  public get selectedFileHelpText(): string {
    return this.selectedFileKind === 'package'
      ? this.t('package_selected_hint')
      : this.t('mp4_selected_hint');
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

  public clearSelection(): void {
    this.selectedFile = null;
    this.extractedEvidenceId = null;
    this.lastHashHex = '';
    this.verifyResult = null;
    this.errorMessage = '';
    this.selectedFileKind = 'mp4';
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
      const target = this.selectedFileKind === 'package'
        ? await this.extractEvidencePackage(this.selectedFile)
        : {
          evidenceId: await this.extractEvidenceId(this.selectedFile),
          manifest: null,
          videoFile: this.selectedFile,
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
          packageType: this.selectedFileKind === 'package' ? 'estream_zip' : 'mp4',
        })
      );
    } catch (error) {
      this.errorMessage = this.resolveErrorMessage(error);
      this.notificationService.showError(this.errorMessage);
    } finally {
      this.isProcessing = false;
      this.cdr.markForCheck();
    }
  }

  private setSelectedFile(file: File | null, preferredKind?: VerifyFileKind): void {
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
    this.verifyResult = null;
    this.errorMessage = '';
    this.extractedEvidenceId = null;
    this.lastHashHex = '';
    this.packageManifest = null;
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
    return text[this.langService.getLang$i()];
  }
}
