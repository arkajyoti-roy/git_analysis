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
  repo_status = 'Development Env';
  repo_branch = '';
  repo_arch_array: string[] = [];
  repo_apis: { method: string, path: string, desc: string }[] = [];
  repo_schema = '';
  repo_init_author = '';
  repo_init_date = new Date().toISOString().split('T')[0];
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

  // Dynamic options tracking
  stackOptions = ['Angular', 'Laravel', 'React', 'Node.js', 'MongoDB', 'Python'];
  statusOptions = ['Development Env', 'On Review', 'Production Up', 'Issue', 'On Resolving', 'Completed'];
  archOptions = ['Monolith', 'Microservices', 'Serverless', 'Event-Driven', 'SOA', 'MVC'];

  newStackInput = '';
  newStatusInput = '';
  newArchInput = '';

  get availableStacks(): string[] {
    return this.stackOptions.filter(s => !this.repo_stack.includes(s));
  }

  get availableArchs(): string[] {
    return this.archOptions.filter(a => !this.repo_arch_array.includes(a));
  }

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
      } else {
        this.repo_init_author = localStorage.getItem('emp_name') || localStorage.getItem('admin_name') || '';
      }
    });
  }

  loadRepoData(id: number) {
    this.repoService.getRepositoryById(id).subscribe({
      next: (res: any) => {
        const repo = res.data || res;
        this.repo_name = repo.repo_name || '';
        this.repo_status = repo.repo_status || 'Development Env';
        // Add status to list if it's custom
        if (this.repo_status && !this.statusOptions.includes(this.repo_status)) {
          this.statusOptions.push(this.repo_status);
        }
        this.repo_branch = repo.repo_branch || '';
        
        if (repo.repo_arch) {
          this.repo_arch_array = repo.repo_arch.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '');
        }

        this.repo_schema = repo.repo_schema || '';
        this.repo_init_author = repo.repo_init_author || '';
        this.repo_init_date = repo.repo_init_date || new Date().toISOString().split('T')[0];
        this.repo_deadline = repo.repo_deadline || '';
        this.repo_code_snippet = repo.repo_code_snippet || '';
        this.repo_getting_started = repo.repo_getting_started || '';
        this.repo_env = repo.repo_env || '';
        this.repo_deployment = repo.repo_deployment || '';
        this.repo_coding_standards = repo.repo_coding_standards || '';
        this.repo_architecture_diagram = repo.repo_architecture_diagram || '';

        // Handle array fields
        if (Array.isArray(repo.repo_apis)) {
          this.repo_apis = repo.repo_apis.map((api: any) => ({
            method: api?.method || 'GET',
            path: api?.path || '',
            desc: api?.desc || ''
          }));
        } else if (typeof repo.repo_apis === 'string' && repo.repo_apis.trim() !== '') {
          try {
            const parsed = JSON.parse(repo.repo_apis);
            if (Array.isArray(parsed)) {
              this.repo_apis = parsed;
            } else if (typeof parsed === 'object') {
              this.repo_apis = [parsed];
            } else {
              this.repo_apis = [{ method: 'INFO', path: 'Raw Text', desc: repo.repo_apis }];
            }
          } catch {
            this.repo_apis = [{ method: 'INFO', path: 'Raw Text', desc: repo.repo_apis }];
          }
        } else {
          this.repo_apis = [];
        }

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

  addStackFromDropdown(event: any) {
    const val = event.target.value;
    if (val && !this.repo_stack.includes(val)) {
      this.repo_stack.push(val);
    }
    // Reset the select back to default
    event.target.value = "";
  }

  removeStack(stack: string) {
    this.repo_stack = this.repo_stack.filter(s => s !== stack);
  }

  addCustomStack() {
    const s = this.newStackInput.trim();
    if (s && !this.stackOptions.includes(s)) {
      this.stackOptions.push(s);
      this.repo_stack.push(s);
    } else if (s && !this.repo_stack.includes(s)) {
      this.repo_stack.push(s);
    }
    this.newStackInput = '';
  }

  addArchFromDropdown(event: any) {
    const val = event.target.value;
    if (val && !this.repo_arch_array.includes(val)) {
      this.repo_arch_array.push(val);
    }
    event.target.value = "";
  }

  removeArch(arch: string) {
    this.repo_arch_array = this.repo_arch_array.filter(a => a !== arch);
  }

  addCustomArch() {
    const a = this.newArchInput.trim();
    if (a && !this.archOptions.includes(a)) {
      this.archOptions.push(a);
      this.repo_arch_array.push(a);
    } else if (a && !this.repo_arch_array.includes(a)) {
      this.repo_arch_array.push(a);
    }
    this.newArchInput = '';
  }

  addCustomStatus() {
    const s = this.newStatusInput.trim();
    if (s && !this.statusOptions.includes(s)) {
      this.statusOptions.push(s);
    }
    if (s) {
      this.repo_status = s;
    }
    this.newStatusInput = '';
  }

  private textToArray(text: string): string[] {
    if (!text) return [];
    return text.split('\n').map(s => s.trim()).filter(s => s !== '');
  }

  addApiRow() {
    this.repo_apis.push({ method: 'GET', path: '', desc: '' });
  }

  removeApiRow(index: number) {
    this.repo_apis.splice(index, 1);
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
      repo_arch: this.repo_arch_array.join(', ').substring(0, 40),
      repo_apis: this.repo_apis,
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
      repo_arch: this.repo_arch_array.join(', ').substring(0, 40),
      repo_apis: this.repo_apis,
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
