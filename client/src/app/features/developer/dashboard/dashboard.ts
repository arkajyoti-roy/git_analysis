import { Component, OnInit } from '@angular/core';
import { Topbar } from '../../../shared/topbar/topbar';
import { RepositoryService } from '../../../core/services/repository.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [Topbar, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DEVDashboard implements OnInit {
  isSrDev: boolean = false;
  isJrDev: boolean = false;
  userName: string = 'Developer';

  activeRepos: any[] = [];
  assignedIssues: any[] = [];
  pendingReviews: any[] = [];

  systemAlerts = [
    { type: 'Info', message: 'All systems operational.' }
  ];

  constructor(private repoService: RepositoryService) {}

  ngOnInit() {
    const role = localStorage.getItem('role');
    this.userName = localStorage.getItem('emp_name') || 'Developer';
    
    if (role === 'sr-dev') {
      this.isSrDev = true;
    } else if (role === 'jr-dev' || role === 'dev') {
      this.isJrDev = true;
    }

    this.loadDeveloperData();
  }

  loadDeveloperData() {
    this.repoService.getRepositories().subscribe({
      next: (res: any) => {
        const repos = Array.isArray(res) ? res : (res.data || []);
        
        this.activeRepos = repos.map((r: any) => ({
          name: r.repo_name,
          status: r.repo_status || 'Active',
          branch: r.repo_branch || 'main',
          id: r.id || r.repo_id
        }));

        this.assignedIssues = [];
        this.pendingReviews = [];

        repos.forEach((repo: any) => {
          // Parse issues
          if (repo.repo_issues) {
            let issuesArr: any[] = [];
            if (Array.isArray(repo.repo_issues)) {
              issuesArr = repo.repo_issues;
            } else if (typeof repo.repo_issues === 'string') {
              try { issuesArr = JSON.parse(repo.repo_issues); } 
              catch { issuesArr = repo.repo_issues.split('\n'); }
            }
            issuesArr.forEach((iss: any, idx: number) => {
              if (iss && typeof iss === 'string' && iss.trim() !== '') {
                this.assignedIssues.push({
                  id: `#ISSUE-${repo.id || Math.floor(Math.random()*100)}-${idx + 1}`,
                  title: iss.length > 60 ? iss.substring(0, 60) + '...' : iss,
                  repo: repo.repo_name,
                  priority: idx === 0 ? 'High' : 'Medium'
                });
              }
            });
          }

          // Parse reviews
          if (this.isSrDev && repo.repo_review_log) {
             let reviewArr: any[] = [];
             if (Array.isArray(repo.repo_review_log)) {
               reviewArr = repo.repo_review_log;
             } else if (typeof repo.repo_review_log === 'string') {
               try { reviewArr = JSON.parse(repo.repo_review_log); } 
               catch { reviewArr = repo.repo_review_log.split('\n'); }
             }
             reviewArr.forEach((rev: any, idx: number) => {
               if (rev && typeof rev === 'string' && rev.trim() !== '') {
                 this.pendingReviews.push({
                   pr: `REV-${repo.id || Math.floor(Math.random()*100)}-${idx + 1}`,
                   author: repo.repo_init_author || 'Developer',
                   title: rev.length > 60 ? rev.substring(0, 60) + '...' : rev,
                   repo: repo.repo_name
                 });
               }
             });
          }
        });
      },
      error: (err) => console.error('Failed to load developer data', err)
    });
  }
}
