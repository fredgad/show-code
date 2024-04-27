import { createAction, props } from "@ngrx/store";
import { UserDataI } from "@shared/interfaces";

export const register = createAction(
  '[App] Register',
  props<{ username: string; email: string; password: string }>()
);

export const registerSuccess = createAction(
  '[App] Register Success',
  props<{ token: string }>()
);

export const registerFailure = createAction(
  '[App] Register Failure',
  props<{ error: any }>()
);

export const auth = createAction(
  '[App] Auth',
  props<{ login: string; password: string }>()
);

export const authSuccess = createAction(
  '[App] Auth success',
  props<{ token: string }>()
);

export const authFailure = createAction(
  '[App] Auth failure',
  props<{ err: string }>()
);

export const logout = createAction('[App] Logout');

export const getUserData = createAction('[App] Get user data');

export const getUserDataSuccess = createAction(
  '[App] Get user data success',
  props<{ data: UserDataI }>()
);

export const getUserDataFailure = createAction(
  '[App] Get user data failure',
  props<{ error: string }>()
);

export const saveImage = createAction(
  '[App] Save image',
  props<{ image: string }>()
);

export const saveImageSuccess = createAction('[App] Save image success');

export const saveImageFailure = createAction(
  '[App] Save image failure',
  props<{ error: string }>()
);
