import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Forhor {
  id: number;
  text: string;
  highlights: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ForhorService {
  private readonly http = inject(HttpClient);
  private readonly jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

  /** Hämta alla förhör */
  getAllForhor(): Observable<Forhor[]> {
    return this.http.get<Forhor[]>('/api/forhor');
  }

  /** Semantisk sökning efter text mot samtliga förhör */
  searchForhor(text: string): Observable<Forhor> {
    return this.http.post<Forhor>('/api/chat', { text: text }, { headers: this.jsonHeaders });
  }
}
