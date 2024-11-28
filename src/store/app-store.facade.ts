import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { map, Observable } from 'rxjs';
import * as actions from './app-store.actions';
import * as selectors from './app-store.selectors';
import { AuthI, RegisterI, StoreUserIN, TrustedPersonI, VideoDataI } from '@shared/interfaces';

@Injectable({ providedIn: 'root' })
export class AppStoreFacade {
  public token$: Observable<string | null> = this.store$.select(selectors.selectToken);

  public isAuth$: Observable<boolean> = this.store$.select(selectors.selectIsAuth);

  public userData$: Observable<StoreUserIN> = this.store$.select(selectors.selectUserData);

  public outgoingReq$: Observable<string[]> = this.store$.pipe(
    select(selectors.selectUserOutgoingReq),
    map(req => req || [])
  );

  public incomingReq$: Observable<string[]> = this.store$.pipe(
    select(selectors.selectUserIncomingReq),
    map(req => req || [])
  );

  public trustedPeople$: Observable<TrustedPersonI[]> = this.store$.pipe(
    select(selectors.selectTrustedPeople),
    map(val => val || [])
  );

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

  public getTrustedUsersByKeyIds(keyIds: string[]): void {
    this.store$.dispatch(actions.getTrustedUsersByKeyIds({ keyIds }));
  }

  public saveImage(image: string): void {
    this.store$.dispatch(actions.saveImage({ image }));
  }

  public addUserByKeyId(keyId: string): void {
    this.store$.dispatch(actions.addUserByKeyId({ keyId }));
  }

  public cancelRequest(keyId: string): void {
    this.store$.dispatch(actions.cancelRequest({ keyId }));
  }

  public acceptTrustedUser(keyId: string): void {
    this.store$.dispatch(actions.acceptTrustedUser({ keyId }));
  }

  public removeTrustedUser(keyId: string): void {
    this.store$.dispatch(actions.removeTrustedUser({ keyId }));
  }

  public uploadVideo(formData: FormData): void {
    this.store$.dispatch(actions.uploadVideo({ formData }));
  }

  // public getVideosByKeyId(keyId): void {
  //   this.store$.dispatch(actions.getVideosByKeyId(keyId));
  // }

  public deleteUserVideo(videoData: VideoDataI): void {
    this.store$.dispatch(actions.deleteUserVideo({ videoData }));
  }
}
