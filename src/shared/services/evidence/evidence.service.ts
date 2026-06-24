import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { APP_API_URL } from '../../constants';
import { EvidenceVerifyRequestI, EvidenceVerifyResponseI } from '../../interfaces';

@Injectable({
  providedIn: 'root'
})
export class EvidenceService {
  private baseUrl = APP_API_URL;

  constructor(private http: HttpClient) {}

  public verifyEvidence(payload: EvidenceVerifyRequestI): Observable<EvidenceVerifyResponseI> {
    return this.http.post<EvidenceVerifyResponseI>(`${this.baseUrl}/api/evidence/verify`, payload).pipe(
      catchError(error => {
        throw error;
      })
    );
  }
}
