import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, ViewChild, afterNextRender, computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SITE_LANGUAGES } from '@features/lang';
import { HeaderComponent } from '@widgets/header';
import { copyText } from '@shared/helpers';
import { EvidenceCaptureSource, EvidenceLocationI, EvidenceVerificationStatus, EvidenceVerifyResponseI } from '@shared/interfaces';
import { EvidenceService, LangService } from '@shared/services';
import { PROFILE_TEXT } from '../../profile/profile.text';
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

const CAMERA_VERIFICATION_TEXT: Record<
  EvidenceCaptureSource | 'derived' | 'unavailable' | 'details_unavailable',
  { status: VerifyTextKey; detail: VerifyTextKey }
> = {
  device_segments: { status: 'camera_segments_status', detail: 'camera_segments_detail' },
  live_recovery: { status: 'camera_live_status', detail: 'camera_live_detail' },
  camera_gateway: { status: 'camera_gateway_status', detail: 'camera_gateway_detail' },
  camera_stream: { status: 'camera_stream_status', detail: 'camera_stream_detail' },
  test_source: { status: 'camera_test_status', detail: 'camera_test_detail' },
  derived: { status: 'camera_unavailable_status', detail: 'camera_derived_detail' },
  unavailable: { status: 'camera_unavailable_status', detail: 'camera_unavailable_detail' },
  details_unavailable: { status: 'camera_details_unavailable_status', detail: 'camera_details_unavailable_detail' },
};

const REMOTE_FILE_TIMEOUT_MS = 5 * 60 * 1000;

