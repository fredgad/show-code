import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoComponent } from '@features/video';
import { VideoSuccessUploadI } from '@shared/interfaces';
import { AppStoreFacade } from '@store';

@Component({
  selector: 'org-video-block',
  standalone: true,
  imports: [CommonModule, VideoComponent],
  templateUrl: './video-block.component.html',
  styleUrl: './video-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoBlockComponent {
  @Input() isOwn: boolean = false;
  @Input() videos: VideoSuccessUploadI[] = [];

  public userData$ = inject(AppStoreFacade).userData$;
}
