import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap } from 'rxjs';
import { NotificationService } from '../notification/notification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'https://jsonplaceholder.typicode.com';

  constructor(private http: HttpClient, private notificationService: NotificationService) { }

  public getUsers(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/users`)
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

  // register(userData: any): Observable<any> {
  //   return this.http.post<any>(`${this.baseUrl}/register`, userData);
  // }

  // login(credentials: any): Observable<any> {
  //   return this.http.post<any>(`${this.baseUrl}/login`, credentials);
  // }

  // logout(): Observable<any> {
  //   return this.http.post<any>(`${this.baseUrl}/logout`, {});
  // }
}
