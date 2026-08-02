import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_API_URL } from '../../constants';

export type RecordingUploadReceipt = Record<string, unknown>;

@Injectable({
  providedIn: 'root'
})
export class RecordingUploadService {
  private readonly http = inject(HttpClient);

  public upload(recording: Blob, fileName: string): Observable<RecordingUploadReceipt> {
    const formData = new FormData();
    formData.append('file', recording, fileName);

    return this.http.post<RecordingUploadReceipt>(`${APP_API_URL}/api/uploadVideo`, formData);
  }
}
