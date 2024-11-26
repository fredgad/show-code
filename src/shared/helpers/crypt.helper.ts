import { LangEnum, LangTextI } from '../interfaces';

export const pass = 910226907345;

export const decryptLangTextByPass = (
  langText: LangTextI,
  password: number
): LangTextI => {
  const decrypted: LangTextI = {
    [LangEnum.ENG]: '',
    [LangEnum.RUS]: '',
    [LangEnum.ESP]: '',
  };

  for (const key in langText) {
    decrypted[key as keyof LangTextI] = langText[key as keyof LangTextI]
      .split('')
      .map((char) => String.fromCharCode(char.charCodeAt(0) ^ password))
      .join('');
  }
  return decrypted;
};

export const encryptLangTextByPass = (
  langText: LangTextI,
  password: number
): LangTextI => {
  const encrypted: LangTextI = {
    [LangEnum.ENG]: '',
    [LangEnum.RUS]: '',
    [LangEnum.ESP]: '',
  };

  for (const key in langText) {
    encrypted[key as keyof LangTextI] = langText[key as keyof LangTextI]
      .split('')
      .map((char) => String.fromCharCode(char.charCodeAt(0) ^ password))
      .join('');
  }
  return encrypted;
};

export const encryptRecordText = (
  text: Record<string, LangTextI>,
  password: number
): Record<string, LangTextI> => {
  const encryptedMain: Record<string, LangTextI> = {};

  for (const category in text) {
    encryptedMain[category] = encryptLangTextByPass(text[category], password);
  }
  return encryptedMain;
};

export const decryptRecordText = (
  text: Record<string, LangTextI>,
  password: number
): Record<string, LangTextI> => {
  const decryptedMain: Record<string, LangTextI> = {};

  for (const category in text) {
    decryptedMain[category] = decryptLangTextByPass(text[category], password);
  }
  return decryptedMain;
};
