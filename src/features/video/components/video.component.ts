import { ChangeDetectionStrategy, Component, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextDirective } from '@shared/directives';
import { BASE_VIDEO_PATH } from '@shared/constants';

@Component({
  selector: 'org-video',
  standalone: true,
  imports: [CommonModule, TextDirective],
  templateUrl: './video.component.html',
  styleUrl: './video.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoComponent {
  @Input() videoName: string = '';

  public baseVideoPath: string = BASE_VIDEO_PATH;

  public get videoPath(): string {
    return this.baseVideoPath + this.videoName;
  }
}
