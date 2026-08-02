import { ChangeDetectionStrategy, Component, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextDirective } from '@shared/directives';
import { VideoBlockComponent } from '@widgets/video-block';
import { AudioBlockComponent } from '@widgets/audio-block';
import { AppStoreFacade } from '@store';
import { LangService } from '@shared/services';
import { OverflowMarqueeComponent } from '@features';

@Component({
  selector: 'org-saved-media',
  standalone: true,
  imports: [CommonModule, TextDirective, VideoBlockComponent, AudioBlockComponent, OverflowMarqueeComponent],
  templateUrl: './saved-media.component.html',
  styleUrl: './saved-media.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SavedMediaComponent {
  private langService = inject(LangService);

  public userData$ = inject(AppStoreFacade).userData$;
  public currentTab = 0;
  public videoLabel$i: Signal<string> = this.langService.textByLanguage({ ENG: 'Video', ESP: 'Video', RUS: 'Видео' });
  public audioLabel$i: Signal<string> = this.langService.textByLanguage({ ENG: 'Audio', ESP: 'Audio', RUS: 'Аудио' });

  public changeTab(tab: number): void {
    this.currentTab = tab;
  }
}
