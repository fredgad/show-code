import { ChangeDetectionStrategy, Component, inject, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextDirective } from '@shared/directives';
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
    return this.videoData.url;
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
        anchor.download = this.videoPath.split('/').pop() || '';
        anchor.click();
        URL.revokeObjectURL(blobUrl);

        this.notification.show(`Successfuly download video.`);
      })
      .catch(error => {
        this.notification.showError('Error downloading video. Please try again.');
      });
  }
}
