export interface VaultQuota {
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
}

export interface VaultFolder {
  folderId: string;
  name: string;
}

export type VaultFolderLayout = 'grid' | 'list';

export interface VaultItem {
  itemType: 'recording' | 'saved';
  recordingId?: string | null;
  vaultEntryId?: string | null;
  sourceType: string;
  originType?: string | null;
  derivationType?: string | null;
  url?: string | null;
  thumbnailUrl?: string | null;
  mediaAssetId?: string | null;
  sourceMediaAssetId?: string | null;
  playbackId?: string | null;
  evidenceId?: string | null;
  evidenceStatus?: string | null;
  evidenceFailureReason?: string | null;
  evidenceSealedAt?: string | null;
  evidenceProcessingDeadlineAt?: string | null;
  downloadAvailable?: boolean;
  isSaved?: boolean;
  playbackRequiresSession?: boolean;
  cameraRecordingId?: string | null;
  recordingPurpose?: string | null;
  captureOrigin?: { kind?: string; deviceId?: string | null; cameraRecordingId?: string | null } | null;
  captureRecovery?: { recordingChainId?: string | null; completeness?: string | null; updateBlocked?: string | null } | null;
  location?: { latitude?: number; longitude?: number; accuracy?: number; lat?: number; lng?: number } | null;
  createdAt?: string | null;
  recordedAt?: string | null;
  originalRecordedAt?: string | null;
  savedAt?: string | null;
  scheduledForDeletionAt?: string | null;
  autoDeleteAt?: string | null;
  duration?: number;
  fileSize?: number | null;
  folderId?: string | null;
  customTitle?: string | null;
  processingStatus?: string | null;
  processingPhase?: string | null;
  fragment?: {
    sourceStartMs: number;
    sourceEndMs: number;
    rootStartMs?: number;
    rootEndMs?: number;
    rootDurationMs?: number;
    transformedAt?: string;
  } | null;
  qrWatermark?: { transformedAt?: string; payload?: string | null } | null;
}

export interface VaultFragmentInput {
  startMs: number;
  endMs: number;
  title?: string;
  expectedEvidenceId?: string;
}

export function isVaultMediaAvailable(item: VaultItem): boolean {
  const ready = item.downloadAvailable !== false ||
    (!!item.evidenceProcessingDeadlineAt && Date.parse(item.evidenceProcessingDeadlineAt) <= Date.now());
  return ready && (item.playbackRequiresSession
    ? !!item.captureOrigin?.deviceId && !!(item.cameraRecordingId || item.captureOrigin?.cameraRecordingId)
    : !!item.url);
}
