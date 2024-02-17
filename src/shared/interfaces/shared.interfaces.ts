
export enum LangEnum {
  ENG = 'ENG',
  RUS = 'RUS',
  ESP = 'ESP',
}

export interface LangTextI {
  [LangEnum.ENG]: string;
  [LangEnum.RUS]: string;
  [LangEnum.ESP]: string;
}
