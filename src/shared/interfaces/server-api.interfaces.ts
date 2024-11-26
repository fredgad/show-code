export interface TokenI {
  token: string;
}

export interface ErrorList {
  errorList: ResponseErrorListItemProps[];
}

type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

export interface StoreStateI {
  auth: StoreAuthI;
  user: StoreUserIN;
}

export type TarifType = 'базовый' | 'Премиум';

interface StoreUserI {
  username: string;
  keyId: string;
  email: string;
  password?: string;
  userId?: string;
  image?: string;
  tarif?: TarifType;

  outgoingReq?: string[];
  incomingReq?: string[];
  trustedPeople?: TrustedPersonIN[];

  videos?: VideoSuccessUploadI[];
}
export type StoreUserIN = Nullable<StoreUserI>;

export interface TrustedPersonI {
  keyId: string;
  displayed: boolean;
  username?: string;
  email?: string;
  image?: string;
  videos?: VideoSuccessUploadI[];
}
export type TrustedPersonIN = Nullable<TrustedPersonI>;

export interface StoreAuthI {
  token: string | null;
  error: string | null;
}

// export interface UserDataI {
//   username: string;
//   email: string;
//   password: string;
//   image?: string;
//   tarif?: string;
//   keyId: string;

//   outgoingReq?: string[];
//   incomingReq?: string[];
//   trustedPeople?: TrustedPersonI[] | null;
// }

// interface TrustedPersonI {
//   keyId: string | null;
//   displayed: boolean | null;
//   username?: string | null;
//   email?: string | null;
//   image?: string | null;
// }

// export interface RegisterI extends Pick<StoreUserIN, 'username' | 'email' | 'password'> {}
export interface RegisterI {
  username: string;
  email: string;
  password: string;
}
export interface AuthI {
  login: string;
  password: string;
}

export interface ResponseErrorListItemProps {
  Class: string;
  Data: any[] | any;
  Code: string;
  Message: string;
  Description: string;
  Type: string;
}

export interface VideoSuccessUploadI {
  url: string;
  createdAt: string;
}
