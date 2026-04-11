import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { NotificationService } from '../notification/notification.service';
import { StreamI } from '../../interfaces';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { Router } from '@angular/router';
import { APP_API_URL } from '../../constants';

@Injectable({
  providedIn: 'root'
})
export class StreamService {
  private baseUrl = APP_API_URL;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private storageService: LocalStorageService,
    private router: Router
  ) {}

  public startStream(title: string): Observable<StreamI> {
    return this.http.post<StreamI>(`${this.baseUrl}/api/stream/start`, { title }).pipe(
      tap(() => {
        this.notificationService.show('Трансляция успешно начата');
      }),
      catchError(error => {
        this.notificationService.showError(`Ошибка старта трансляции: ${error}`);
        throw error;
      })
    );
  }

  public uploadStreamChunk(formData: FormData): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/uploadStreamChunk`, formData).pipe(
      catchError(error => {
        this.notificationService.showError(`Ошибка отправки чанка: ${error}`);
        throw error;
      })
    );
  }

  public endStream(streamId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/endStream`, { streamId }).pipe(
      tap(() => {
        this.notificationService.show('Трансляция завершена');
      }),
      catchError(error => {
        if (error?.status === 404) {
          return of(void 0);
        }
        this.notificationService.showError(`Ошибка завершения трансляции: ${error}`);
        throw error;
      })
    );
  }

  public getStreamChunksUrl(streamId: string): string {
    return `${this.baseUrl}/streamChunks/${streamId}`;
  }
}
