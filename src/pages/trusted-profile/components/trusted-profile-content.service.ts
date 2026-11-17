import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { APP_API_URL } from '@shared/constants';
import { TrustedUserPreview, VideoDataI } from '@shared/interfaces';
import { map } from 'rxjs';
import { VaultItem } from '../../profile/vault/vault.models';

export interface TrustedRecording extends VideoDataI {
  _id?: string;
  id?: string;
  playbackId?: string | null;
  downloadAvailable?: boolean;
  evidenceProcessingDeadlineAt?: string | null;
  evidenceFailureReason?: string | null;
  evidenceSealedAt?: string | null;
  captureRecovery?: { status?: string; completeness?: string } | null;
  duration?: number;
  thumbnailUrl?: string | null;
  location?: VaultItem['location'];
}

export interface TrustedPersonDetail extends TrustedUserPreview {
  _id?: string;
  id?: string;
  videos?: TrustedRecording[] | null;
}

export interface RecordingMessage {
  deliveryId: string;
  evidenceId?: string;
  mediaUrl: string | null;
  mediaAssetId?: string | null;
  playbackId?: string | null;
  thumbnailUrl?: string | null;
  title?: string | null;
  duration?: number;
  recordedAt?: string | null;
  sentAt: string;
  location?: VaultItem['location'];
  available: boolean;
  isRead: boolean;
  captureRecovery?: TrustedRecording['captureRecovery'];
}

export interface TrustedLiveStream {
  streamId: string;
  streamSessionId?: string;
  fromUser?: { keyId?: string };
  fromUserKeyId?: string;
  startedAt: string;
  endedAt?: string | null;
  status?: string;
  title?: string;
  shareId?: string | null;
  playbackId?: string | null;
  location?: unknown;
}

@Injectable({ providedIn: 'root' })
export class TrustedProfileContentService {
  private readonly http = inject(HttpClient);
  private readonly deliveries = `${APP_API_URL}/api/recording-deliveries/messages`;

  messages(senderId: string) {
    return this.http.get<{ messages: RecordingMessage[] }>(`${this.deliveries}/${encodeURIComponent(senderId)}`)
      .pipe(map(({ messages }) => messages));
  }

  markRead(deliveryId: string) {
    return this.http.patch<void>(`${this.deliveries}/${encodeURIComponent(deliveryId)}/read`, null);
  }

  liveStream(keyId: string) {
    return this.http.get<TrustedLiveStream[]>(`${APP_API_URL}/api/stream/active`).pipe(
      map(streams => streams.find(stream =>
        (stream.fromUser?.keyId ?? stream.fromUserKeyId) === keyId &&
        !stream.endedAt && (stream.status == null || stream.status === 'live') &&
        liveWatchId(stream) !== null
      ) ?? null)
    );
  }
}

export function liveWatchId(stream: TrustedLiveStream): string | null {
  const id = stream.shareId ?? stream.playbackId;
  return id && /^[a-zA-Z0-9_-]+$/.test(id) ? id : null;
}

export interface PersonRecord {
  id: string;
  item: VaultItem;
  message?: RecordingMessage;
}

export function recordFromVideo(video: TrustedRecording): PersonRecord {
  return {
    id: video._id ?? video.id ?? video.playbackId ?? video.url,
    item: { ...video, itemType: 'saved', sourceType: 'trusted_recording' },
  };
}

export function recordFromMessage(message: RecordingMessage): PersonRecord {
  return {
    id: message.deliveryId,
    message,
    item: {
      itemType: 'saved',
      sourceType: 'trusted_message',
      customTitle: message.title,
      createdAt: message.recordedAt ?? message.sentAt,
      evidenceId: message.evidenceId,
      evidenceStatus: 'sealed',
      url: message.available ? message.mediaUrl : null,
      downloadAvailable: message.available,
      thumbnailUrl: message.available ? message.thumbnailUrl : null,
      duration: message.duration,
      location: message.available ? message.location : null,
      mediaAssetId: message.available ? message.mediaAssetId : null,
      playbackId: message.available ? message.playbackId : null,
      captureRecovery: message.captureRecovery,
    },
  };
}
