import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap } from 'rxjs';
import { NotificationService } from '../notification/notification.service';
import { AuthI, RegisterI, TokenI, StoreUserIN } from '../../interfaces';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { Router } from '@angular/router';
import { APP_API_URL } from '../../constants';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = APP_API_URL;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private storageService: LocalStorageService,
    private router: Router
  ) {}

  public register(userData: RegisterI): Observable<TokenI> {
    return this.http.post<TokenI>(`${this.baseUrl}/register`, userData).pipe(
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
    return this.http.post<TokenI>(`${this.baseUrl}/login`, userData).pipe(
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
    return this.http.get<StoreUserIN>(`${this.baseUrl}/getUser`).pipe(
      tap(() => {
        // this.notificationService.show('Successfuly get user data');
      }),
      catchError(error => {
        this.notificationService.showError(`Error: ${error}`);
        throw error;
      })
    );
  }

  public getTrustedUsersByKeyIds(keyIds: string[]): Observable<StoreUserIN[]> {
    return this.http.post<StoreUserIN[]>(`${this.baseUrl}/getTrustedUsersByKeyIds`, { keyIds }).pipe(
      tap(() => {
        this.notificationService.show('Successfuly get users');
      }),
      catchError(error => {
        this.notificationService.showError('Error');
        throw error;
      })
    );
  }

  public saveImage(imageBase64: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/saveImage`, { image: imageBase64 }).pipe(
      tap(() => {
        this.notificationService.show('Successfuly save image');
      }),
      catchError(error => {
        this.notificationService.showError(`Error: ${error}`);
        throw error;
      })
    );
  }

  public logout(): void {
    // For logout use store facade method
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
    return this.http.post<void>(`${this.baseUrl}/addUserByKeyId`, { keyId }).pipe(
      tap(() => {
        this.notificationService.show(`Successfuly add user by keyId: ${keyId}.`);
      }),
      catchError(error => {
        this.notificationService.showError(`Error: ${error}`);
        throw error;
      })
    );
  }

  public cancelRequest(keyId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/cancelRequest`, { keyId }).pipe(
      tap(() => {
        this.notificationService.show(`Successfuly cancel request by user with keyId: ${keyId}.`);
      }),
      catchError(error => {
        this.notificationService.showError(`Error: ${error}`);
        throw error;
      })
    );
  }

  public acceptTrustedUser(keyId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/acceptTrustedUser`, { keyId }).pipe(
      tap(() => {
        this.notificationService.show(`Successfuly add trusted user with keyId: ${keyId}.`);
      }),
      catchError(error => {
        this.notificationService.showError(`Error: ${error}`);
        throw error;
      })
    );
  }

  public removeTrustedUser(keyId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/removeTrustedUser`, { keyId }).pipe(
      tap(() => {
        this.notificationService.show(`Successfuly removed user with keyId: ${keyId} from trusted.`);
      }),
      catchError(error => {
        this.notificationService.showError(`Error: ${error}`);
        throw error;
      })
    );
  }

  public uploadVideo(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/uploadVideo`, formData).pipe(
      tap(() => {
        this.notificationService.show(`Successfuly upload video: ${formData}.`);
      }),
      catchError(error => {
        this.notificationService.showError(`Error: ${error}`);
        throw error;
      })
    );
  }

  public getUserVideos(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/uploadVideo`).pipe(
      tap(() => {
        this.notificationService.show(`Successfuly get user videos.`);
      }),
      catchError(error => {
        this.notificationService.showError(`Error: ${error}`);
        throw error;
      })
    );
  }
}
