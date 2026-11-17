import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, forkJoin, map, of, shareReplay, tap } from 'rxjs';
import { NotificationService } from '../notification/notification.service';
import { AuthI, RegisterI, TokenI, StoreUserIN, TrustedUserPreview, VideoDataI } from '../../interfaces';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { Router } from '@angular/router';
import { APP_API_URL } from '../../constants';

interface TrustMutationResponse {
  message?: string;
  targetType?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = APP_API_URL;
  private userDataCache?: StoreUserIN;
  private userDataRequest$?: Observable<StoreUserIN>;
  private trustedUsersCache = new Map<string, TrustedUserPreview>();
  private trustedUsersRequestByKeyId = new Map<string, Observable<TrustedUserPreview | undefined>>();

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
        const message = error?.error?.code === 'email_in_use' ? error.error.error : null;
        this.notificationService.showError(message || `Error: ${error}`);
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

  public getUserData(refresh = false): Observable<StoreUserIN> {
    if (this.userDataRequest$) {
      return this.userDataRequest$;
    }

    if (!refresh && this.userDataCache) {
      return of(this.userDataCache);
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

  public getTrustedUsersByKeyIds(keyIds: string[], useCache = true): Observable<TrustedUserPreview[]> {
    const normalizedKeyIds = [...new Set(keyIds.filter((keyId): keyId is string => !!keyId))];

    if (!normalizedKeyIds.length) {
      return of([]);
    }

    if (!useCache) {
      return this.fetchTrustedUsers(normalizedKeyIds);
    }

    const trustedUsersByKeyId = new Map<string, Observable<TrustedUserPreview | undefined>>();
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
      const batchRequest$ = this.fetchTrustedUsers(missingKeyIds).pipe(
        tap(users => {
          users.forEach(user => {
            if (user?.keyId) {
              this.trustedUsersCache.set(user.keyId, user);
            }
          });
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
      map(users => users.filter((user): user is TrustedUserPreview => !!user))
    );
  }

  private fetchTrustedUsers(keyIds: string[]): Observable<TrustedUserPreview[]> {
    return this.http.post<TrustedUserPreview[]>(`${this.baseUrl}/api/user/trusted`, { keyIds });
  }

  public saveImage(imageBase64: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/user/saveImage`, { image: imageBase64 }).pipe(
      tap(() => {
        this.userDataCache = undefined;
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

  public updateVaultFolderLayout(vaultFolderLayout: 'grid' | 'list') {
    return this.http.patch(`${this.baseUrl}/api/user/preferences`, { vaultFolderLayout }).pipe(tap(() => {
      if (this.userDataCache) {
        this.userDataCache = {
          ...this.userDataCache,
          preferences: { ...this.userDataCache.preferences, vaultFolderLayout }
        };
      }
    }));
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
    const { root, queryParams } = this.router.parseUrl(this.router.url);
    const path = root.children['primary']?.segments.map(segment => segment.path).join('/');
    this.router.navigate([path === 'auth' && queryParams['destination'] === 'admin' ? '/admin' : '/profile']);
  }

  public saveTokenToStorage(token: string): void {
    this.storageService.setItem('token', token);
  }

  public isLoggedIn(): boolean {
    return !!this.storageService.getItem('token');
  }

  public addUserByKeyId(keyId: string): Observable<TrustMutationResponse> {
    return this.mutateTrust('addUser', keyId);
  }

  public cancelRequest(keyId: string, direction?: 'incoming' | 'outgoing'): Observable<TrustMutationResponse> {
    return this.mutateTrust('cancelRequest', keyId, direction);
  }

  public acceptTrustedUser(keyId: string): Observable<TrustMutationResponse> {
    return this.mutateTrust('acceptUser', keyId);
  }

  public removeTrustedUser(keyId: string): Observable<TrustMutationResponse> {
    return this.mutateTrust('removeUser', keyId);
  }

  private mutateTrust(
    route: 'addUser' | 'cancelRequest' | 'acceptUser' | 'removeUser',
    keyId: string,
    direction?: 'incoming' | 'outgoing'
  ): Observable<TrustMutationResponse> {
    return this.http.post<TrustMutationResponse>(`${this.baseUrl}/api/user/${route}`, { keyId, direction }).pipe(
      tap(() => {
        this.userDataCache = undefined;
        this.trustedUsersCache.delete(keyId);
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
