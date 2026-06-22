import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { Create } from '../create/create';

@Component({
  selector: 'app-list',
  imports: [Create],
  templateUrl: './list.html',
  styleUrl: './list.css',
})
export class List implements OnInit {
  users: any[] = [];
  isLoading = true;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.fetchUsers();
  }

  fetchUsers() {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
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
