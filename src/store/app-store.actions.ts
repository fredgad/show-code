import { createAction, props } from '@ngrx/store';
import { StoreUserIN, VideoSuccessUploadI } from '@shared/interfaces';

export const register = createAction('[App] Register', props<{ username: string; email: string; password: string }>());
export const registerSuccess = createAction('[App] Register Success', props<{ token: string }>());
export const registerFailure = createAction('[App] Register Failure', props<{ error: any }>());

export const auth = createAction('[App] Auth', props<{ login: string; password: string }>());
export const authSuccess = createAction('[App] Auth success', props<{ token: string }>());
export const authFailure = createAction('[App] Auth failure', props<{ err: string }>());

export const logout = createAction('[App] Logout');

export const getUserData = createAction('[App] Get user data');
export const getUserDataSuccess = createAction('[App] Get user data success', props<{ data: StoreUserIN }>());
export const getUserDataFailure = createAction('[App] Get user data failure', props<{ error: string }>());

export const getTrustedUsersByKeyIds = createAction('[App] Get trusted users by keyIds', props<{ keyIds: string[] }>());
export const getTrustedUsersByKeyIdsSuccess = createAction('[App] Get trusted users by keyIds success', props<{ data: StoreUserIN[] }>());
export const getTrustedUsersByKeyIdsFailure = createAction('[App] Get trusted users by keyIds failure', props<{ error: string }>());

export const saveImage = createAction('[App] Save image', props<{ image: string }>());
export const saveImageSuccess = createAction('[App] Save image success');
export const saveImageFailure = createAction('[App] Save image failure', props<{ error: string }>());

export const addUserByKeyId = createAction('[App] Add user by keyId', props<{ keyId: string }>());
export const addUserByKeyIdSuccess = createAction('[App] Add user by keyId success');
export const addUserByKeyIdFailure = createAction('[App] Add user by keyId failure', props<{ error: string }>());

export const cancelRequest = createAction('[App] Cancel request', props<{ keyId: string }>());
export const cancelRequestSuccess = createAction('[App] Cancel request success');
export const cancelRequestFailure = createAction('[App] Cancel request failure', props<{ error: string }>());

export const acceptTrustedUser = createAction('[App] Accept trusted user', props<{ keyId: string }>());
export const acceptTrustedUserSuccess = createAction('[App] Accept trusted user success');
export const acceptTrustedUserFailure = createAction('[App] Accept trusted user failure', props<{ error: string }>());

export const removeTrustedUser = createAction('[App] Remove trusted user', props<{ keyId: string }>());
export const removeTrustedUserSuccess = createAction('[App] Remove trusted user success');
export const removeTrustedUserFailure = createAction('[App] Remove trusted user failure', props<{ error: string }>());

// Video
export const uploadVideo = createAction('[App] Upload video', props<{ formData: FormData }>());
export const uploadVideoSuccess = createAction('[App] Upload video success', props<{ data: VideoSuccessUploadI }>());
export const uploadVideoFailure = createAction('[App] Upload video failure', props<{ error: string }>());

export const getUserVideos = createAction('[App] Get user videos');
export const getUserVideosSuccess = createAction('[App] Get user videos success', props<{ data: VideoSuccessUploadI }>());
export const getUserVideosFailure = createAction('[App] Get user videos failure', props<{ error: string }>());
