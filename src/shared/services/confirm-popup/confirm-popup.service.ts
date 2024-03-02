import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, first, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfirmPopupService {
  public isVisible$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public message$: BehaviorSubject<string> =  new BehaviorSubject('');

  public isConfirmedSubject$: Subject<boolean> = new Subject();
  public isConfirmed$ = this.isConfirmedSubject$.asObservable();

  public setVisibility(value: boolean): void {
    this.isVisible$.next(value);
  }

  public setMessage(value: string): void {
    this.message$.next(value);
  }

  public setConfirm(value: boolean): void {
    this.isConfirmedSubject$.next(value);
  }

  public showPopup(message: string): Observable<boolean> {
    this.setVisibility(true);
    this.setMessage(message);

    return this.isConfirmed$.pipe(
      first(),
      tap(() => {
        this.setVisibility(false);
        this.setMessage('');
        this.isConfirmedSubject$.next(false);
      }),
      first()
    );
  }
}
