import { LangTextI } from '@shared/interfaces';

export const PROFILE_TEXT = {
  sections: {
    ENG: 'Profile navigation',
    RUS: 'Разделы профиля',
    ESP: 'Secciones del perfil',
    EST: 'Profiili jaotised',
    ARM: 'Պրոֆիլի բաժիններ'
  },
  media: { ENG: 'Recordings', RUS: 'Записи', ESP: 'Grabaciones', EST: 'Salvestised', ARM: 'Տեսագրություններ' },
  account: { ENG: 'Account', RUS: 'Аккаунт', ESP: 'Cuenta', EST: 'Konto', ARM: 'Հաշիվ' },
  home: {
    ENG: 'E-stream home',
    RUS: 'Главная E-stream',
    ESP: 'Inicio de E-stream',
    EST: 'E-streami avaleht',
    ARM: 'E-stream-ի գլխավոր էջ'
  },
  verify: { ENG: 'Verification', RUS: 'Верификация', ESP: 'Verificación', EST: 'Kontrollimine', ARM: 'Ստուգում' },
  language: { ENG: 'Site language', RUS: 'Язык сайта', ESP: 'Idioma del sitio', EST: 'Veebilehe keel', ARM: 'Կայքի լեզուն' },
  signOut: { ENG: 'Sign out', RUS: 'Выйти', ESP: 'Cerrar sesión', EST: 'Logi välja', ARM: 'Դուրս գալ' },
  support: { ENG: 'Support', RUS: 'Поддержка', ESP: 'Soporte', EST: 'Kasutajatugi', ARM: 'Աջակցություն' },
  loading: {
    ENG: 'Loading profile…',
    RUS: 'Загружаем профиль…',
    ESP: 'Cargando el perfil…',
    EST: 'Profiil laadib…',
    ARM: 'Պրոֆիլը բեռնվում է…'
  },
  loadError: {
    ENG: 'The profile could not load.',
    RUS: 'Не удалось загрузить профиль.',
    ESP: 'No se pudo cargar el perfil.',
    EST: 'Profiili ei õnnestunud laadida.',
    ARM: 'Չհաջողվեց բեռնել պրոֆիլը։'
  },
  retry: { ENG: 'Try again', RUS: 'Повторить', ESP: 'Reintentar', EST: 'Proovi uuesti', ARM: 'Կրկին փորձել' },
  copy: { ENG: 'Copy Key ID', RUS: 'Скопировать Key ID', ESP: 'Copiar Key ID', EST: 'Kopeeri Key ID', ARM: 'Պատճենել Key ID-ն' },
  copied: { ENG: 'Key ID copied', RUS: 'Key ID скопирован', ESP: 'Key ID copiado', EST: 'Key ID kopeeritud', ARM: 'Key ID-ն պատճենվել է' },
  copyError: {
    ENG: 'Could not copy Key ID',
    RUS: 'Не удалось скопировать Key ID',
    ESP: 'No se pudo copiar el Key ID',
    EST: 'Key ID-d ei õnnestunud kopeerida',
    ARM: 'Չհաջողվեց պատճենել Key ID-ն'
  },
  vaultSummary: {
    ENG: 'Folders and recordings from E-stream on your phone.',
    RUS: 'Папки и записи из приложения E-stream.',
    ESP: 'Carpetas y grabaciones de E-stream en tu teléfono.',
    EST: 'Kaustad ja salvestised telefoni E-streami rakendusest.',
    ARM: 'Պանակներ և տեսագրություններ E-stream հավելվածից։'
  },
  billingSummary: {
    ENG: 'Your plan, subscriptions and payment history.',
    RUS: 'Ваш тариф, подписки и история платежей.',
    ESP: 'Tu plan, tus suscripciones y el historial de pagos.',
    EST: 'Sinu pakett, tellimused ja maksete ajalugu.',
    ARM: 'Ձեր փաթեթը, բաժանորդագրություններն ու վճարումների պատմությունը։'
  }
} satisfies Record<string, LangTextI>;
