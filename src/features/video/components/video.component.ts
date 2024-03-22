import { Component, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextDirective } from '@shared/directives';

@Component({
  selector: 'org-video',
  standalone: true,
  imports: [CommonModule, TextDirective],
  templateUrl: './video.component.html',
  styleUrl: './video.component.scss',
})
export class VideoComponent {
  @Input() videoName: string = '';

  public baseVideoPath: string = './assets/video/';

  public get videoPath(): string {
    return this.baseVideoPath + this.videoName;
  }
}
