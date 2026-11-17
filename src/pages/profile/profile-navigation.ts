import { LangTextI } from '@shared/interfaces';
import { billingNavLabel } from './billing/billing-nav-label';

interface ProfileNavItem {
  id: string;
  route: string;
  icon: string;
  label: LangTextI;
  exact?: boolean;
}

export const PROFILE_NAVIGATION = {
  profile: {
    id: 'profile',
    route: '/profile',
    icon: 'profile',
    exact: true,
    label: { ENG: 'Profile', RUS: 'Профиль', ESP: 'Perfil', EST: 'Profiil', ARM: 'Պրոֆիլ' }
  },
  admin: {
    id: 'admin',
    route: '/admin',
    icon: 'admin',
    label: {
      ENG: 'Admin center',
      RUS: 'Админ-панель',
      ESP: 'Panel de administración',
      EST: 'Halduskeskus',
      ARM: 'Կառավարման կենտրոն'
    }
  },
  vault: {
    id: 'vault',
    route: '/profile/vault',
    icon: 'vault',
    label: { ENG: 'Vault', RUS: 'Хранилище', ESP: 'Almacenamiento', EST: 'Hoidla', ARM: 'Պահոց' }
  },
  capture: {
    id: 'capture',
    route: '/capture',
    icon: 'recorder',
    label: { ENG: 'Video recorder', RUS: 'Видеорегистратор', ESP: 'Grabadora de vídeo', EST: 'Videosalvesti', ARM: 'Տեսաձայնագրիչ' }
  },
  billing: { id: 'billing', route: '/profile/billing', icon: 'billing', label: billingNavLabel },
  trustedPeople: {
    id: 'trusted-people',
    route: '/profile/trusted-people',
    icon: 'trusted',
    label: { ENG: 'Trusted people', RUS: 'Доверенные люди', ESP: 'Personas de confianza', EST: 'Usaldusisikud', ARM: 'Վստահելի մարդիկ' }
  },
  notifications: {
    id: 'notification-settings',
    route: '/profile/notification-settings',
    icon: 'notifications',
    label: {
      ENG: 'Notification settings',
      RUS: 'Настройки оповещений',
      ESP: 'Ajustes de notificaciones',
      EST: 'Teavituste seaded',
      ARM: 'Ծանուցումների կարգավորումներ'
    }
  },
  settings: {
    id: 'account-settings',
    route: '/profile/account-settings',
    icon: 'settings',
    label: {
      ENG: 'Account settings',
      RUS: 'Настройки аккаунта',
      ESP: 'Ajustes de la cuenta',
      EST: 'Konto seaded',
      ARM: 'Հաշվի կարգավորումներ'
    }
  }
} satisfies Record<string, ProfileNavItem>;
