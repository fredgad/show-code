import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { APP_API_URL } from '@shared/constants';
import { map } from 'rxjs';
import { VaultFolder, VaultFragmentInput, VaultItem, VaultQuota } from './vault.models';

@Injectable({ providedIn: 'root' })
export class VaultApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${APP_API_URL}/api/vault`;

  items(filter: 'all' | 'recordings' | 'saved' = 'all') {
    return this.http.get<{ items: VaultItem[]; quota: VaultQuota }>(`${this.base}/items`, { params: { filter } });
  }

  folders() {
    return this.http.get<{ folders: VaultFolder[] }>(`${this.base}/folders`).pipe(map(result => result.folders));
  }

  createFolder(name: string) {
    return this.http.post<{ folder: VaultFolder }>(`${this.base}/folders`, { name }).pipe(map(result => result.folder));
  }

  renameFolder(folderId: string, name: string) {
    return this.http.patch<{ folder: VaultFolder }>(`${this.base}/folders/${encodeURIComponent(folderId)}`, { name })
      .pipe(map(result => result.folder));
  }

  deleteFolder(folderId: string) {
    return this.http.delete(`${this.base}/folders/${encodeURIComponent(folderId)}`);
  }

  saveRecording(recordingId: string) {
    return this.http.post<{ created: boolean; entryId: string }>(`${this.base}/recordings/${encodeURIComponent(recordingId)}/save`, {});
  }

  saveTrustedRecording(mediaAssetId: string) {
    return this.http.post<{ created: boolean; entryId: string }>(`${this.base}/trusted/${encodeURIComponent(mediaAssetId)}/save`, {});
  }

  moveEntry(entryId: string, folderId: string | null) {
    return this.http.patch(`${this.entry(entryId)}/folder`, { folderId });
  }

  renameEntry(entryId: string, title: string | null) {
    return this.http.patch(`${this.entry(entryId)}/title`, { title });
  }

  deleteEntry(entryId: string, cancelScheduledDelivery = false) {
    return this.http.delete<{ remainsInMyRecordings?: boolean }>(this.entry(entryId), {
      body: cancelScheduledDelivery ? { cancelScheduledDelivery: true } : {}
    });
  }

  deleteRecording(item: VaultItem, password?: string) {
    return this.http.post<{ scheduledForDeletionAt?: string }>(`${APP_API_URL}/api/video/delete`, {
      ...this.recordingReference(item), createdAt: item.recordedAt || item.createdAt, password
    });
  }

  cancelRecordingDeletion(item: VaultItem) {
    return this.http.post(`${APP_API_URL}/api/video/cancel-delete`, this.recordingReference(item));
  }

  createFragment(entryId: string, input: VaultFragmentInput) {
    return this.http.post<{ entryId: string; status: string }>(`${this.entry(entryId)}/fragments`, input);
  }

  createQrWatermark(entryId: string, allowDuplicate = false) {
    return this.http.post<{ entryId: string; status: string }>(`${this.entry(entryId)}/qr-watermarks`, { allowDuplicate });
  }

  private entry(entryId: string): string {
    return `${this.base}/entries/${encodeURIComponent(entryId)}`;
  }

  private recordingReference(item: VaultItem) {
    return item.url ? { url: item.url } : { recordingId: item.recordingId };
  }
}
