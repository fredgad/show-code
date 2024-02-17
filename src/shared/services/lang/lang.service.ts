import { Injectable, Signal, WritableSignal, computed, signal } from '@angular/core';
import { LangEnum } from '../../interfaces';

@Injectable({
  providedIn: 'root'
})
export class LangService {
  private _lang$i: WritableSignal<LangEnum> = signal(LangEnum.ENG);

  public getLang$i: Signal<LangEnum> = computed((): LangEnum => {
    return this._lang$i();
  });

  public setLanguage(lang: LangEnum): void {
    console.log('set, ' ,lang)
    window.localStorage.setItem('lang', lang);
    this._lang$i.set(lang);

    // if (true) {
    //   this._lang$i.update((value) => {
    //     const nextLang = value === LangEnum.ENG ? LangEnum.RUS : LangEnum.ENG;
    //     window.localStorage.setItem('lang', nextLang);
    //     return nextLang;
    //   });
    // }
  }

  public setStorageLanguage(): void {
    const storageLang = window.localStorage.getItem('lang') as LangEnum; 

    if (storageLang) {
      this._lang$i.set(storageLang);
    }
  }
}
