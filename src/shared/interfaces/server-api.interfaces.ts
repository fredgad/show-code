export interface TokenI {
  token: string;
}

export interface ErrorList {
  errorList: ResponseErrorListItemProps[];
}

export interface UserDataI {
  username: string;
  email: string;
  password: string;
  image: string;
  tarif: string;
  _id: string;
}

export interface RegisterI extends Pick<UserDataI, 'username' | 'email' | 'password'> {};

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
