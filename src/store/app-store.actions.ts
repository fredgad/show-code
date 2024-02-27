import { createAction, props } from "@ngrx/store";

export const authSuccess = createAction(
  '[App] Auth success',
  props<{ auth: boolean, token: string }>()
);

export const authFailure = createAction(
  '[App] Auth failure',
  props<{ auth: boolean, token: string }>()
);

export const registerNewUser = createAction(
  '[App] Register New User',
  props<{ width: number }>()
);



// export const offGoalOut = createAction('[Pong] Off Goal Out');

