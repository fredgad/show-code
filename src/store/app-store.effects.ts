import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AuthService } from '@shared/services';
import * as actions from './app-store.actions';
import { AppWithAuthState } from './app-store.selectors';
import { AppStoreFacade } from './app-store.facade';

@Injectable()
export class AppStoreEffects {
  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private facade: AppStoreFacade,
    private store$: Store<AppWithAuthState>
  ) {}

  updateUserData$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          actions.cancelRequestSuccess,
          actions.addUserByKeyIdSuccess,
          actions.acceptTrustedUserSuccess,
          actions.removeTrustedUserSuccess,
          actions.deleteUserVideoSuccess
        ),
        tap(() => {
          this.facade.getUserData();
        })
      ),
    { dispatch: false }
  );

  updateTrustedPeople$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(actions.getUserDataSuccess),
        tap(({ data }) => {
          const keyIds = data.trustedPeople?.map(person => person.keyId) as string[];

          if (keyIds.length) {
            this.facade.getTrustedUsersByKeyIds(keyIds);
          }
        })
      ),
    { dispatch: false }
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.register),
      mergeMap(action =>
        this.authService.register(action).pipe(
          map(response => actions.registerSuccess({ token: response.token })),
          catchError(error => of(actions.registerFailure({ error })))
        )
      )
    )
  );

  registerSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(actions.registerSuccess),
        tap(response => {
          this.authService.enterAccountSuccess(response);
        })
      ),
    { dispatch: false }
  );

  auth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.auth),
      mergeMap(action =>
        this.authService.auth(action).pipe(
          map(response => actions.registerSuccess({ token: response.token })),
          catchError(error => of(actions.registerFailure({ error })))
        )
      )
    )
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(actions.logout),
        tap(() => this.authService.logout())
      ),
    { dispatch: false }
  );

  getUserData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.getUserData),
      mergeMap(() =>
        this.authService.getUserData().pipe(
          map(response => actions.getUserDataSuccess({ data: response })),
          catchError(error => of(actions.getUserDataFailure({ error })))
        )
      )
    )
  );

  getTrustedUsersByKeyIds$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.getTrustedUsersByKeyIds),
      mergeMap(({ keyIds }) =>
        this.authService.getTrustedUsersByKeyIds(keyIds).pipe(
          map(response => actions.getTrustedUsersByKeyIdsSuccess({ data: response })),
          catchError(error => of(actions.getTrustedUsersByKeyIdsFailure({ error })))
        )
      )
    )
  );

  saveImage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.saveImage),
      mergeMap(({ image }) =>
        this.authService.saveImage(image).pipe(
          map(() => actions.saveImageSuccess()),
          catchError(error => of(actions.saveImageFailure({ error })))
        )
      )
    )
  );

  addUserByKeyId$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.addUserByKeyId),
      mergeMap(({ keyId }) =>
        this.authService.addUserByKeyId(keyId).pipe(
          map(() => actions.addUserByKeyIdSuccess()),
          catchError(error => of(actions.addUserByKeyIdFailure({ error })))
        )
      )
    )
  );

  cancelRequest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.cancelRequest),
      mergeMap(({ keyId }) =>
        this.authService.cancelRequest(keyId).pipe(
          map(() => actions.cancelRequestSuccess()),
          catchError(error => of(actions.cancelRequestFailure({ error })))
        )
      )
    )
  );

  acceptTrustedUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.acceptTrustedUser),
      mergeMap(({ keyId }) =>
        this.authService.acceptTrustedUser(keyId).pipe(
          map(() => actions.acceptTrustedUserSuccess()),
          catchError(error => of(actions.acceptTrustedUserFailure({ error })))
        )
      )
    )
  );

  removeTrustedUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.removeTrustedUser),
      mergeMap(({ keyId }) =>
        this.authService.removeTrustedUser(keyId).pipe(
          map(() => actions.removeTrustedUserSuccess()),
          catchError(error => of(actions.removeTrustedUserFailure({ error })))
        )
      )
    )
  );

  // Video
  uploadVideo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.uploadVideo),
      mergeMap(({ formData }) =>
        this.authService.uploadVideo(formData).pipe(
          map(response => actions.uploadVideoSuccess({ data: response })),
          catchError(error => of(actions.uploadVideoFailure({ error })))
        )
      )
    )
  );

  deleteUserVideo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.deleteUserVideo),
      mergeMap(({ videoData }) =>
        this.authService.deleteUserVideo(videoData).pipe(
          map(() => actions.deleteUserVideoSuccess()),
          catchError(error => of(actions.deleteUserVideoFailure({ error })))
        )
      )
    )
  );

  // getVideosByKeyId$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(actions.getVideosByKeyId),
  //     mergeMap((keyId) =>
  //       this.authService.getVideosByKeyId().pipe(
  //         map(response => actions.getVideosByKeyIdSuccess({ data: response })),
  //         catchError(error => of(actions.getVideosByKeyIdFailure({ error })))
  //       )
  //     )
  //   )
  // );
}
