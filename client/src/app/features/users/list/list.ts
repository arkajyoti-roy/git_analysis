import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Create } from '../create/create';
import { CONFIG } from '../../../config/config';

@Component({
  selector: 'app-list',
  imports: [Create],
  templateUrl: './list.html',
  styleUrl: './list.css',
})
export class List implements OnInit {
  users: any[] = [];
  isLoading = true;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchUsers();
  }

  fetchUsers() {
    this.isLoading = true;
    this.http.get(`${CONFIG.BASE_URL}/users`).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        const data = response.data || response;
        if (Array.isArray(data)) {
          this.users = data;
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error fetching users:', error);
      }
    });
  }
}
