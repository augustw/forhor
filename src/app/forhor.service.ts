import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface Forhor {
  id: number;
  text: string;
  highlights: string[];
}

export interface Chunk {
  chunk: string;
  rank: string;
  // optional identifiers returned from backend (snake_case or camelCase)
  forhor_id?: number;
  forhorId?: number;
  chunk_index?: number;
  chunkIndex?: number;
  start_pos?: number;
  end_pos?: number;
  similarity?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ForhorService {
  private readonly http = inject(HttpClient);
  private readonly jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });
  // Subject used to broadcast which chunk is hovered in the search UI
  readonly hoverChunk$ = new Subject<Chunk | null>();

  setHoverChunk(chunk: Chunk | null) {
    this.hoverChunk$.next(chunk);
  }

  /** Hämta alla förhör */
  getAllForhor(): Observable<Forhor[]> {
    return this.http.get<Forhor[]>('/api/forhor');
  }

  /** Semantisk sökning efter text mot samtliga förhör */
  searchChunks(text: string): Observable<Chunk[]> {
    return this.http.post<Chunk[]>('/api/forhor/search', { text: text }, { headers: this.jsonHeaders });
  }
}
