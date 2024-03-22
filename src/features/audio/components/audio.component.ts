import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextDirective } from '@shared/directives';

@Component({
  selector: 'org-audio',
  standalone: true,
  imports: [CommonModule, TextDirective],
  templateUrl: './audio.component.html',
  styleUrl: './audio.component.scss',
})
export class AudioComponent {
  @Input() audioName: string = '';

  public baseAudioPath: string = './assets/audio/';

  public get audioPath(): string {
    return this.baseAudioPath + this.audioName;
  }
}
