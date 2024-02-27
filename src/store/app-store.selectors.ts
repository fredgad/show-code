import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StoreStateI } from './app-store.reducer';

export interface State {
  _empty?: boolean;
}

export const storeFeatureKey = 'App';

export interface AppState extends State {
  [storeFeatureKey]: StoreStateI;
}

export const selectFeature = createFeatureSelector<AppState, StoreStateI>(
  storeFeatureKey
);

export const selectStore = createSelector(selectFeature, (state) => state);

export const selectAuth = createSelector(
  selectFeature,
  (state) => state.auth
);

export const selectToken = createSelector(selectFeature, (state) => state.auth.token);
export const selectAuthorized = createSelector(selectFeature, (state) => state.auth.authorized);
