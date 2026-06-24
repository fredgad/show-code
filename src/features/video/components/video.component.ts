import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextDirective } from '@shared/directives';
import { APP_API_URL } from '@shared/constants';
import { VideoDataI } from '@shared/interfaces';
import { AppStoreFacade } from '@store';
import { NotificationService } from '@shared/services';

@Component({
  selector: 'org-video',
  standalone: true,
  imports: [CommonModule, TextDirective],
  templateUrl: './video.component.html',
  styleUrl: './video.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoComponent {
  @Input() videoData!: VideoDataI;
  @Input() isOwn: boolean = false;

  private facade = inject(AppStoreFacade);
  private notification = inject(NotificationService);

  public videoDuration: string = '';

  public get videoPath(): string {
    if (!this.videoData?.url) {
      return '';
    }

    if (/^https?:\/\//i.test(this.videoData.url)) {
      return this.videoData.url;
    }

    const apiBase = APP_API_URL || '';
    return `${apiBase}${this.videoData.url}`;
  }

  public get videoDate(): string {
    return this.videoData.createdAt;
  }

  onMetadataLoaded(event: Event): void {
    const videoElement = event.target as HTMLVideoElement;

    if (isFinite(videoElement.duration) && videoElement.duration > 0) {
      const durationInSeconds = videoElement.duration;

      const minutes = Math.floor(durationInSeconds / 60);
      const seconds = Math.floor(durationInSeconds % 60);
      this.videoDuration = `${minutes}m. ${seconds}s.`;
    } else {
      this.videoDuration = 'Unknown';
    }
  }

  public deleteVideo(videoData: VideoDataI): void {
    this.facade.deleteUserVideo(videoData);
  }

  public downloadVideo(): void {
    if (!this.videoPath) {
      this.notification.show('Video path is not available.');
      return;
    }

    fetch(this.videoPath)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.blob();
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = this.downloadFileName;
        anchor.click();
        URL.revokeObjectURL(blobUrl);

        this.notification.show(`Successfuly download video.`);
      })
      .catch(error => {
        this.notification.showError(`${error}, Error downloading video. Please try again.`);
      });
  }

  private get downloadFileName(): string {
    const dateStamp = this.formatDateStamp(this.videoData?.createdAt);
    const shortId = this.shortEvidenceId(this.videoData?.evidenceId);
    const suffix = shortId ? `-${shortId}` : '';

    return `e-video-${dateStamp}${suffix}.mp4`;
  }

  private formatDateStamp(value?: string): string {
    const date = value ? new Date(value) : new Date();
    const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
    const pad2 = (part: number): string => String(part).padStart(2, '0');

    return [
      safeDate.getUTCFullYear(),
      pad2(safeDate.getUTCMonth() + 1),
      pad2(safeDate.getUTCDate()),
      '-',
      pad2(safeDate.getUTCHours()),
      pad2(safeDate.getUTCMinutes()),
      pad2(safeDate.getUTCSeconds()),
      'Z',
    ].join('');
  }

  private shortEvidenceId(value?: string): string {
    const normalized = String(value || '').replace(/[^a-zA-Z0-9]/g, '');
    return normalized.slice(-8);
  }
}
