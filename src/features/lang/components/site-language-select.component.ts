import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { LangEnum } from '@shared/interfaces';
import { AuthService, LangService } from '@shared/services';

export const SITE_LANGUAGES = [
  { id: LangEnum.ENG, tag: 'en', name: 'English' },
  { id: LangEnum.RUS, tag: 'ru', name: 'Русский' },
  { id: LangEnum.ESP, tag: 'es', name: 'Español' },
  { id: LangEnum.EST, tag: 'et', name: 'Eesti' },
  { id: LangEnum.ARM, tag: 'hy', name: 'Հայերեն' }
];

@Component({
  selector: 'org-site-language-select',
  standalone: true,
  template: `
    <label>
      <svg class="globe" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <ellipse cx="12" cy="12" rx="4" ry="9" />
        <path d="M3 12h18" />
      </svg>
      <select #control [attr.aria-label]="label" [value]="language()" (change)="choose(control.value)">
        @for (item of languages; track item.id) {
        <option [value]="item.id" [selected]="language() === item.id" [attr.lang]="item.tag">{{ item.name }}</option>
        }
      </select>
      <svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
    </label>
  `,
  styleUrl: './site-language-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SiteLanguageSelectComponent {
  private readonly langService = inject(LangService);
  private readonly auth = inject(AuthService);

  @Input({ required: true }) public label = '';
  public readonly language = this.langService.getLang$i;
  public readonly languages = SITE_LANGUAGES;

  public choose(value: string): void {
    const language = this.languages.find(item => item.id === value);
    if (!language || language.id === this.language()) {
      return;
    }

    this.langService.setLanguage(language.id);
    if (this.auth.isLoggedIn()) {
      this.auth.updateLanguage(language.tag).subscribe({ error: () => undefined });
    }
  }
}
