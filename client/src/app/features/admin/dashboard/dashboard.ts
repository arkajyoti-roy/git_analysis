import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  recentUsers: any[] = [];
  totalUsers: number = 0;
  totalRepositories: number = 5;
  pendingScans: number = 2;
  isLoading = true;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.fetchDashboardData();
  }

  fetchDashboardData() {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (response: any) => {
        this.isLoading = false;
        const data = response.data || response;
        if (Array.isArray(data)) {
          this.totalUsers = data.length;
          this.recentUsers = [...data].reverse().slice(0, 5);
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error fetching dashboard users:', error);
      }
    });
  }
}