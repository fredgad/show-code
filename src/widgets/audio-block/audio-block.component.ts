import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioComponent } from '@features/audio';

@Component({
  selector: 'org-audio-block',
  standalone: true,
  imports: [CommonModule, AudioComponent],
  templateUrl: './audio-block.component.html',
  styleUrl: './audio-block.component.scss',
})
export class AudioBlockComponent {
  public audioList = [
    'Free_Test_Data_100KB_MP3.mp3',
    'Free_Test_Data_500KB_WAV.wav',
    'Free_Test_Data_100KB_MP3.mp3',
    'Free_Test_Data_500KB_WAV.wav',
  ];
}
