import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextDirective } from '@shared/directives';
import { VideoBlockComponent } from '@widgets/video-block';
import { AudioBlockComponent } from '@widgets/audio-block';
import { AppStoreFacade } from '@store';

@Component({
  selector: 'org-saved-media',
  standalone: true,
  imports: [CommonModule, TextDirective, VideoBlockComponent, AudioBlockComponent],
  templateUrl: './saved-media.component.html',
  styleUrl: './saved-media.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SavedMediaComponent {
  public userData$ = inject(AppStoreFacade).userData$;
  public currentTab = 0;

  public changeTab(tab: number): void {
    this.currentTab = tab;
  }
}
