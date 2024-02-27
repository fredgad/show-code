import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'https://jsonplaceholder.typicode.com';

  constructor(private http: HttpClient) { }

  getUsers(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/users`);
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
