import { LangTextI } from '@shared/interfaces';

export const INPUT_PLACEHOLDER: LangTextI = {
  ENG: 'Enter Email...',
  ESP: 'Ingrese correl...',
  RUS: 'Введите Email...'
};

export const CANCEL_REQ_POPUP_TEXT = (keyId: string): LangTextI => ({
  ENG: 'Are you sure you want to cancel your for ${keyId}?',
  ESP: '¿Está seguro de que desea cerrar sesión ${keyId}?',
  RUS: 'Вы действительно хотите выйти из аккаунта ${keyId}?'
});
