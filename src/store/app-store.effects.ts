import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AuthService } from '@shared/services';
import * as AuthActions from './app-store.actions';
import { AppWithAuthState } from './app-store.selectors';
import { AppStoreFacade } from './app-store.facade';


@Injectable()
export class AppStoreEffects {
  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private appStoreFacade: AppStoreFacade,
    private store$: Store<AppWithAuthState>
  ) {}

  register$ = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.register),
    mergeMap((action) => 
      this.authService.register(action).pipe(
        map(response => AuthActions.registerSuccess({token: response.token})),
        catchError(error => of(AuthActions.registerFailure({ error })))
      ) 
    )
  ));

  registerSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.registerSuccess),
      tap((response) => {
        this.authService.enterAccountSuccess(response);
      })
  ), { dispatch: false });

  auth$ = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.auth),
    mergeMap((action) => 
      this.authService.auth(action).pipe(
        map(response => AuthActions.registerSuccess({token: response.token})),
        catchError(error => of(AuthActions.registerFailure({ error })))
      ) 
    )
  ));

  logout$ = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.logout),
      tap(() => this.authService.logout()),
  ), { dispatch: false });

  getUserData$ = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.getUserData),
    mergeMap(() => 
      this.authService.getUserData().pipe(
        map(response => AuthActions.getUserDataSuccess({ data: response })),
        catchError(error => of(AuthActions.getUserDataFailure({ error })))
      ) 
    ),
  ));

  saveImage$ = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.saveImage),
    mergeMap(({ image }) => 
      this.authService.saveImage(image).pipe(
        map(() => AuthActions.saveImageSuccess()),
        catchError(error => of(AuthActions.saveImageFailure({ error }))),
      ) 
    ),
  ));
}
