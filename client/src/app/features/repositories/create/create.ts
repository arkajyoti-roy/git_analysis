import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CONFIG } from '../../../config/config';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { ThemeService } from '../../../core/services/theme.service';
import { RepositoryService } from '../../../core/services/repository.service';

@Component({
  selector: 'app-create',
  imports: [FormsModule, MonacoEditorModule, RouterLink],
  templateUrl: './create.html',
  styleUrl: './create.css',
})
export class Create implements OnInit {

  // Edit mode
  isEditMode = false;
  repoId: number | null = null;

  repo_name = '';
  repo_stack: string[] = [];
  repo_status = 'development env';
  repo_branch = '';
  repo_arch = '';
  repo_apis = '';
  repo_schema = '';
  repo_init_author = '';
  repo_init_date = '';
  repo_deadline = '';
  repo_issues = '';
  repo_review_log = '';
  repo_major_commits = '';
  repo_code_snippet = '';
  repo_getting_started = '';
  repo_env = '';
  repo_deployment = '';
  repo_coding_standards = '';
  repo_architecture_diagram = '';

  isSubmitting = false;

  // Stack options for checkbox tracking
  stackOptions = ['Angular', 'Laravel', 'React', 'Node.js', 'MongoDB', 'Python'];

  editorOptions = { 
    theme: 'vs', 
    language: 'javascript', 
    automaticLayout: true,
    fontSize: 14,
    fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
    minimap: { enabled: true },
    formatOnType: true,
    formatOnPaste: true,
    scrollBeyondLastLine: false,
    padding: { top: 16 },
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on'
  };

  constructor(
    private http: HttpClient, 
    private router: Router,
    private route: ActivatedRoute,
    public themeService: ThemeService,
    private repoService: RepositoryService
  ) {}

