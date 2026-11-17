import { Action, createReducer, on } from '@ngrx/store';
import {
  authSuccess,
  authFailure,
  registerSuccess,
  registerFailure,
  logout,
  getUserData,
  getUserDataFailure,
  getUserDataSuccess,
  getTrustedUsersByKeyIdsSuccess,
  endStreamSuccess,
  startStreamFailure,
  startStreamSuccess,
  endStreamFailure,
  loadNotifications,
  loadNotificationsSuccess,
  loadNotificationsFailure
} from './app-store.actions';
import { StoreStateI, TrustedPersonIN } from '@shared/interfaces';

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
  },
  userLoadStatus: 'idle',
  stream: {
    currentStreamId: null,
    streaming: false,
    error: null
  },
  notifications: {
    notificationsList: [],
    loading: false,
    error: null
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

  on(logout, (state): StoreStateI => ({
    ...state,
    userLoadStatus: 'idle',
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
      deletionPasswordRequired: null,
      videoDeletionDelayMinutes: null,
      preferences: null,
      outgoingReq: null,
      incomingReq: null,
      trustedOrganizations: null,
      incomingOrganizationTrustRequests: null,
      organizationTrustRequests: null,
      videos: null
    }
  })),

  on(getUserData, (state): StoreStateI => ({ ...state, userLoadStatus: 'loading' })),

  on(getUserDataSuccess, (state, { data }): StoreStateI => {
    return {
      ...state,
      userLoadStatus: 'ready',
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
        deletionPasswordRequired: data.deletionPasswordRequired,
        videoDeletionDelayMinutes: data.videoDeletionDelayMinutes,
        preferences: data.preferences,
        outgoingReq: data?.outgoingReq,
        incomingReq: data?.incomingReq,
        trustedOrganizations: data.trustedOrganizations,
        incomingOrganizationTrustRequests: data.incomingOrganizationTrustRequests,
        organizationTrustRequests: data.organizationTrustRequests,
        trustedPeople: data?.trustedPeople,
        videos: data?.videos
      }
    };
  }),

  on(getUserDataFailure, (state): StoreStateI => ({
    ...state,
    userLoadStatus: 'error',
    auth: {
      ...state.auth,
      error: 'Failed to load user data'
    }
  })),

  on(getTrustedUsersByKeyIdsSuccess, (state, { data }) => {
    const trustedPeople = state.user.trustedPeople || [];
    const existingKeyIds = new Set(trustedPeople.map(person => person?.keyId).filter(Boolean));
    const enrichedTrustedPeople = trustedPeople.map((person: TrustedPersonIN) => {
      const enrichedData = data.find(d => d.keyId === person.keyId);
      return enrichedData ? { ...person, ...enrichedData } : person;
    });
    const newTrustedPeople: TrustedPersonIN[] = data
      .filter(person => person?.keyId && !existingKeyIds.has(person.keyId))
      .map(person => ({
        displayed: false,
        ...person
      }));

    return {
      ...state,
      auth: {
        ...state.auth,
        error: ''
      },
      user: {
        ...state.user,
        trustedPeople: [...enrichedTrustedPeople, ...newTrustedPeople]
      }
    };
  }),

  on(startStreamSuccess, (state, { streamId }) => ({
    ...state,
    stream: {
      currentStreamId: streamId,
      streaming: true,
      error: null
    }
  })),
  on(startStreamFailure, (state, { error }) => ({
    ...state,
    stream: {
      currentStreamId: null,
      streaming: false,
      error
    }
  })),
  on(endStreamSuccess, state => ({
    ...state,
    stream: {
      currentStreamId: null,
      streaming: false,
      error: null
    }
  })),
  on(endStreamFailure, (state, { error }) => ({
    ...state,
    stream: {
      ...state.stream,
      error
    }
  })),

  on(loadNotifications, state => ({
    ...state,
    notifications: {
      ...state.notifications,
      loading: true
    }
  })),
  on(loadNotificationsSuccess, (state, { notifications }) => ({
    ...state,
    notifications: {
      ...state.notifications,
      notificationsList: notifications,
      loading: false
    }
  })),
  on(loadNotificationsFailure, (state, { error }) => ({
    ...state,
    notifications: {
      ...state.notifications,
      error,
      loading: false
    }
  }))
);

export function reducer(state: StoreStateI | undefined, action: Action) {
  return appReducer(state, action);
}
