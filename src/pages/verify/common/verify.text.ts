import { LangEnum, LangTextI } from '@shared/interfaces';
import mainEn from '../../../assets/lang/en.json';
import mainRu from '../../../assets/lang/ru.json';
import mainEs from '../../../assets/lang/es.json';

type VerifyLangPayload = {
  verify: Record<string, string>;
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

export const TEXT_VERIFY = buildLangRecord(
  ((mainEn as VerifyLangPayload).verify ?? {}),
  ((mainRu as VerifyLangPayload).verify ?? {}),
  ((mainEs as VerifyLangPayload).verify ?? {})
);

export type VerifyTextKey = keyof typeof TEXT_VERIFY;
