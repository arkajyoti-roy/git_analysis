import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { RepositoryService } from '../../../core/services/repository.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  recentUsers: any[] = [];
  recentRepos: any[] = [];
  totalUsers: number = 0;
  totalRepositories: number = 0;
  pendingScans: number = 2;
  isLoading = true;

  constructor(private userService: UserService, private repoService: RepositoryService) {}

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

    this.repoService.getRepositories().subscribe({
      next: (response: any) => {
        const data = response.data || response;
        if (Array.isArray(data)) {
          this.totalRepositories = data.length;
          this.recentRepos = [...data].reverse().slice(0, 5);
        }
      },
      error: (error) => {
        console.error('Error fetching dashboard repos:', error);
      }
    });
  }
}