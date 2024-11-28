import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Signal, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LangService } from '@shared/services';
import { LangEnum } from '@shared/interfaces';
import { LANGUAGES_LIST } from '@shared/constants';

@Component({
  selector: 'org-lang',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lang.component.html',
  styleUrl: './lang.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LangComponent {
  public langService = inject(LangService);
  private cdr = inject(ChangeDetectorRef);

  public languagesList: LangEnum[] = LANGUAGES_LIST;
  public isOpen: boolean = false;

  public currentLang$i: Signal<LangEnum> = this.langService.getLang$i;

  private timerId: any = null;

  public handleLangClick(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }

    this.isOpen = true;

    this.timerId = setTimeout(() => {
      this.isOpen = false;
      this.cdr.markForCheck();
      this.timerId = null;
    }, 5000);
  }

  public setLanguage(lang: string): void {
    this.langService.setLanguage(lang as LangEnum);
    console.log('second');
    this.isOpen = false;
    this.cdr.markForCheck();
  }
}
