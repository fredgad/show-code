import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { LangEnum } from '../../interfaces';
import { LangService } from '../../services';

@Injectable({
  providedIn: 'root'
})
export class TokenInterceptor implements HttpInterceptor {
  private langService = inject(LangService);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'x-lang': this.mapLang(this.langService.getLang$i())
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    request = request.clone({
      setHeaders: headers
    });

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(error);
      })
    );
  }

  private mapLang(lang: LangEnum): string {
    switch (lang) {
      case LangEnum.RUS:
        return 'ru';
      case LangEnum.ESP:
        return 'es';
      case LangEnum.EST:
        return 'et';
      default:
        return 'en';
    }
  }
}
