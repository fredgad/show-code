import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap } from 'rxjs';
import { NotificationService } from '../notification/notification.service';
import { AuthI, RegisterI, TokenI, UserDataI } from '../../interfaces';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:9000';

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private storageService: LocalStorageService,
    private router: Router
  ) { }

  public getUsers(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/getUsers`)
    .pipe(
      tap(() => {
        this.notificationService.show('Successfuly get users');
      }),
      catchError(error => {
        this.notificationService.showError('Error');
        throw error;
      })
    );
  }

  public register(userData: RegisterI): Observable<TokenI> {
    return this.http.post<TokenI>(`${this.baseUrl}/register`, userData)
    .pipe(
      tap(() => {
        this.notificationService.show('Successfuly registered');
      }),
      catchError(error => {
        this.notificationService.showError('Error: ', error);
        throw error;
      })
    );
  }

  public auth(userData: AuthI): Observable<TokenI> {
    return this.http.post<TokenI>(`${this.baseUrl}/login`, userData)
    .pipe(
      tap(() => {
        this.notificationService.show('Successfuly logged');
      }),
      catchError(error => {
        this.notificationService.showError('Error: ', error);
        throw error;
      })
    );
  }

  public getUserData(): Observable<UserDataI> {
    return this.http.get<UserDataI>(`${this.baseUrl}/getUser`)
    .pipe(
      tap(() => {
        this.notificationService.show('Successfuly get user data');
      }),
      catchError(error => {
        this.notificationService.showError('Error: ', error);
        throw error;
      })
    );
  }

  public saveImage(imageBase64: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/saveImage`, { image: imageBase64 })
    .pipe(
      tap(() => {
        this.notificationService.show('Successfuly save image');
      }),
      catchError(error => {
        this.notificationService.showError('Error: ', error);
        throw error;
      })
    );
  }


  public logout(): void { // For logout use store facade method
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
}
