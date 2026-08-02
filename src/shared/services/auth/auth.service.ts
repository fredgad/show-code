import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, forkJoin, map, of, shareReplay, tap } from 'rxjs';
import { NotificationService } from '../notification/notification.service';
import { AuthI, RegisterI, TokenI, StoreUserIN, VideoDataI } from '../../interfaces';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { Router } from '@angular/router';
import { APP_API_URL } from '../../constants';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = APP_API_URL;
  private userDataCache?: StoreUserIN;
  private userDataRequest$?: Observable<StoreUserIN>;
  private trustedUsersCache = new Map<string, StoreUserIN>();
  private trustedUsersRequestByKeyId = new Map<string, Observable<StoreUserIN | undefined>>();

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private storageService: LocalStorageService,
    private router: Router
  ) { }

  public register(userData: RegisterI): Observable<TokenI> {
    return this.http.post<TokenI>(`${this.baseUrl}/api/auth/register`, userData).pipe(
      tap(() => {
        // this.notificationService.show('Successfuly registered');
      }),
      catchError(error => {
        this.notificationService.showError(`Error: ${error}`);
        throw error;
      })
    );
  }

  public auth(userData: AuthI): Observable<TokenI> {
    return this.http.post<TokenI>(`${this.baseUrl}/api/auth/login`, userData).pipe(
      tap(() => {
        // this.notificationService.show('Successfuly logged');
      }),
      catchError(error => {
        this.notificationService.showError(`Error: ${error}`);
        throw error;
      })
    );
  }

  public getUserData(): Observable<StoreUserIN> {
    if (this.userDataCache) {
      return of(this.userDataCache);
    }

    if (this.userDataRequest$) {
      return this.userDataRequest$;
    }

    this.userDataRequest$ = this.http.get<StoreUserIN>(`${this.baseUrl}/api/user/me`).pipe(
      tap(() => {
        // this.notificationService.show('Successfuly get user data');
      }),
      tap(data => {
        this.userDataCache = data;
      }),
      catchError(error => {
        this.notificationService.showError(`Error: ${error}`);
        throw error;
      }),
      finalize(() => {
        this.userDataRequest$ = undefined;
      }),
      shareReplay(1)
    );

    return this.userDataRequest$;
  }

  public getTrustedUsersByKeyIds(keyIds: string[]): Observable<StoreUserIN[]> {
    const normalizedKeyIds = [...new Set(keyIds.filter((keyId): keyId is string => !!keyId))];

    if (!normalizedKeyIds.length) {
      return of([]);
    }

    const trustedUsersByKeyId = new Map<string, Observable<StoreUserIN | undefined>>();
    const missingKeyIds: string[] = [];

    normalizedKeyIds.forEach(keyId => {
      const cachedUser = this.trustedUsersCache.get(keyId);

      if (cachedUser) {
        trustedUsersByKeyId.set(keyId, of(cachedUser));
        return;
      }

      const request$ = this.trustedUsersRequestByKeyId.get(keyId);

      if (request$) {
        trustedUsersByKeyId.set(keyId, request$);
        return;
      }

      missingKeyIds.push(keyId);
    });

    if (missingKeyIds.length) {
      const batchRequest$ = this.http.post<StoreUserIN[]>(`${this.baseUrl}/api/user/trusted`, { keyIds: missingKeyIds }).pipe(
        tap(() => {
          this.notificationService.show('Successfuly get users');
        }),
        tap(users => {
          users.forEach(user => {
            if (user?.keyId) {
              this.trustedUsersCache.set(user.keyId, user);
            }
          });
        }),
        catchError(error => {
          this.notificationService.showError('Error');
          throw error;
        }),
        finalize(() => {
          missingKeyIds.forEach(keyId => {
            this.trustedUsersRequestByKeyId.delete(keyId);
          });
        }),
        shareReplay(1)
      );

      missingKeyIds.forEach(keyId => {
        const requestByKeyId$ = batchRequest$.pipe(map(users => users.find(user => user?.keyId === keyId)));

        this.trustedUsersRequestByKeyId.set(keyId, requestByKeyId$);
        trustedUsersByKeyId.set(keyId, requestByKeyId$);
      });
    }

    return forkJoin(normalizedKeyIds.map(keyId => trustedUsersByKeyId.get(keyId) ?? of(undefined))).pipe(
      map(users => users.filter((user): user is StoreUserIN => !!user))
    );
  }

  public saveImage(imageBase64: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/user/saveImage`, { image: imageBase64 }).pipe(
      tap(() => {
        this.userDataCache = undefined;
        this.notificationService.show('Successfuly save image');
      }),
      catchError(error => {
        this.notificationService.showError(`Error: ${error}`);
        throw error;
      })
    );
  }

  public changeEmail(newEmail: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/api/user/changeEmail`, { newEmail }).pipe(
      catchError(error => {
        throw error;
      })
    );
  }

  public changeUsername(newUsername: string): Observable<{ message: string; username: string }> {
    return this.http.post<{ message: string; username: string }>(`${this.baseUrl}/api/user/changeUsername`, { newUsername }).pipe(
      tap(() => {
        this.userDataCache = undefined;
        this.userDataRequest$ = undefined;
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  public changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/api/user/changePassword`, { currentPassword, newPassword }).pipe(
      catchError(error => {
        throw error;
      })
    );
  }

  public updateLanguage(lang: string): Observable<{ message: string; lang: string }> {
    return this.http.post<{ message: string; lang: string }>(`${this.baseUrl}/api/user/lang`, { lang });
  }

  public sendRecoveryCode(email: string): Observable<{ message: string; email: string }> {
    return this.http.post<{ message: string; email: string }>(`${this.baseUrl}/api/auth/recovery/send`, { email }).pipe(
      catchError(error => {
        throw error;
      })
    );
  }

  public verifyRecoveryCode(email: string, code: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/api/auth/recovery/verify`, { email, code }).pipe(
      catchError(error => {
        throw error;
      })
    );
  }

  public resetRecoveredPassword(email: string, code: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/api/auth/recovery/reset`, { email, code, newPassword }).pipe(
      catchError(error => {
        throw error;
      })
    );
  }

  public logout(): void {
    // For logout use store facade method
    this.resetRequestCache();
    this.storageService.setItem('token', '');
    this.router.navigate(['/']).then(() => {
      window.location.reload();
    });
  }

  public enterAccountSuccess(response: TokenI): void {
    this.saveTokenToStorage(response.token);
    this.router.navigate(['/profile']);
  }

  public saveTokenToStorage(token: string): void {
    this.storageService.setItem('token', token);
  }

  public isLoggedIn(): boolean {
    return !!this.storageService.getItem('token');
  }

  public addUserByKeyId(keyId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/user/addUser`, { keyId }).pipe(
      tap(() => {
        this.userDataCache = undefined;
        this.notificationService.show(`Successfuly add user by keyId: ${keyId}.`);
      }),
      catchError(error => {
        this.notificationService.showError(`Error: ${error}`);
        throw error;
      })
    );
  }

  public cancelRequest(keyId: string): Observable<void> {
    // Note: cancelRequest route might be missing in backend, using assumption or TODO
    return this.http.post<void>(`${this.baseUrl}/api/user/cancelRequest`, { keyId }).pipe(
      tap(() => {
        this.userDataCache = undefined;
        this.notificationService.show(`Successfuly cancel request by user with keyId: ${keyId}.`);
      }),
      catchError(error => {
        this.notificationService.showError(`Error: ${error}`);
        throw error;
      })
    );
  }

  public acceptTrustedUser(keyId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/user/acceptUser`, { keyId }).pipe(
      tap(() => {
        this.userDataCache = undefined;
        this.notificationService.show(`Successfuly add trusted user with keyId: ${keyId}.`);
      }),
      catchError(error => {
        this.notificationService.showError(`Error: ${error}`);
        throw error;
      })
    );
  }

  public removeTrustedUser(keyId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/user/removeUser`, { keyId }).pipe(
      tap(() => {
        this.userDataCache = undefined;
        this.notificationService.show(`Successfuly removed user with keyId: ${keyId} from trusted.`);
      }),
      catchError(error => {
        this.notificationService.showError(`Error: ${error}`);
        throw error;
      })
    );
  }

  public uploadVideo(formData: FormData): Observable<VideoDataI> {
    return this.http.post<VideoDataI>(`${this.baseUrl}/api/uploadVideo`, formData).pipe(
      tap(() => {
        this.userDataCache = undefined;
        // this.notificationService.show(`Successfuly upload video: ${formData}.`);
      }),
      catchError(error => {
        this.notificationService.showError(`Error: ${error}`);
        throw error;
      })
    );
  }

  // public getUserVideos(): Observable<any> {
  //   return this.http.get<any>(`${this.baseUrl}/uploadVideo`).pipe(
  //     tap(() => {
  //       this.notificationService.show(`Successfuly get user videos.`);
  //     }),
  //     catchError(error => {
  //       this.notificationService.showError(`Error: ${error}`);
  //       throw error;
  //     })
  //   );
  // }

  public deleteUserVideo(videoData: VideoDataI): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/video/delete`, videoData).pipe(
      tap(() => {
        this.userDataCache = undefined;
        this.notificationService.show(`Successfuly delete video: ${videoData.url}.`);
      }),
      catchError(error => {
        this.notificationService.showError(`Error: ${error}`);
        throw error;
      })
    );
  }

  public saveSubscription(subscription: PushSubscription): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/saveSubscription`, { subscription }).pipe(
      tap(() => {
        this.notificationService.show(`Successfuly save subscription: ${subscription}.`);
      }),
      catchError(error => {
        this.notificationService.showError(`Error subscription: ${error}`);
        throw error;
      })
    );
  }

  private resetRequestCache(): void {
    this.userDataCache = undefined;
    this.userDataRequest$ = undefined;
    this.trustedUsersCache.clear();
    this.trustedUsersRequestByKeyId.clear();
  }
}
