import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ForhorService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/chat';
  private readonly jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

  getForhor(prompt: string): Observable<Forhor> {
    return this.http.post<Forhor>(this.apiUrl, { prompt }, { headers: this.jsonHeaders });
  }
}
