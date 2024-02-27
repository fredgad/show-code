import { Action, createReducer, on } from '@ngrx/store';
import {
  authSuccess,
  authFailure
} from './app-store.actions';

export interface StoreStateI {
  auth: StoreAuthI 
}

export interface StoreAuthI {
  token: string;
  authorized: boolean;
}

const initialState: StoreStateI = {
  auth: {
    token: '',
    authorized: false,
  }
};

const appReducer = createReducer(
  initialState,
  on(authSuccess, (state, { token, auth }) => ({
    ...state,
    auth: { ...state.auth, token, auth },
  })),
  on(authFailure, (state, { token, auth }) => ({
    ...state,
    auth: { ...state.auth, token, auth },
  }))
);

export function reducer(state: StoreStateI | undefined, action: Action) {
  return appReducer(state, action);
}
