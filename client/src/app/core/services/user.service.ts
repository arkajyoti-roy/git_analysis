import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { CONFIG } from '../../config/config';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usersCache$: Observable<any> | null = null;

  constructor(private http: HttpClient) {}

  getUsers(forceRefresh = false): Observable<any> {
    if (!this.usersCache$ || forceRefresh) {
      this.usersCache$ = this.http.get(`${CONFIG.BASE_URL}/users`).pipe(
        shareReplay(1)
      );
    }
    return this.usersCache$;
  }

  clearCache() {
    this.usersCache$ = null;
  }
}
