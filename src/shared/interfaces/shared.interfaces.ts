export enum LangEnum {
  ENG = 'ENG',
  RUS = 'RUS',
  ESP = 'ESP',
  EST = 'EST',
  ARM = 'ARM'
}

export interface LangTextI {
  [LangEnum.ENG]: string;
  [LangEnum.RUS]: string;
  [LangEnum.ESP]: string;
  [LangEnum.EST]?: string;
  [LangEnum.ARM]?: string;
}
