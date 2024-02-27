import { Injectable, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { LangEnum, LangTextI } from '../../interfaces';
import { LocalStorageService } from '../local-storage/local-storage.service';

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
    this.storage.setItem('lang', lang);
    this._lang$i.set(lang);
  }

  public setStorageLanguage(): void {
    const storageLang = this.storage.getItem('lang') as LangEnum; 

    if (storageLang) {
      this._lang$i.set(storageLang);
    }
  }

  public textByLanguage(text: LangTextI): Signal<string> {
    return computed(() => text[this._lang$i()]);
  }
}
