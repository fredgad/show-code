import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { APP_API_URL } from '@shared/constants';
import { LocalStorageService } from '@shared/services';
import { Observable, defer, map, of, switchMap, throwError } from 'rxjs';
import { decodeGeoSnapshot } from './vault-geo';

export interface VaultPlaybackItem {
  readonly captureOrigin?: { deviceId?: string | null; cameraRecordingId?: string | null } | null;
  readonly cameraRecordingId?: string | null;
  readonly createdAt?: string | null;
  readonly customTitle?: string | null;
  readonly duration?: number;
  readonly evidenceId?: string | null;
  readonly evidenceStatus?: string | null;
  readonly location?: unknown;
  readonly playbackRequiresSession?: boolean;
  readonly thumbnailUrl?: string | null;
  readonly url?: string | null;
}

interface SaveFileWindow extends Window {
  showSaveFilePicker?(options: { suggestedName: string }): Promise<FileSystemFileHandle>;
}

@Injectable({ providedIn: 'root' })
export class VaultMediaService {
  private readonly document = inject(DOCUMENT);
  private readonly http = inject(HttpClient);
  private readonly storage = inject(LocalStorageService);

  playbackUrl(item: VaultPlaybackItem): Observable<string> {
    if (item.playbackRequiresSession) {
      const device = item.captureOrigin?.deviceId;
      const recording = item.cameraRecordingId ?? item.captureOrigin?.cameraRecordingId;
      if (!device || !recording) return throwError(() => new Error('Camera recording is unavailable'));
      const path = `/api/cameras/${encodeURIComponent(device)}/recordings/${encodeURIComponent(recording)}/view-sessions`;
      return this.http.post<{ view: { sourceUrl: string } }>(`${APP_API_URL}${path}`, {}).pipe(
        map(({ view }) => {
          const source = this.mediaUrl(view?.sourceUrl);
          if (!source || !this.isApiOrigin(source) || source.search ||
              !/^\/api\/cameras\/view\/[A-Za-z0-9_-]{30,100}\/recording\.mp4$/.test(source.pathname)) {
            throw new Error('Invalid camera playback URL');
          }
          return source.href;
        })
      );
    }

    const source = this.mediaUrl(item.url);
    return source ? of(source.href) : throwError(() => new Error('Recording is unavailable'));
  }

  posterUrl(item: VaultPlaybackItem): Observable<string | null> {
    return of(item.playbackRequiresSession ? null : this.mediaUrl(item.thumbnailUrl)?.href ?? null);
  }

  geoTrack(source: string) {
    const url = this.mediaUrl(source);
    if (!url || !/^\/(?:api\/)?media\/v1\/[A-Za-z0-9_-]+\.mp4$/.test(url.pathname)) return of(null);
    url.pathname = url.pathname.replace(/\.mp4$/, '/geo');
    url.search = '';
    return this.request(async signal => {
      const response = await this.fetchMedia(url.href, signal);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Location request failed');
      const data = await response.json();
      return decodeGeoSnapshot(data);
    });
  }

  downloadVideo(item: VaultPlaybackItem): Observable<void> {
    const name = this.fileName(item, 'mp4');
    return defer(() => this.chooseFile(name)).pipe(
      switchMap(file => this.playbackUrl(item).pipe(
        switchMap(url => {
          const direct = file || item.playbackRequiresSession ? null : this.nativeDownloadUrl(url);
          if (!direct) return this.saveFile(url, name, file);
          this.startDownload(direct, name);
          return of(undefined);
        })
      ))
    );
  }

  downloadEvidence(item: VaultPlaybackItem): Observable<void> {
    const id = item.evidenceId;
    const token = this.storage.getItem('token');
    if (!id || item.evidenceStatus !== 'sealed' || !token) {
      return throwError(() => new Error('Evidence package is unavailable'));
    }
    const packageUrl = this.mediaUrl(`${APP_API_URL}/api/evidence/${encodeURIComponent(id)}/package`);
    if (!packageUrl || !this.isApiOrigin(packageUrl)) {
      return throwError(() => new Error('Invalid evidence package URL'));
    }
    const name = this.fileName(item, 'estream');
    return defer(() => this.chooseFile(name)).pipe(
      switchMap(file => this.saveFile(packageUrl.href, name, file, token))
    );
  }

  private mediaUrl(value: string | undefined | null): URL | null {
    if (!value || !(/^(?:https?:\/\/|\/[^/\\])/i).test(value)) return null;
    try {
      const url = new URL(value, this.document.baseURI);
      if (url.username || url.password || !['http:', 'https:'].includes(url.protocol)) return null;
      url.hash = '';
      return url;
    } catch {
      return null;
    }
  }

  private isApiOrigin(url: URL): boolean {
    const apiOrigin = new URL(APP_API_URL || '/', this.document.baseURI).origin;
    return url.origin === apiOrigin || url.origin === 'https://api.e-stream.app';
  }

  private nativeDownloadUrl(source: string): string | null {
    const url = new URL(source);
    const site = this.document.location.origin;
    if (url.origin === site) return url.href;
    if (site !== 'https://e-stream.app' || url.origin !== 'https://api.e-stream.app' || url.search) return null;

    const managedRecording = /^\/(?:api\/)?media\/v1\/[A-Za-z0-9_-]+\.mp4$/.test(url.pathname);
    const legacyRecording = /^\/uploads\/[^/]+\.mp4$/i.test(url.pathname);
    if (!managedRecording && !legacyRecording) return null;
    return new URL(url.pathname.replace(/^\/api(?=\/media\/)/, ''), site).href;
  }

  private fetchMedia(url: string, signal: AbortSignal, token?: string): Promise<Response> {
    return fetch(url, {
      signal,
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {})
    });
  }

  private async chooseFile(name: string): Promise<FileSystemFileHandle | null> {
    const window = this.document.defaultView as SaveFileWindow | null;
    try {
      return await window?.showSaveFilePicker?.({ suggestedName: name }) ?? null;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'SecurityError') return null;
      throw error;
    }
  }

  private saveFile(url: string, name: string, file: FileSystemFileHandle | null, token?: string): Observable<void> {
    return this.request(async signal => {
      const response = await this.fetchMedia(url, signal, token);
      if (!response.ok) throw new Error('Download failed');
      if (file && response.body) {
        const writable = await file.createWritable();
        await response.body.pipeTo(writable, { signal });
        return;
      }
      const blobUrl = URL.createObjectURL(await response.blob());
      if (!signal.aborted) this.startDownload(blobUrl, name);
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
    });
  }

  private startDownload(url: string, name: string): void {
    const link = this.document.createElement('a');
    link.href = url;
    link.download = name;
    link.rel = 'noreferrer';
    this.document.body.appendChild(link);
    link.click();
    link.remove();
  }

  private request<T>(operation: (signal: AbortSignal) => Promise<T>): Observable<T> {
    return new Observable(subscriber => {
      const controller = new AbortController();
      void operation(controller.signal).then(value => {
        subscriber.next(value);
        subscriber.complete();
      }, error => subscriber.error(error));
      return () => controller.abort();
    });
  }

  private fileName(item: VaultPlaybackItem, extension: string): string {
    const date = item.createdAt ? new Date(item.createdAt) : new Date();
    const stamp = (Number.isFinite(date.getTime()) ? date : new Date()).toISOString()
      .slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
    const shortId = item.evidenceId?.replace(/[^a-zA-Z0-9]/g, '').slice(-8);
    return `e-video-${stamp}Z${shortId ? `-${shortId}` : ''}.${extension}`;
  }
}
