import { Injectable, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { LangEnum, LangTextI } from '../../interfaces';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { resolveEstonianInlineText } from './estonian-inline-translations';

@Injectable({
  providedIn: 'root'
})
export class LangService {
  private storage = inject(LocalStorageService);

  private _lang$i: WritableSignal<LangEnum> = signal(LangEnum.ENG);

  public getLang$i: Signal<LangEnum> = computed((): LangEnum => {
    return this._lang$i();
  });

  public setLanguage(lang: LangEnum): void {
    const normalizedLang = this.normalizeLang(lang);

    this.storage.setItem('lang', normalizedLang);
    this._lang$i.set(normalizedLang);
  }

  public setStorageLanguage(): void {
    const storageLang = this.normalizeLang(this.storage.getItem('lang'));

    if (storageLang) {
      this.storage.setItem('lang', storageLang);
      this._lang$i.set(storageLang);
    }
  }

  public textByLanguage(text: LangTextI): Signal<string> {
    return computed(() => this.resolveText(text));
  }

  public resolveText(text?: LangTextI | null): string {
    if (!text) {
      return '';
    }

    if (this._lang$i() === LangEnum.EST && !text[LangEnum.EST]) {
      return resolveEstonianInlineText(text[LangEnum.ENG] || '');
    }

    return text[this._lang$i()] || text[LangEnum.ENG] || text[LangEnum.RUS] || text[LangEnum.ESP] || text[LangEnum.EST] || '';
  }

  private normalizeLang(lang: string | null): LangEnum {
    switch (lang) {
      case LangEnum.ENG:
      case 'en':
      case 'EN':
        return LangEnum.ENG;
      case LangEnum.RUS:
      case 'ru':
      case 'RU':
        return LangEnum.RUS;
      case LangEnum.ESP:
      case 'es':
      case 'ES':
        return LangEnum.ESP;
      case LangEnum.EST:
      case 'et':
      case 'ET':
        return LangEnum.EST;
      default:
        return LangEnum.ENG;
    }
  }
}
