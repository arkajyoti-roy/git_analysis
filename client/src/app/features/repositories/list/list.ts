import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CONFIG } from '../../../config/config';
import { RepositoryService } from '../../../core/services/repository.service';

@Component({
  selector: 'app-list',
  imports: [RouterLink],
  templateUrl: './list.html',
  styleUrl: './list.css',
})
export class List implements OnInit {
  repositories: any[] = [];
  isLoading: boolean = true;

  constructor(private http: HttpClient, private repoService: RepositoryService) {}

  ngOnInit() {
    this.fetchRepositories();
  }

  fetchRepositories() {
    this.isLoading = true;
    this.repoService.getRepositories().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.repositories = res.data || res;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching repositories:', err);
      }
    });
  }

  deleteRepo(id: number) {
    if (confirm('Are you sure you want to delete this repository?')) {
      this.http.delete(`${CONFIG.BASE_URL}/repositories/${id}`).subscribe({
        next: () => {
          this.repositories = this.repositories.filter(r => r.id !== id);
          this.repoService.clearCache();
        },
        error: (err) => {
          alert('Error deleting repository');
          console.error(err);
        }
      });
    }
  }
}
