import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoComponent } from '@features/video';

@Component({
  selector: 'org-video-block',
  standalone: true,
  imports: [CommonModule, VideoComponent],
  templateUrl: './video-block.component.html',
  styleUrl: './video-block.component.scss',
})
export class VideoBlockComponent {
  public videoList = [
    'SampleVideo_1280x720_1mb.mp4',
    'SampleVideo_1280x720_2mb.mp4',
    'SampleVideo_1280x720_5mb.mp4',
    'SampleVideo_1280x720_5mb.mp4',
    'SampleVideo_1280x720_5mb.mp4'
  ];
}
