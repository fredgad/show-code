import { ChangeDetectionStrategy, Component, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LangService } from '@shared/services';
import { LangEnum } from '@shared/interfaces';

@Component({
  selector: 'org-lang',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lang.component.html',
  styleUrl: './lang.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LangComponent {
  public langService = inject(LangService);

  public languageList = ['ENG', 'ESP', 'RUS'];

  public currentLang$i: Signal<LangEnum> = this.langService.getLang$i;

  public setLanguage(lang: string) {
    this.langService.setLanguage(lang as LangEnum);
  }
}
