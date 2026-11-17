import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, timer } from 'rxjs';
import { catchError, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AuthService, ServerNotificationsService, StreamService } from '@shared/services';
import * as actions from './app-store.actions';
import { AppWithAuthState } from './app-store.selectors';
import { AppStoreFacade } from './app-store.facade';

@Injectable()
export class AppStoreEffects {
  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private streamService: StreamService,
    private serverNotificationsService: ServerNotificationsService,
    private facade: AppStoreFacade,
    private store$: Store<AppWithAuthState>
  ) { }

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
          const keyIds = (data.trustedPeople ?? []).map(person => person.keyId).filter(Boolean) as string[];

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
      mergeMap(({ refresh }) =>
        this.authService.getUserData(refresh).pipe(
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

  startStream$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.startStream),
      mergeMap(({ title }) =>
        this.streamService.startStream(title).pipe(
          map(res => actions.startStreamSuccess({ streamId: res.streamId })),
          catchError(error => of(actions.startStreamFailure({ error })))
        )
      )
    )
  );

  endStream$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.endStream),
      mergeMap(({ streamId }) =>
        this.streamService.endStream(streamId).pipe(
          map(() => actions.endStreamSuccess()),
          catchError(error => of(actions.endStreamFailure({ error })))
        )
      )
    )
  );

  startStreamSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(actions.startStreamSuccess)
        // tap(() => this.notificationService.show('Трансляция успешно начата'))
      ),
    { dispatch: false }
  );

  endStreamSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(actions.endStreamSuccess)
        // tap(() => this.notificationService.show('Трансляция успешно завершена'))
      ),
    { dispatch: false }
  );

  // pollNotifications$ = createEffect(
  //   () =>
  //     timer(0, 5000).pipe(
  //       // Пуллинг раз в 5 сек
  //       switchMap(() =>
  //         this.serverNotificationsService.getNotifications().pipe(
  //           map(notifications => actions.loadNotificationsSuccess({ notifications })),
  //           catchError(error => of(actions.loadNotificationsFailure({ error })))
  //         )
  //       )
  //     ),
  //   { dispatch: true }
  // );
}
