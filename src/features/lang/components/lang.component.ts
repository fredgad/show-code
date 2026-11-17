import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Signal, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, LangService } from '@shared/services';
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
  private authService = inject(AuthService);
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

    if (this.authService.isLoggedIn()) {
      this.authService.updateLanguage(this.toApiLang(lang as LangEnum)).subscribe({
        error: () => {
          // The local selection remains active; x-lang keeps current requests localized.
        }
      });
    }

    this.isOpen = false;
    this.cdr.markForCheck();
  }

  private toApiLang(lang: LangEnum): string {
    switch (lang) {
      case LangEnum.RUS:
        return 'ru';
      case LangEnum.ESP:
        return 'es';
      case LangEnum.EST:
        return 'et';
      case LangEnum.ARM:
        return 'hy';
      default:
        return 'en';
    }
  }
}
