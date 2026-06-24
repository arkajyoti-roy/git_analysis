import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RepositoryService } from '../../../core/services/repository.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastService } from '../../../core/services/toast.service';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { EditorComponent } from 'ngx-monaco-editor-v2';
import { Topbar } from '../../../shared/topbar/topbar';
import mermaid from 'mermaid';

@Component({
  selector: 'app-details',
  imports: [CommonModule, DatePipe, RouterLink, MonacoEditorModule, FormsModule, Topbar],
  templateUrl: './details.html',
  styleUrl: './details.css',
})
export class Details implements OnInit, OnDestroy {
  activeTab = 'overview';
  repoId: number | null = null;
  repo: any = null;
  isLoading = true;
  isDev = false;
  private mermaidRendered = false;
  private pollInterval: any;

  editorOptions = { 
    theme: 'vs', 
    language: 'javascript', 
    automaticLayout: true,
    fontSize: 14,
    fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
    minimap: { enabled: false },
    readOnly: true,
    scrollBeyondLastLine: false,
    padding: { top: 16 }
  };

  @ViewChild('mermaidContainer') mermaidContainer!: ElementRef;

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
      const parsed = typeof this.repo.repo_apis === 'string' 
        ? JSON.parse(this.repo.repo_apis) 
        : this.repo.repo_apis;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [{ method: 'INFO', path: 'Raw Text', desc: this.repo.repo_apis }];
    }
  }

  constructor(
    private route: ActivatedRoute,
    private repoService: RepositoryService,
    public themeService: ThemeService,
    private toast: ToastService
  ) {
    mermaid.initialize({ 
      startOnLoad: false, 
      theme: 'dark',
      securityLevel: 'loose'
    });
  }

  ngOnInit() {
    const role = localStorage.getItem('role') || '';
    this.isDev = ['sr-dev', 'jr-dev', 'dev'].includes(role);

    this.editorOptions = {
      ...this.editorOptions,
      theme: this.themeService.isDarkMode ? 'vs-dark' : 'vs'
    };

    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        this.repoId = parseInt(idStr, 10);
        this.fetchRepoDetails(this.repoId);
        
        // Auto reload every 3 seconds (3000 ms)
        if (this.pollInterval) clearInterval(this.pollInterval);
        this.pollInterval = setInterval(() => {
          if (this.repoId) {
            this.fetchRepoDetails(this.repoId, true);
          }
        }, 3000);
      }
    });
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  fetchRepoDetails(id: number, isPolling = false) {
    if (!isPolling && !this.repo) this.isLoading = true;
    this.repoService.getRepositoryById(id).subscribe({
      next: (res: any) => {
        const oldDiagram = this.repo?.repo_architecture_diagram;
        this.repo = res.data || res;
        this.isLoading = false;
        
        if (oldDiagram !== this.repo.repo_architecture_diagram) {
          this.mermaidRendered = false;
          if (this.activeTab === 'architecture') {
            setTimeout(() => this.renderMermaid(), 100);
          }
        }
      },
      error: (err) => {
        console.error('Failed to load repository', err);
        if (!isPolling) this.isLoading = false;
      }
    });
  }

  onArchitectureTabActive() {
    this.activeTab = 'architecture';
    // Render mermaid after tab switch with a small delay for DOM
    this.mermaidRendered = false;
    setTimeout(() => this.renderMermaid(), 100);
  }

  async renderMermaid() {
    if (this.mermaidRendered || !this.repo?.repo_architecture_diagram) return;
    
    const container = document.getElementById('mermaid-diagram');
    if (!container) return;

    try {
      container.innerHTML = '';
      const { svg } = await mermaid.render('mermaid-svg', this.repo.repo_architecture_diagram);
      container.innerHTML = svg;
      this.mermaidRendered = true;
    } catch (e) {
      console.error('Mermaid render error:', e);
      container.innerHTML = `<pre style="color: #ef4444; padding: 1rem;">Failed to render diagram. Check Mermaid syntax.\n\nRaw:\n${this.repo.repo_architecture_diagram}</pre>`;
    }
  }

  copyToClipboard(text: any) {
    if (!text) return;
    
    // Ensure we are copying a string
    const stringText = typeof text === 'string' ? text : JSON.stringify(text, null, 2);

    // Try modern Clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(stringText).then(() => {
        this.toast.success('Copied to clipboard!');
      }).catch(err => {
        console.warn('Clipboard API failed, trying fallback...', err);
        this.fallbackCopyTextToClipboard(stringText);
      });
    } else {
      // Fallback for non-secure contexts (HTTP) or older browsers
      this.fallbackCopyTextToClipboard(stringText);
    }
  }

  private fallbackCopyTextToClipboard(text: string) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Make it invisible and prevent scrolling
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.opacity = "0";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        this.toast.success('Copied to clipboard!');
      } else {
        this.toast.error('Failed to copy. Please try manually.');
      }
    } catch (err) {
      console.error('Fallback copy failed', err);
      this.toast.error('Failed to copy. Please try manually.');
    }
    
    document.body.removeChild(textArea);
  }

  copyApis() {
    if (!this.parsedApis || this.parsedApis.length === 0) return;
    const text = this.parsedApis.map(api => `[${api.method || 'GET'}] ${api.path || 'N/A'}\nDescription: ${api.desc || 'No description'}`).join('\n\n');
    this.copyToClipboard(text);
  }
}
