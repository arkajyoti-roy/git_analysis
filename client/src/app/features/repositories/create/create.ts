import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CONFIG } from '../../../config/config';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-create',
  imports: [FormsModule, MonacoEditorModule],
  templateUrl: './create.html',
  styleUrl: './create.css',
})
export class Create implements OnInit {

  repo_name = '';
  repo_stack: string[] = [];
  repo_status = 'active';
  repo_branch = 'main';
  repo_init_author = '';
  repo_init_date = '';
  repo_deadline = '';
  repo_issues = '';
  repo_review_log = '';
  repo_major_commits = '';
  repo_code_snippets = '';

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
    public themeService: ThemeService
  ) {}

  ngOnInit() {
    this.editorOptions = {
      ...this.editorOptions,
      theme: this.themeService.isDarkMode ? 'vs-dark' : 'vs'
    };
  }

  toggleStack(stack: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.repo_stack.push(stack);
    } else {
      this.repo_stack = this.repo_stack.filter(s => s !== stack);
    }
  }

  createRepo() {
    const payload = {
      repo_name: this.repo_name,
      repo_stack: this.repo_stack,
      repo_status: this.repo_status,
      repo_branch: this.repo_branch,
      repo_init_author: this.repo_init_author,
      repo_init_date: this.repo_init_date,
      repo_deadline: this.repo_deadline,
      repo_issues: this.repo_issues,
      repo_review_log: this.repo_review_log,
      repo_major_commits: this.repo_major_commits,
      repo_code_snippets: this.repo_code_snippets
    };

    this.http.post(`${CONFIG.BASE_URL}/repositories`, payload).subscribe({
      next: (res) => {
        alert('Repository created successfully!');
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        alert('Error creating repository');
        console.error(err);
      }
    });
  }
}
