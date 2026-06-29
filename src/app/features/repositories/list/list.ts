import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CONFIG } from '../../../config/config';
import { RepositoryService } from '../../../core/services/repository.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-list',
  imports: [RouterLink, FormsModule],
  templateUrl: './list.html',
  styleUrl: './list.css',
})
export class List implements OnInit, OnDestroy {
  repositories: any[] = [];
  isLoading: boolean = true;
  private pollInterval: any;

  searchQuery = '';
  currentPage = 1;
  itemsPerPage = 10;
  Math = Math;

  constructor(private http: HttpClient, private repoService: RepositoryService, private toast: ToastService) {}

  ngOnInit() {
    this.fetchRepositories();
    // Auto reload every 30 seconds (30000 ms)
    this.pollInterval = setInterval(() => {
      this.fetchRepositories(true);
    }, 30000);
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  fetchRepositories(isPolling = false) {
    if (!isPolling && this.repositories.length === 0) this.isLoading = true;
    
    this.repoService.getRepositories().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.repositories = res.data || res;
      },
      error: () => {
        if (!isPolling) this.isLoading = false;
      }
    });
  }

  get filteredRepos() {
    let filtered = this.repositories;
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        (r.repo_name || '').toLowerCase().includes(q) ||
        (r.repo_stack || '').toLowerCase().includes(q) ||
        (r.repo_status || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }

  get totalPages() {
    return Math.ceil(this.filteredRepos.length / this.itemsPerPage) || 1;
  }

  get paginatedRepos() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredRepos.slice(startIndex, startIndex + this.itemsPerPage);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  repoToDelete: any = null;

  confirmDelete(repo: any) {
    this.repoToDelete = repo;
  }

  cancelDelete() {
    this.repoToDelete = null;
  }

  executeDelete() {
    if (!this.repoToDelete) return;
    const id = this.repoToDelete.id;
    this.http.delete(`${CONFIG.BASE_URL}/repositories/${id}`).subscribe({
      next: () => {
        this.repositories = this.repositories.filter(r => r.id !== id);
        this.repoService.clearCache();
        this.repoToDelete = null;
        this.toast.success('Repository deleted successfully');
      },
      error: () => {
        this.toast.error('Error deleting repository');
        this.repoToDelete = null;
      }
    });
  }
}
