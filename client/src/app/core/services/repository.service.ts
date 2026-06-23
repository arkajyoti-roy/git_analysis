import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay, tap, catchError } from 'rxjs/operators';
import { CONFIG } from '../../config/config';

@Injectable({
  providedIn: 'root'
})
export class RepositoryService {
  private reposCache$: Observable<any> | null = null;

  constructor(private http: HttpClient) {}

  getRepositories(forceRefresh = false): Observable<any> {
    if (!this.reposCache$ || forceRefresh) {
      this.reposCache$ = this.http.get(`${CONFIG.BASE_URL}/repositories`).pipe(
        shareReplay({ bufferSize: 1, refCount: true }),
        catchError((err) => {
          this.reposCache$ = null; // Clear cache on error so next attempt retries
          throw err;
        })
      );
    }
    return this.reposCache$;
  }

  getRepositoryById(id: number): Observable<any> {
    return this.http.get(`${CONFIG.BASE_URL}/repositories/${id}`);
  }

  clearCache() {
    this.reposCache$ = null;
  }
}
