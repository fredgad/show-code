// import { environment } from "../environments/environment";
import { LangEnum, LangTextI } from "../interfaces";

// export const APP_API_URL = environment.apiUrl;
export const APP_API_URL = 'http://localhost:9000';

export const MOBILE_BREAKPOINT: number = 768;

export const LANGUAGES_LIST: LangEnum[] = [LangEnum.ENG, LangEnum.ESP, LangEnum.RUS];

export const BASE_VIDEO_PATH: string = './assets/video/';

export const LOGOUT_POPUP_TEXT: LangTextI = {
  ENG: 'Are you sure you want to log out?',
  ESP: '¿Está seguro de que desea cerrar sesión?',
  RUS: 'Вы действительно хотите выйти из аккаунта?',
}
