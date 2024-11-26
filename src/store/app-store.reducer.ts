import { Action, createReducer, on } from '@ngrx/store';
import {
  authSuccess,
  authFailure,
  registerSuccess,
  registerFailure,
  logout,
  getUserDataFailure,
  getUserDataSuccess,
  saveImage,
  getTrustedUsersByKeyIdsSuccess
} from './app-store.actions';
import { StoreStateI, StoreUserIN, TrustedPersonIN } from '@shared/interfaces';

const initialState: StoreStateI = {
  auth: {
    token: '',
    error: ''
  },
  user: {
    userId: '',
    keyId: '',
    username: '',
    email: '',
    outgoingReq: [],
    incomingReq: [],
    trustedPeople: [],
    videos: []
  }
};

const appReducer = createReducer(
  initialState,
  on(registerSuccess, (state, action) => ({
    ...state,
    auth: {
      ...state.auth,
      token: action.token,
      error: null
    }
  })),
  on(registerFailure, (state, action) => ({
    ...state,
    auth: {
      ...state.auth,
      token: null,
      error: action.error
    }
  })),

  on(authSuccess, (state, { token }) => ({
    ...state,
    auth: { ...state.auth, token }
  })),
  on(authFailure, (state, { err }) => ({
    ...state,
    auth: { ...state.auth, token: null, err }
  })),

  on(logout, state => ({
    ...state,
    auth: {
      ...state.auth,
      token: null,
      error: null
    },
    user: {
      ...state.user,
      userId: null,
      username: null,
      email: null,
      image: null,
      keyId: null,
      outgoingReq: null,
      incomingReq: null,
      videos: null
    }
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
        keyId: data.keyId,
        username: data.username,
        email: data.email,
        image: data?.image,
        outgoingReq: data?.outgoingReq,
        incomingReq: data?.incomingReq,
        trustedPeople: data?.trustedPeople,
        videos: data?.videos
      }
    };
  }),

  on(getUserDataFailure, state => ({
    ...state,
    auth: {
      ...state.auth,
      token: null,
      error: null
    },
    user: {
      ...state.user,
      userId: null,
      keyId: null,
      outgoingReq: null,
      incomingReq: null,
      trustedPeople: null
    }
  })),

  on(getTrustedUsersByKeyIdsSuccess, (state, { data }) => {
    return {
      ...state,
      auth: {
        ...state.auth,
        error: ''
      },
      user: {
        ...state.user,
        trustedPeople:
          state.user.trustedPeople?.map((person: TrustedPersonIN) => {
            const enrichedData = data.find(d => d.keyId === person.keyId);
            return enrichedData ? { ...person, ...enrichedData } : person;
          }) || []
      }
    };
  }),

  on(saveImage, (state, { image }) => ({
    ...state,
    user: {
      ...state.user,
      image
    }
  }))
);

export function reducer(state: StoreStateI | undefined, action: Action) {
  return appReducer(state, action);
}
