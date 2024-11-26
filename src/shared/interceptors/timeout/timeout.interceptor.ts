import { inject, Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AppStoreFacade } from '@store';

@Injectable({
  providedIn: 'root'
})
export class TimeoutInterceptor implements HttpInterceptor {
  private router = inject(Router);
  private facade = inject(AppStoreFacade);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const timeoutValue: number = 30000;

    return next.handle(request).pipe(
      timeout(timeoutValue),
      catchError((error: HttpErrorResponse) => {
        if (error.error instanceof ErrorEvent) {
          console.error('An error occurred!!!!!:', error.error.message);
        } else {
          if (error.status === 403) {
            console.error('Access denied (403): Invalid token');
            localStorage.removeItem('token');
            this.facade.logout();
            this.router.navigate(['/auth']);
          } else {
            console.error(`Backend returned code ${error.status}, body was: ${error.error}`);
          }
        }
        return throwError('Request timed out');
      })
    );
  }
}
