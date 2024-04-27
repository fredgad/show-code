import { Action, createReducer, on } from '@ngrx/store';
import {
  authSuccess,
  authFailure,
  registerSuccess,
  registerFailure,
  logout,
  getUserDataFailure,
  getUserDataSuccess,
  saveImage
} from './app-store.actions';
import { StoreStateI } from '@shared/interfaces';

const initialState: StoreStateI = {
  auth: {
    token: '',
    error: '',
  },
  user: {
    userId: '',
    userKey: '',
    username: '',
    email: '',
  }
};

const appReducer = createReducer(
  initialState,
  on(registerSuccess, (state, action) => (
    { ...state,
      auth: {
        ...state.auth,
        token: action.token,
        error: null
      }
    })
  ),
  on(registerFailure, (state, action) => (
    { ...state,
      auth: {
        ...state.auth,
        token: null,
        error: action.error
      } 
    })
  ),

  on(authSuccess, (state, { token }) => ({
    ...state,
    auth: { ...state.auth, token },
  })),
  on(authFailure, (state, { err }) => ({
    ...state,
    auth: { ...state.auth, token: null, err },
  })),

  on(logout, (state) => ({
    ...state,
    auth: {
      ...state.auth,
      token: null,
      error: null
    },
    user: {
      ...state.user,
      userId: null,
      userKey: null,
      username: null,
      email: null,
      image: null,
    },
  })),

  on(getUserDataSuccess, (state, { data }) => {
    return {
      ...state,
      auth: {
        ...state.auth,
        error: ''
      },
      user: {
        ...state.user,
        userId: data._id,
        userKey: data._id,
        username: data.username,
        email: data.email,
        image: data?.image,
      },
    }
  }),

  on(getUserDataFailure, (state) => ({
    ...state,
    auth: {
      ...state.auth,
      token: null,
      error: null
    },
    user: {
      ...state.user,
      userId: null,
      userKey: null
    },
  })),
  
  on(saveImage, (state, { image }) => ({
    ...state,
    user: {
      ...state.user,
      image
    },
  })),
);

export function reducer(state: StoreStateI | undefined, action: Action) {
  return appReducer(state, action);
}
