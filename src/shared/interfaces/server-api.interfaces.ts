import type { TrustPolicy } from './trust-policy.interfaces';
import type { TrustedOrganizationRelationship } from '../../pages/trusted-organization/trusted-organization.api';

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
  userLoadStatus: 'idle' | 'loading' | 'ready' | 'error';
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
  deletionPasswordRequired?: boolean;
  videoDeletionDelayMinutes?: number;
  preferences?: { vaultFolderLayout?: 'grid' | 'list' };

  outgoingReq?: string[];
  incomingReq?: string[];
  trustedPeople?: TrustedPersonIN[];
  trustedOrganizations?: TrustedOrganizationRelationship[];
  incomingOrganizationTrustRequests?: TrustedOrganizationRelationship[];
  organizationTrustRequests?: TrustedOrganizationRelationship[];

  videos?: VideoDataI[];
}
export type StoreUserIN = Nullable<StoreUserI>;
export type TrustedUserPreview = StoreUserIN & { trustPolicy?: TrustPolicy | null };

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
  evidenceStatus?: string | null;
  mediaAssetId?: string | null;
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
  type: 'trim' | 'qr_watermark';
  isFragment: boolean | null;
  rootDurationMs: number | null;
  transformedAt: string | null;
}

export interface CaptureManifestI {
  completeness: 'complete' | 'incomplete' | 'uploading';
  source: 'device_segments' | 'live_recovery';
  gaps: Array<{ kind: string; videoOffsetMs?: number; startedAt?: string | null; endedAt?: string | null }>;
}

export type EvidenceCaptureSource = 'device_segments' | 'live_recovery' | 'camera_gateway' | 'camera_stream' | 'test_source';

export interface EvidenceRecordI {
  captureManifest?: CaptureManifestI | null;
  captureSource?: EvidenceCaptureSource | null;
  androidKeyProof?: {
    version: 1;
    segmentCount: number;
    verifiedSegments: number;
    invalidSegments: number;
    attestedAt: string | null;
  } | null;
  evidenceId: string;
  schemaVersion: number;
  status: 'pending' | 'sealed' | 'failed';
  mimeType: string | null;
  fileSize: number;
  durationSec: number;
  hashAlgorithm: string | null;
  recordedAtStart: string | null;
  recordedAtEnd: string | null;
  sealedAt: string | null;
  location: EvidenceLocationI | null;
  derivation?: EvidenceDerivationI | null;
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
