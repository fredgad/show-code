import { LangTextI } from '@shared/interfaces';
import { PROFILE_NAVIGATION } from '../../../pages/profile/profile-navigation';

const label = (ENG: string, RUS: string, ESP: string, EST: string, ARM: string): LangTextI => ({ ENG, RUS, ESP, EST, ARM });

export const HEADER_TEXT = {
  menu: label('Menu', 'Меню', 'Menú', 'Menüü', 'Ընտրացանկ'),
  navigation: label('Main navigation', 'Основная навигация', 'Navegación principal', 'Põhinavigeerimine', 'Հիմնական ընտրացանկ'),
  how: label('How it works', 'Как это работает', 'Cómo funciona', 'Kuidas see töötab', 'Ինչպես է աշխատում'),
  presentation: label('Presentation', 'Презентация', 'Presentación', 'Esitlus', 'Ներկայացում'),
  verifyRecording: label('Verify a recording', 'Проверить запись', 'Verificar una grabación', 'Kontrolli salvestist', 'Ստուգել տեսագրությունը'),
  signIn: label('Sign in', 'Войти', 'Iniciar sesión', 'Logi sisse', 'Մուտք գործել'),
  account: label('My profile', 'Мой профиль', 'Mi perfil', 'Minu profiil', 'Իմ պրոֆիլը'),
  fontSize: label('Text size', 'Размер текста', 'Tamaño del texto', 'Teksti suurus', 'Տեքստի չափը'),
  decreaseFont: label('Decrease text size', 'Уменьшить текст', 'Reducir el tamaño del texto', 'Vähenda teksti', 'Փոքրացնել տեքստը'),
  increaseFont: label('Increase text size', 'Увеличить текст', 'Aumentar el tamaño del texto', 'Suurenda teksti', 'Մեծացնել տեքստը')
};

export const HEADER_PAGE_TITLES: Record<string, LangTextI> = {
  auth: label('Authorization', 'Авторизация', 'Autorización', 'Sisselogimine', 'Մուտք'),
  registration: label('Registration', 'Регистрация', 'Registro', 'Registreerimine', 'Գրանցում'),
  'password-recovery': label('Password recovery', 'Восстановление пароля', 'Recuperación de contraseña', 'Parooli taastamine', 'Գաղտնաբառի վերականգնում'),
  'trusted-profile': label('Trusted profile', 'Доверенный профиль', 'Perfil de confianza', 'Usaldusprofiil', 'Վստահելի պրոֆիլ'),
  settings: label('Application settings', 'Настройки приложения', 'Ajustes de la aplicación', 'Rakenduse seaded', 'Հավելվածի կարգավորումներ'),
  capture: PROFILE_NAVIGATION.capture.label
};
