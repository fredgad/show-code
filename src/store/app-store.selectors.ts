import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoreStateI } from '@shared/interfaces';

export interface State {
  _empty?: boolean;
}

export const storeFeatureKey = 'App';

export interface AppWithAuthState extends State {
  [storeFeatureKey]: StoreStateI;
}

export const selectFeature = createFeatureSelector<AppWithAuthState, StoreStateI>(
  storeFeatureKey
);

export const selectStore = createSelector(selectFeature, (state) => state);

export const selectAuth = createSelector(
  selectFeature,
  (state) => state.auth
);

export const selectToken = createSelector(selectFeature, (state) => state.auth.token);

export const selectIsAuth = createSelector(selectToken, (token) => !!token);

export const selectUserData = createSelector(selectFeature, (state) => state.user);
