import { LangEnum, LangTextI } from '@shared/interfaces';
import mainEn from '../../../assets/lang/en.json';
import mainRu from '../../../assets/lang/ru.json';
import mainEs from '../../../assets/lang/es.json';

type MainSectionValue = string | Record<string, string>;

type MainLangPayload = {
  main: Record<string, MainSectionValue>;
};

const mainEnData = mainEn as MainLangPayload;
const mainRuData = mainRu as MainLangPayload;
const mainEsData = mainEs as MainLangPayload;

const flattenSection = (section: Record<string, MainSectionValue>): Record<string, string> => {
  const result: Record<string, string> = {};

  Object.entries(section).forEach(([key, value]) => {
    if (value && typeof value === 'object') {
      Object.entries(value as Record<string, string>).forEach(([nestedKey, nestedValue]) => {
        result[`${key}.${nestedKey}`] = nestedValue;
      });
    } else {
      result[key] = value as string;
    }
  });

  return result;
};

const buildLangRecord = (
  en: Record<string, string>,
  ru: Record<string, string>,
  es: Record<string, string>
): Record<string, LangTextI> => {
  const keys = new Set([...Object.keys(en), ...Object.keys(ru), ...Object.keys(es)]);
  const result: Record<string, LangTextI> = {};

  keys.forEach(key => {
    result[key] = {
      [LangEnum.ENG]: en[key] ?? '',
      [LangEnum.RUS]: ru[key] ?? '',
      [LangEnum.ESP]: es[key] ?? '',
    };
  });

  return result;
};

const mainText = buildLangRecord(
  flattenSection(mainEnData.main ?? {}),
  flattenSection(mainRuData.main ?? {}),
  flattenSection(mainEsData.main ?? {})
);

export const INPUT_PLACEHOLDER: LangTextI = mainText['input_placeholder'];
export const LOGO_TITLE: LangTextI = mainText['logo_title'];
export const LOGO_TEXT: LangTextI = mainText['logo_text'];

export const TEXT_MAIN: Record<string, LangTextI> = mainText;
