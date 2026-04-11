import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap } from 'rxjs';
import { NotificationService } from '../notification/notification.service';
import { StreamI } from '../../interfaces';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { Router } from '@angular/router';
import { APP_API_URL } from '../../constants';

@Injectable({
  providedIn: 'root'
})
export class ServerNotificationsService {
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

  getNotifications() {
    return this.http.get<any[]>(`${this.baseUrl}/api/notifications`);
  }

  markRead(createdAt: string) {
    return this.http.post(`${this.baseUrl}/api/notifications/markRead`, { createdAt });
  }
}