@Component({
  selector: 'org-verify',
  standalone: true,
  imports: [NgTemplateOutlet, HeaderComponent],
  templateUrl: './verify.component.html',
  styleUrls: [
    './verify.component.scss',
    './verify-source.component.scss',
    './verify-feedback.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerifyComponent {
  private readonly evidenceService = inject(EvidenceService);
  private readonly langService = inject(LangService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly dateFormat = computed(() => new Intl.DateTimeFormat(this.locale(), {
    dateStyle: 'medium', timeStyle: 'medium'
  }));
  private readonly secondsFormat = computed(() => new Intl.NumberFormat(this.locale(), {
    style: 'unit', unit: 'second', maximumFractionDigits: 1
  }));

  @ViewChild('resultHeading') private resultHeading?: ElementRef<HTMLHeadingElement>;

  public readonly locale = computed(() => SITE_LANGUAGES.find(language => language.id === this.langService.getLang$i())?.tag ?? 'en');
  public readonly support = computed(() => this.langService.resolveText(PROFILE_TEXT.support));
  public selectedFile: File | null = null;
  public verifiedFileName = '';
  public isDragging = false;
  public isProcessing = false;
  public errorMessage = '';
  public verifyResult: EvidenceVerifyResponseI | null = null;
  public lastHashHex = '';
  public extractedEvidenceId: string | null = null;
  public selectedFileKind: VerifyFileKind = 'mp4';
  public verificationSource: VerificationSource = 'file';
  public sourceUrl = '';
  public hashCopyStatus: VerifyTextKey | null = null;

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

  public get statusHint(): string {
    switch (this.verifyResult?.status) {
      case 'valid': return this.t('video_integrity_detail');
      case 'pending': return this.t('result_pending_hint');
      case 'unknown':
      case 'tampered': return this.t('result_original_hint');
      default: return '';
    }
  }

  public get cameraVerificationText() {
    const evidence = this.verifyResult?.evidence;
    if (!evidence) return CAMERA_VERIFICATION_TEXT.details_unavailable;
    if (evidence.derivation) return CAMERA_VERIFICATION_TEXT.derived;
    const proof = this.cameraAndroidProof;
    if (proof) {
      const status = proof.invalidSegments > 0 ? 'camera_android_problem'
        : proof.verifiedSegments === proof.segmentCount ? 'camera_android_checked'
        : 'camera_android_partial';
      return { status, detail: proof.verifiedSegments > 0 ? 'camera_android_detail' : 'camera_segments_detail' };
    }
    const source = evidence.captureSource ?? 'unavailable';
    return CAMERA_VERIFICATION_TEXT[source] ?? CAMERA_VERIFICATION_TEXT.unavailable;
  }

  public get cameraAndroidProof() {
    const evidence = this.verifyResult?.evidence;
    return !evidence?.derivation && evidence?.captureSource === 'device_segments' && evidence.androidKeyProof?.version === 1
      ? evidence.androidKeyProof : null;
  }

  public get processingText(): string {
    return this.verificationSource === 'url'
      ? this.t('processing_url_text')
      : this.t('processing_text');
  }

  public get canVerifyUrl(): boolean {
    return this.verificationSource === 'url' && !this.isProcessing && this.sourceUrl.trim().length > 0;
  }

  public get evidenceIdLabel(): string {
    return this.verificationSource === 'file' && this.selectedFileKind === 'package'
      ? this.t('package_evidence_id')
      : this.t('embedded_evidence_id');
  }

  public t(key: VerifyTextKey): string {
    return this.langService.resolveText(TEXT_VERIFY[key]);
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

  public formatDurationMs(value: number): string {
    const totalMs = Math.max(0, Number(value) || 0);
    const totalSeconds = Math.floor(totalMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const tenths = Math.floor((totalMs % 1000) / 100);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;
  }

  public formatDate(value: string | null | undefined): string {
    const date = new Date(value ?? '');
    return Number.isNaN(date.getTime()) ? this.t('na') : this.dateFormat().format(date);
  }

  public formatSeconds(value: number): string {
    return this.secondsFormat().format(value);
  }

  public formatLocation(location: EvidenceLocationI | null): string {
    return typeof location?.lat === 'number' && typeof location.lng === 'number'
      ? `${location.lat}, ${location.lng}`
      : this.t('na');
  }

  public formatFileSize(bytes: number): string {
    const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte'];
    let unit = 0;
    while (bytes >= 1000 && unit < units.length - 1) {
      bytes /= 1000;
      unit += 1;
    }
    return new Intl.NumberFormat(this.locale(), {
      style: 'unit', unit: units[unit], maximumFractionDigits: 1
    }).format(bytes);
  }

  public selectSource(source: VerificationSource): void {
    if (this.isProcessing || this.verificationSource === source) return;
    this.verificationSource = source;
    this.isDragging = false;
    this.resetResult();
  }

  public onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!event.dataTransfer) return;
    this.isDragging = !this.isProcessing && event.dataTransfer.types.includes('Files');
    event.dataTransfer.dropEffect = this.isDragging ? 'copy' : 'none';
  }

  public onDragLeave(event: DragEvent): void {
    if (event.relatedTarget instanceof Node && (event.currentTarget as HTMLElement).contains(event.relatedTarget)) return;
    this.isDragging = false;
  }

  public onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;

    const file = event.dataTransfer?.files?.item(0) || null;
    this.setSelectedFile(file);
  }

  public onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) || null;
    this.setSelectedFile(file);
    input.value = '';
  }

  public onSourceUrlInput(event: Event): void {
    this.sourceUrl = (event.target as HTMLInputElement).value;
    this.resetResult();
  }

  public clearSelection(): void {
    this.selectedFile = null;
    this.resetResult();
  }

  private resetResult(): void {
    this.extractedEvidenceId = null;
    this.lastHashHex = '';
    this.verifyResult = null;
    this.verifiedFileName = '';
    this.errorMessage = '';
    this.hashCopyStatus = null;
  }

  public async verifySelectedFile(): Promise<void> {
    if (this.verificationSource !== 'file' || !this.selectedFile || this.isProcessing) {
      return;
    }

    const file = this.selectedFile;
    await this.runVerification(() => file, this.selectedFileKind);
  }

  public async verifyFromUrl(): Promise<void> {
    if (!this.canVerifyUrl) {
      return;
    }

    let normalizedUrl: string;
    try {
      normalizedUrl = this.normalizeSourceUrl(this.sourceUrl);
    } catch (error) {
      this.errorMessage = this.resolveErrorMessage(error);
      return;
    }

    this.sourceUrl = normalizedUrl;
    await this.runVerification(() => this.downloadRemoteMp4(normalizedUrl), 'mp4');
  }

  public async copyHash(): Promise<void> {
    const hash = this.lastHashHex;
    if (!hash) return;
    let status: VerifyTextKey;
    try {
      await copyText(this.document, hash);
      status = 'hash_copied';
    } catch {
      status = 'hash_copy_error';
    }
    if (hash === this.lastHashHex) {
      this.hashCopyStatus = status;
      this.cdr.markForCheck();
    }
  }

  private async runVerification(getFile: () => File | Promise<File>, kind: VerifyFileKind): Promise<void> {
    this.resetResult();
    this.isProcessing = true;
    this.cdr.markForCheck();

    try {
      const file = await getFile();
      await this.performVerification(file, kind);
      this.verifiedFileName = file.name;
      afterNextRender(() => this.resultHeading?.nativeElement.focus(), { injector: this.injector });
    } catch (error) {
      this.errorMessage = this.resolveErrorMessage(error);
    } finally {
      this.isProcessing = false;
      this.cdr.markForCheck();
    }
  }

  private setSelectedFile(file: File | null): void {
    if (!file || this.isProcessing) return;
    this.resetResult();

    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    const isMp4 = fileName.endsWith('.mp4') || fileType === 'video/mp4';
    const isZip =
      fileName.endsWith('.estream') ||
      fileName.endsWith('.zip') ||
      fileType === 'application/zip' ||
      fileType === 'application/x-zip-compressed' ||
      fileType === 'application/octet-stream';
    if (!isMp4 && !isZip) {
      this.errorMessage = this.t('unsupported_file_error');
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;
    this.selectedFileKind = isMp4 ? 'mp4' : 'package';
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

}
