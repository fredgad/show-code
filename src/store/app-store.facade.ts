import { Injectable } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import * as actions from './app-store.actions';
import * as selectors from './app-store.selectors';
import { AuthI, RegisterI, StoreUserI } from '@shared/interfaces';

@Injectable({ providedIn: 'root' })
export class AppStoreFacade {
  public userData$: Observable<StoreUserI> = this.store$.select(selectors.selectUserData); 

  public token$: Observable<string | null> = this.store$.select(selectors.selectToken);

  public isAuth$: Observable<boolean> = this.store$.select(selectors.selectIsAuth);

  constructor(private store$: Store<selectors.AppWithAuthState>) {}

  public register(data: RegisterI): void {
    this.store$.dispatch(actions.register(data));
  }

  public auth(data: AuthI): void {
    this.store$.dispatch(actions.auth(data));
  }

  public logout(): void {
    this.store$.dispatch(actions.logout());
  }

  public getUserData(): void {
    this.store$.dispatch(actions.getUserData());
  }

  public saveImage(image: string): void {
    this.store$.dispatch(actions.saveImage({ image }));
  }
}
