import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { RepositoryService } from '../../../core/services/repository.service';

@Component({
  selector: 'app-details',
  imports: [DatePipe],
  templateUrl: './details.html',
  styleUrl: './details.css',
})
export class Details implements OnInit {
  activeTab = 'overview';
  repoId: number | null = null;
  repo: any = null;
  isLoading = true;

  get parsedInstallSteps(): string[] {
    if (!this.repo?.repo_getting_started) return [];
    return String(this.repo.repo_getting_started).split('\n').filter((s: string) => s.trim() !== '');
  }

  get parsedEnvVars(): {key: string, value: string}[] {
    if (!this.repo?.repo_env) return [];
    return String(this.repo.repo_env).split('\n')
      .map((line: string) => {
        const [key, ...val] = line.split('=');
        return { key: (key || '').trim(), value: val.join('=').trim() };
      })
      .filter((e: any) => e.key);
  }

  get parsedApis(): any[] {
    if (!this.repo?.repo_apis) return [];
    try {
      const parsed = JSON.parse(this.repo.repo_apis);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [{ method: 'INFO', path: 'Raw Text', desc: this.repo.repo_apis }];
    }
  }

  constructor(
    private route: ActivatedRoute,
    private repoService: RepositoryService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        this.repoId = parseInt(idStr, 10);
        this.fetchRepoDetails(this.repoId);
      }
    });
  }

  fetchRepoDetails(id: number) {
    this.isLoading = true;
    this.repoService.getRepositoryById(id).subscribe({
      next: (res: any) => {
        this.repo = res.data || res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load repository', err);
        this.isLoading = false;
      }
    });
  }
}
