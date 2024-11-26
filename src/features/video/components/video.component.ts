import { ChangeDetectionStrategy, Component, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextDirective } from '@shared/directives';
import { BASE_VIDEO_PATH } from '@shared/constants';
import { VideoSuccessUploadI } from '@shared/interfaces';

@Component({
  selector: 'org-video',
  standalone: true,
  imports: [CommonModule, TextDirective],
  templateUrl: './video.component.html',
  styleUrl: './video.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoComponent {
  @Input() videoData!: VideoSuccessUploadI;
  @Input() isOwn: boolean = false;

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
}
