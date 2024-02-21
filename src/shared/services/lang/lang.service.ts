import { Injectable, Signal, WritableSignal, computed, signal } from '@angular/core';
import { LangEnum, LangTextI } from '../../interfaces';

@Injectable({
  providedIn: 'root'
})
export class LangService {
  private _lang$i: WritableSignal<LangEnum> = signal(LangEnum.ENG);

  public getLang$i: Signal<LangEnum> = computed((): LangEnum => {
    return this._lang$i();
  });

  public setLanguage(lang: LangEnum): void {
    window.localStorage.setItem('lang', lang);
    this._lang$i.set(lang);
  }

  public setStorageLanguage(): void {
    const storageLang = window.localStorage.getItem('lang') as LangEnum; 

    if (storageLang) {
      this._lang$i.set(storageLang);
    }
  }

  public textByLanguage(text: LangTextI): Signal<string> {
    return computed(() => text[this._lang$i()]);
  }
}
