import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { VaultApiService } from './vault-api.service';
import { VaultItem } from './vault.models';

describe('VaultApiService', () => {
  let api: VaultApiService;
  let http: HttpTestingController;

  const recording: VaultItem = {
    itemType: 'recording', sourceType: 'own_recording', recordingId: '507f1f77bcf86cd799439011',
    url: '/media/v1/example.mp4', recordedAt: '2026-11-17T05:00:00.000Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    api = TestBed.inject(VaultApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses the existing saved-items filter and trusted import endpoint', () => {
    api.items('saved').subscribe();
    http.expectOne('/api/vault/items?filter=saved').flush({ items: [] });

    api.saveTrustedRecording('source/part').subscribe();
    const request = http.expectOne({ url: '/api/vault/trusted/source%2Fpart/save', method: 'POST' });
    expect(request.request.body).toEqual({});
    request.flush({ created: true, entryId: 'saved-copy' });
  });

  it('keeps the URL contract for existing recordings and supports deletion by ID for private ones', () => {
    api.deleteRecording(recording, 'example').subscribe();
    const legacy = http.expectOne({ url: '/api/video/delete', method: 'POST' });
    expect(legacy.request.body).toEqual({ url: recording.url, createdAt: recording.recordedAt, password: 'example' });
    legacy.flush({});

    api.deleteRecording({ ...recording, url: null, playbackRequiresSession: true }).subscribe();
    const byId = http.expectOne({ url: '/api/video/delete', method: 'POST' });
    expect(byId.request.body.recordingId).toBe(recording.recordingId);
    expect(byId.request.body.url).toBeUndefined();
    byId.flush({});
  });

  it('uses the original recording reference to cancel deletion', () => {
    api.cancelRecordingDeletion(recording).subscribe();
    const legacy = http.expectOne({ url: '/api/video/cancel-delete', method: 'POST' });
    expect(legacy.request.body).toEqual({ url: recording.url });
    legacy.flush({});

    api.cancelRecordingDeletion({ ...recording, url: null, playbackRequiresSession: true }).subscribe();
    const byId = http.expectOne({ url: '/api/video/cancel-delete', method: 'POST' });
    expect(byId.request.body).toEqual({ recordingId: recording.recordingId });
    byId.flush({});
  });
});
