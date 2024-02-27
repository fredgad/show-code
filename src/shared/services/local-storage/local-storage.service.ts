import { Inject, Injectable } from '@angular/core';
import { LOCAL_STORAGE } from '../../tokens';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  constructor(@Inject(LOCAL_STORAGE) private storage: Storage) {}

  setItem(key: string, val: string): void {
    this.storage?.setItem(key, val);
  }

  setObjectLikeItem(key: string, val: object): void {
    this.storage?.setItem(key, JSON.stringify(val));
  }

  getItem(key: string): string | null {
    return this.storage?.getItem(key);
  }

  getObjectLikeItem(key: string): string | null {
    return this.stringifyStorageItem(this.storage?.getItem(key));
  }

  stringifyStorageItem(item: string | null): string | null {
    let parsedItem;
  
    try {
      parsedItem = item && JSON.parse(item);
    } catch {
      parsedItem = null;
    }
  
    return parsedItem;
  };
}
