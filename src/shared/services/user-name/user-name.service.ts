import { Injectable, WritableSignal, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserNameService {
  private _userName$i: WritableSignal<string> = signal('');

  set setUserName(name: string) {
    this._userName$i.set(name);
  }

  get getUserName(): WritableSignal<string> {
    return this._userName$i;
  }
}
