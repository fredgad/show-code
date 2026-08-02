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
  stream: StoreStreamI;
  notifications: StoreNotificationsI;
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

  videos?: VideoDataI[];
}
export type StoreUserIN = Nullable<StoreUserI>;

export interface TrustedPersonI {
  keyId: string;
  displayed: boolean;
  username?: string;
  email?: string;
  image?: string;
  videos?: VideoDataI[];
}
export type TrustedPersonIN = Nullable<TrustedPersonI>;

export interface StoreAuthI {
  token: string | null;
  error: string | null;
}

export interface StoreStreamI {
  currentStreamId: string | null;
  streaming: boolean;
  error?: string | null;
}

export interface StoreNotificationsI {
  notificationsList: StoreNotificationsListI[];
  loading: boolean;
  error: string | null;
}

export interface StoreNotificationsListI {
  type: string;
  text: string;
  streamId: string;
  fromUser: string;
  createdAt: string;
  isRead: boolean;
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

export interface VideoDataI {
  url: string;
  createdAt: string;
  evidenceId?: string;
}

export type EvidenceVerificationStatus =
  | 'valid'
  | 'pending'
  | 'unknown'
  | 'tampered'
  | 'invalid_signature'
  | 'failed';

export interface EvidenceLocationI {
  lat: number | null;
  lng: number | null;
  accuracy?: number | null;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  capturedAt?: string | null;
  receivedAt?: string | null;
  provider?: string | null;
  source?: string | null;
}

export interface EvidenceDerivationI {
  type: 'trim';
  sourceEvidenceId: string;
  rootEvidenceId: string;
  sourceStartMs: number;
  sourceEndMs: number;
  rootStartMs: number;
  rootEndMs: number;
  rootDurationMs?: number;
  transformedAt: string | null;
  tool: string | null;
  profileVersion: string | null;
}

export interface EvidenceOriginalAuthorI {
  confirmed: boolean;
  disclosed: boolean;
  displayName: string | null;
}

export interface EvidenceRecordI {
  evidenceId: string;
  schemaVersion: number;
  status: 'pending' | 'sealed' | 'failed';
  mimeType: string | null;
  fileSize: number;
  durationSec: number;
  hashAlgorithm: string | null;
  fileHashHex: string | null;
  recordedAtStart: string | null;
  recordedAtEnd: string | null;
  sealedAt: string | null;
  location: EvidenceLocationI | null;
  derivation?: EvidenceDerivationI | null;
  originalAuthor?: EvidenceOriginalAuthorI | null;
  issuer: string | null;
  signing: {
    keyId: string | null;
    algorithm: string | null;
    signatureValid: boolean | null;
  };
}

export interface EvidenceVerifyRequestI {
  evidenceId?: string;
  fileHashHex: string;
  fileSize?: number;
  fileName?: string;
  packageManifest?: Record<string, unknown>;
  packageType?: 'mp4' | 'estream_zip';
}

export interface EvidenceVerifyResponseI {
  ok: boolean;
  status: EvidenceVerificationStatus;
  reason: string | null;
  matchedBy: 'evidenceId' | 'hash' | 'filename' | null;
  evidence: EvidenceRecordI | null;
}

export interface StreamI {
  streamId: string;
  streamKey?: string;
  publish?: {
    rtmp?: string;
  };
  playbackUrl?: string | null;
  playbackProxyUrl?: string | null;
  shareId?: string | null;
  shareUrl?: string | null;
  quality?: string | null;
  limits?: Record<string, unknown> | null;
  plan?: {
    code?: string;
    limitPeriod?: string;
  } | null;
}

export interface StreamChunkI {
  streamId: string;
  chunkNumber: number;
  file: File;
}
