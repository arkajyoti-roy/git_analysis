import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CONFIG } from '../../config/config';

@Injectable({
  providedIn: 'root'
})
export class RepositoryService {

  constructor(private http: HttpClient) {}

  getRepositories(): Observable<any> {
    return this.http.get(`${CONFIG.BASE_URL}/repositories`);
  }

  getRepositoryById(id: number, branchId?: number): Observable<any> {
    const url = branchId 
      ? `${CONFIG.BASE_URL}/repositories/${id}?branch_id=${branchId}`
      : `${CONFIG.BASE_URL}/repositories/${id}`;
    return this.http.get(url);
  }

  clearCache() {
    // No-op now that caching is removed
  }
}
