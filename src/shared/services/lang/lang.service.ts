import { Injectable, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { LangEnum, LangTextI } from '../../interfaces';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { resolveEstonianInlineText } from './estonian-inline-translations';
import { resolveArmenianInlineText } from './armenian-inline-translations';

@Injectable({
  providedIn: 'root'
})
export class LangService {
  private storage = inject(LocalStorageService);
  private document = inject(DOCUMENT);

  private _lang$i: WritableSignal<LangEnum> = signal(LangEnum.ENG);

  public getLang$i: Signal<LangEnum> = computed((): LangEnum => {
    return this._lang$i();
  });

  public setLanguage(lang: LangEnum): void {
    const normalizedLang = this.normalizeLang(lang);

    this.storage.setItem('lang', normalizedLang);
    this._lang$i.set(normalizedLang);
    this.applyDocumentLanguage(normalizedLang);
  }

  public setStorageLanguage(): void {
    const storageLang = this.normalizeLang(this.storage.getItem('lang'));

    if (storageLang) {
      this.storage.setItem('lang', storageLang);
      this._lang$i.set(storageLang);
      this.applyDocumentLanguage(storageLang);
    }
  }

  public textByLanguage(text: LangTextI): Signal<string> {
    return computed(() => this.resolveText(text));
  }

  public resolveText(text?: LangTextI | null): string {
    if (!text) {
      return '';
    }

    if (this._lang$i() === LangEnum.ARM && !text[LangEnum.ARM]) {
      return resolveArmenianInlineText(text[LangEnum.ENG] || '');
    }

    if (this._lang$i() === LangEnum.EST && !text[LangEnum.EST]) {
      return resolveEstonianInlineText(text[LangEnum.ENG] || '');
    }

    return text[this._lang$i()] || text[LangEnum.ENG] || text[LangEnum.RUS] || text[LangEnum.ESP] || text[LangEnum.EST] || '';
  }

  public uiText(english: string): string {
    return this.resolveText({ ENG: english, RUS: english, ESP: english });
  }

  private applyDocumentLanguage(lang: LangEnum): void {
    const tags: Record<LangEnum, string> = {
      ENG: 'en', RUS: 'ru', ESP: 'es', EST: 'et', ARM: 'hy'
    };
    this.document.documentElement.lang = tags[lang];
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
      case LangEnum.ARM:
      case 'hy':
      case 'HY':
        return LangEnum.ARM;
      default:
        return LangEnum.ENG;
    }
  }
}
