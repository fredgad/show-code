
export enum LangEnum {
  ENG = 'ENG',
  RUS = 'RUS',
  ESP = 'ESP',
}

export type TarifType = 'базовый' | 'Премиум';

export interface LangTextI {
  [LangEnum.ENG]: string;
  [LangEnum.RUS]: string;
  [LangEnum.ESP]: string;
}

export interface StoreStateI {
  auth: StoreAuthI;
  user: StoreUserI;
}

export interface StoreUserI {
  userId: string | null;
  userKey: string | null;
  username: string | null;
  email: string | null;
  image?: string | null;
  tarif?: TarifType;
}

export interface StoreAuthI {
  token: string | null;
  error: string | null;
}