  ngOnInit() {
    this.editorOptions = {
      ...this.editorOptions,
      theme: this.themeService.isDarkMode ? 'vs-dark' : 'vs'
    };

    // Check if editing
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        this.isEditMode = true;
        this.repoId = parseInt(idStr, 10);
        this.loadRepoData(this.repoId);
      }
    });
  }

  loadRepoData(id: number) {
    this.repoService.getRepositoryById(id).subscribe({
      next: (res: any) => {
        const repo = res.data || res;
        this.repo_name = repo.repo_name || '';
        this.repo_status = repo.repo_status || 'development env';
        this.repo_branch = repo.repo_branch || '';
        this.repo_arch = repo.repo_arch || '';
        this.repo_schema = repo.repo_schema || '';
        this.repo_init_author = repo.repo_init_author || '';
        this.repo_init_date = repo.repo_init_date || '';
        this.repo_deadline = repo.repo_deadline || '';
        this.repo_code_snippet = repo.repo_code_snippet || '';
        this.repo_getting_started = repo.repo_getting_started || '';
        this.repo_env = repo.repo_env || '';
        this.repo_deployment = repo.repo_deployment || '';
        this.repo_coding_standards = repo.repo_coding_standards || '';
        this.repo_architecture_diagram = repo.repo_architecture_diagram || '';

        // Handle array fields → join back to text for textarea
        this.repo_apis = Array.isArray(repo.repo_apis) 
          ? JSON.stringify(repo.repo_apis, null, 2) 
          : (repo.repo_apis || '');
        this.repo_issues = Array.isArray(repo.repo_issues) 
          ? repo.repo_issues.join('\n') 
          : (repo.repo_issues || '');
        this.repo_review_log = Array.isArray(repo.repo_review_log) 
          ? repo.repo_review_log.join('\n') 
          : (repo.repo_review_log || '');
        this.repo_major_commits = Array.isArray(repo.repo_major_commits) 
          ? repo.repo_major_commits.join('\n') 
          : (repo.repo_major_commits || '');

        // Handle stack array
        if (Array.isArray(repo.repo_stack)) {
          this.repo_stack = [...repo.repo_stack];
        } else if (typeof repo.repo_stack === 'string' && repo.repo_stack) {
          this.repo_stack = repo.repo_stack.split(',').map((s: string) => s.trim());
        }
      },
      error: (err) => {
        console.error('Failed to load repository for editing', err);
        alert('Failed to load repository data.');
      }
    });
  }

  isStackChecked(stack: string): boolean {
    return this.repo_stack.includes(stack);
  }

  toggleStack(stack: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.repo_stack.push(stack);
    } else {
      this.repo_stack = this.repo_stack.filter(s => s !== stack);
    }
  }

  private textToArray(text: string): string[] {
    if (!text) return [];
    return text.split('\n').map(s => s.trim()).filter(s => s !== '');
  }

  private parseApis(text: string): any[] {
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private getEmpId(): string {
    return localStorage.getItem('emp_id') || localStorage.getItem('admin_id') || '';
  }

  submitRepo() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    if (this.isEditMode) {
      this.updateRepo();
    } else {
      this.createRepo();
    }
  }

  createRepo() {
    const payload: any = {
      repo_name: this.repo_name,
      repo_stack: this.repo_stack,
      repo_status: this.repo_status,
      repo_branch: this.repo_branch,
      repo_arch: this.repo_arch,
      repo_apis: this.parseApis(this.repo_apis),
      repo_schema: this.repo_schema,
      repo_init_author: this.repo_init_author,
      repo_init_date: this.repo_init_date,
      repo_deadline: this.repo_deadline,
      repo_issues: this.textToArray(this.repo_issues),
      repo_review_log: this.textToArray(this.repo_review_log),
      repo_major_commits: this.textToArray(this.repo_major_commits),
      repo_getting_started: this.repo_getting_started,
      repo_env: this.repo_env,
      repo_deployment: this.repo_deployment,
      repo_coding_standards: this.repo_coding_standards,
      repo_architecture_diagram: this.repo_architecture_diagram
    };

    if (this.repo_code_snippet) payload.repo_code_snippet = this.repo_code_snippet;

    this.http.post(`${CONFIG.BASE_URL}/repositories`, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        alert('Repository created successfully!');
        this.repoService.clearCache();
        this.router.navigate(['/admin/repositories']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showError(err);
      }
    });
  }

  updateRepo() {
    const payload: any = {
      emp_id: this.getEmpId(),
      repo_name: this.repo_name,
      repo_stack: this.repo_stack,
      repo_status: this.repo_status,
      repo_branch: this.repo_branch,
      repo_arch: this.repo_arch,
      repo_apis: this.parseApis(this.repo_apis),
      repo_schema: this.repo_schema,
      repo_init_author: this.repo_init_author,
      repo_init_date: this.repo_init_date,
      repo_deadline: this.repo_deadline,
      repo_issues: this.textToArray(this.repo_issues),
      repo_review_log: this.textToArray(this.repo_review_log),
      repo_major_commits: this.textToArray(this.repo_major_commits),
      repo_getting_started: this.repo_getting_started,
      repo_env: this.repo_env,
      repo_deployment: this.repo_deployment,
      repo_coding_standards: this.repo_coding_standards,
      repo_architecture_diagram: this.repo_architecture_diagram
    };

    if (this.repo_code_snippet) payload.repo_code_snippet = this.repo_code_snippet;

    this.http.put(`${CONFIG.BASE_URL}/repositories/${this.repoId}`, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        alert('Repository updated successfully!');
        this.repoService.clearCache();
        this.router.navigate(['/admin/repositories', this.repoId]);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showError(err);
      }
    });
  }

  private showError(err: any) {
    console.error('Validation Error Details:', err.error);
    let errorMsg = 'Error saving repository.';
    if (err.error?.errors) {
      const fieldErrors = Object.entries(err.error.errors)
        .map(([field, msgs]: [string, any]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
        .join('\n');
      errorMsg += '\n\n' + fieldErrors;
    } else if (err.error?.message) {
      errorMsg += '\n\n' + err.error.message;
    }
    alert(errorMsg);
  }
}
