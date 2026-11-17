import { DatePipe, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnDestroy, Output, EventEmitter, SimpleChanges, ViewChild, computed, inject, signal } from '@angular/core';
import { copyText } from '@shared/helpers';
import { LangService } from '@shared/services';
import { Subscription } from 'rxjs';
import { VaultGeoPoint, VaultGeoSnapshot, locationAt, locationPoint } from './vault-geo';
import { VaultMediaService, VaultPlaybackItem } from './vault-media.service';
import { vaultPlayerText } from './vault-player.text';

export interface VaultTrimRequest {
  startMs: number;
  endMs: number;
  title?: string;
  expectedEvidenceId?: string;
}

type PlayerLabel = keyof typeof vaultPlayerText;

@Component({
  selector: 'org-vault-player',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './vault-player.component.html',
  styleUrl: './vault-player.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VaultPlayerComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) item!: VaultPlaybackItem;
  @Input() trim = false;
  @Input() saving = false;
  @Output() readonly trimSubmit = new EventEmitter<VaultTrimRequest>();
  @ViewChild('film') private film?: ElementRef<HTMLVideoElement>;

  private readonly api = inject(VaultMediaService);
  private readonly document = inject(DOCUMENT);
  private readonly language = inject(LangService);
  private sourceRequest?: Subscription;
  private geoRequest?: Subscription;

  readonly source = signal<string | null>(null);
  readonly poster = signal<string | null>(null);
  readonly failed = signal(false);
  readonly ready = signal(false);
  readonly playing = signal(false);
  readonly duration = signal(0);
  readonly start = signal(0);
  readonly end = signal(0);
  readonly position = signal(0);
  readonly selectedDuration = computed(() => this.end() - this.start());
  readonly geoTrack = signal<VaultGeoSnapshot | null>(null);
  readonly geoFailed = signal(false);
  readonly geoPoint = computed(() => {
    const track = this.geoTrack();
    return track ? locationAt(track, this.position()) : null;
  });
  readonly measurements = computed(() => {
    const seen = new Set<string>();
    return (this.geoTrack()?.points ?? []).filter(point => {
      if (!point.sampleId) return true;
      if (seen.has(point.sampleId)) return false;
      seen.add(point.sampleId);
      return true;
    });
  });
  readonly mapPoint = signal<VaultGeoPoint | null>(null);
  readonly copyFeedback = signal<PlayerLabel | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.item) return;
    const previous = changes['item']?.previousValue as VaultPlaybackItem | undefined;
    const sameRecording = previous && previous.url === this.item.url && previous.evidenceId === this.item.evidenceId &&
      previous.cameraRecordingId === this.item.cameraRecordingId && previous.captureOrigin?.deviceId === this.item.captureOrigin?.deviceId &&
      previous.captureOrigin?.cameraRecordingId === this.item.captureOrigin?.cameraRecordingId &&
      previous.playbackRequiresSession === this.item.playbackRequiresSession;
    if (changes['item'] && !sameRecording) {
      this.load();
    } else if (changes['trim']) {
      this.start.set(0);
      this.end.set(this.duration());
      if (this.trim) {
        this.film?.nativeElement.pause();
        this.seek(0);
      } else {
        this.loadGeo();
      }
    }
  }

  ngOnDestroy(): void {
    this.sourceRequest?.unsubscribe();
    this.geoRequest?.unsubscribe();
    this.film?.nativeElement.pause();
  }

  text(key: PlayerLabel): string {
    return this.language.resolveText(vaultPlayerText[key]);
  }

  load(): void {
    this.sourceRequest?.unsubscribe();
    this.geoRequest?.unsubscribe();
    this.film?.nativeElement.pause();
    this.source.set(null);
    this.poster.set(null);
    this.failed.set(false);
    this.ready.set(false);
    this.playing.set(false);
    this.duration.set(0);
    this.start.set(0);
    this.end.set(0);
    this.position.set(0);
    this.geoTrack.set(null);
    this.geoFailed.set(false);
    this.mapPoint.set(null);
    this.copyFeedback.set(null);
    this.api.posterUrl(this.item).subscribe(url => this.poster.set(url));
    this.sourceRequest = this.api.playbackUrl(this.item).subscribe({
      next: source => {
        this.source.set(source);
        if (!this.trim) this.loadGeo();
      },
      error: () => this.failed.set(true),
    });
  }

  loadGeo(): void {
    const source = this.source();
    if (!source) return;
    this.geoRequest?.unsubscribe();
    this.geoFailed.set(false);
    this.geoRequest = this.api.geoTrack(source).subscribe({
      next: track => this.geoTrack.set(track ?? this.summaryLocation()),
      error: () => {
        this.geoTrack.set(this.summaryLocation());
        this.geoFailed.set(true);
      },
    });
  }

  mediaError(): void {
    this.failed.set(true);
    this.ready.set(false);
    this.playing.set(false);
  }

  metadata(video: HTMLVideoElement): void {
    const duration = Number.isFinite(video.duration) ? video.duration : this.item.duration ?? 0;
    const milliseconds = Math.max(0, Math.floor(duration * 1000));
    this.duration.set(milliseconds);
    this.end.set(milliseconds);
    this.ready.set(true);
  }

  updatePosition(video: HTMLVideoElement): void {
    const position = Math.round(video.currentTime * 1000);
    if (this.trim && !video.paused && position >= this.end() && this.end() > this.start()) {
      this.seek(this.start());
      return;
    }
    this.position.set(position);
  }

  ended(video: HTMLVideoElement): void {
    if (!this.trim || !this.playing() || this.selectedDuration() < 1000) {
      this.playing.set(false);
      return;
    }
    this.seek(this.start());
    void video.play().catch(() => this.playing.set(false));
  }

  changeBoundary(which: 'start' | 'end', value: number): void {
    if (!Number.isFinite(value) || this.duration() < 1000) return;
    const lower = which === 'start' ? 0 : this.start() + 1000;
    const upper = which === 'start' ? this.end() - 1000 : this.duration();
    const next = Math.min(upper, Math.max(lower, Math.round(value)));
    this.film?.nativeElement.pause();
    (which === 'start' ? this.start : this.end).set(next);
    this.seek(next);
  }

  preview(): void {
    const video = this.film?.nativeElement;
    if (!video) return;
    if (!video.paused) {
      video.pause();
      return;
    }
    if (this.position() < this.start() || this.position() >= this.end()) this.seek(this.start());
    void video.play().catch(() => this.playing.set(false));
  }

  submit(title: string): void {
    if (this.saving || !this.ready() || this.selectedDuration() < 1000) return;
    this.film?.nativeElement.pause();
    this.trimSubmit.emit({
      startMs: this.start(),
      endMs: this.end(),
      title: title.trim() || undefined,
      expectedEvidenceId: this.item.evidenceId ?? undefined,
    });
  }

  time(ms: number, tenths = false): string {
    const units = Math.floor(ms / 100);
    const seconds = Math.floor(units / 10);
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}${tenths ? `.${units % 10}` : ''}`;
  }

  coordinates(point: VaultGeoPoint): string {
    return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
  }

  ageSeconds(measured: number): number {
    return Math.round((this.position() - measured) / 1000);
  }

  measurementIndex(point: VaultGeoPoint): number {
    return this.measurements().findIndex(entry => point.sampleId ? entry.sampleId === point.sampleId : entry === point);
  }

  openMap(point: VaultGeoPoint): void {
    this.film?.nativeElement.pause();
    this.mapPoint.set(point);
  }

  selectMeasurement(index: number): void {
    const point = this.measurements()[index];
    if (!point) return;
    this.mapPoint.set(point);
    this.seek(point.videoOffsetMs);
  }

  mapUrl(point: VaultGeoPoint): string {
    return `https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lng}#map=17/${point.lat}/${point.lng}`;
  }

  async copyCoordinates(point: VaultGeoPoint): Promise<void> {
    try {
      await copyText(this.document, this.coordinates(point));
      this.copyFeedback.set('copied');
    } catch {
      this.copyFeedback.set('copyError');
    }
  }

  emptyGeoLabel(track: VaultGeoSnapshot): PlayerLabel {
    if (track.state === 'off') return 'off';
    if (track.state === 'unaligned') return 'unaligned';
    return track.points.length ? 'noPoint' : 'notRecorded';
  }

  private seek(ms: number): void {
    const video = this.film?.nativeElement;
    if (!video || !this.ready()) return;
    const position = Math.min(ms, this.duration());
    video.currentTime = position / 1000;
    this.position.set(position);
  }

  private summaryLocation(): VaultGeoSnapshot | null {
    const point = locationPoint(this.item.location);
    return point ? { state: 'legacy', signatureValid: false, points: [point], gaps: [] } : null;
  }
}
