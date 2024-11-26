import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoreStateI, TrustedPersonI } from '@shared/interfaces';

export interface State {
  _empty?: boolean;
}

export const storeFeatureKey = 'App';

export interface AppWithAuthState extends State {
  [storeFeatureKey]: StoreStateI;
}

export const selectFeature = createFeatureSelector<AppWithAuthState, StoreStateI>(storeFeatureKey);

export const selectStore = createSelector(selectFeature, state => state);

export const selectAuth = createSelector(selectFeature, state => state.auth);

export const selectToken = createSelector(selectFeature, state => state.auth.token);

export const selectIsAuth = createSelector(selectToken, token => !!token);

export const selectUserData = createSelector(selectFeature, state => state.user);

export const selectUserIncomingReq = createSelector(selectUserData, state => state.incomingReq);

export const selectUserOutgoingReq = createSelector(selectUserData, state => state.outgoingReq);

export const selectTrustedPeople = createSelector(selectUserData, state => state.trustedPeople as TrustedPersonI[]);

// export const selectUserVideos = createSelector(selectUserData, state => state.videos);
