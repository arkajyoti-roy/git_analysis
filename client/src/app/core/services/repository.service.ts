import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
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
        shareReplay(1)
      );
    }
    return this.reposCache$;
  }

  clearCache() {
    this.reposCache$ = null;
  }
}
