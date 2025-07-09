import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { VAPID_PUBLIC_KEY } from '@shared/constants';
import { from, of, throwError, Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class PushService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  public subscribeToNotifications(): Observable<any> {
    // 1) Проверяем поддержку Service Worker
    if (!('serviceWorker' in navigator)) {
      return throwError(() => new Error('Service Worker не поддерживается'));
    }
    // 2) Проверяем, не запрещены ли уведомления
    if (Notification.permission === 'denied') {
      return throwError(() => new Error('У пользователя запрещены уведомления'));
    }

    // 3) Если уже "granted", делаем of('granted'), ИНАЧЕ from(...) requestPermission()
    const permission$: Observable<NotificationPermission> =
      Notification.permission === 'granted' ? of<NotificationPermission>('granted') : from(Notification.requestPermission());

    return permission$.pipe(
      switchMap((perm: NotificationPermission) => {
        if (perm !== 'granted') {
          return throwError(() => new Error('Пользователь не дал разрешение на уведомления'));
        }
        // 4) Получаем готовый ServiceWorkerRegistration
        console.log(navigator.serviceWorker.ready, 'navigator log');
        return from(navigator.serviceWorker.ready);
      }),
      switchMap((registration: ServiceWorkerRegistration) => {
        // 5) Подписываемся на пуш
        console.log('registration log');
        return from(
          registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          })
        );
      }),
      switchMap((subscription: PushSubscription) => {
        console.log('Push subscription:', subscription);
        // 6) Отправляем подписку на сервер
        // return this.http.post('/saveSubscription', { subscription });
        return this.authService.saveSubscription(subscription);
      }),
      tap(() => {
        console.log('Подписка успешно сохранена на сервере!');
      })
    );
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
