import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';
import mermaid from 'mermaid';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of, combineLatest } from 'rxjs';
import { CONFIG } from '../../../config/config';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { ThemeService } from '../../../core/services/theme.service';
import { RepositoryService } from '../../../core/services/repository.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { TitleCasePipe, NgIf, CommonModule, Location } from '@angular/common';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-create',
  imports: [FormsModule, MonacoEditorModule, RouterLink, TitleCasePipe, QuillModule, NgIf, CommonModule],
  templateUrl: './create.html',
  styleUrl: './create.css',
})
export class Create implements OnInit {
methodColors: { [key: string]: string } = {
  GET: '#0CBB52',
  POST: '#FFB400',
  PUT: '#097BED',
  PATCH: '#A359DF',
  DELETE: '#E05353',
  HEAD: '#009688',
  OPTIONS: '#E15599'
};

getMethodColor(method: string): string {
  return this.methodColors[method?.toUpperCase()] || '#000000';
}

  // Edit mode
  isEditMode = false;
  repoId: number | null = null;

  repo_name = '';
  repo_github_url = '';
  repo_stack: string[] = [];
  repo_status = '';
  repo_branch = 'main';
  repo_arch = '';
  repo_apis: { 
    method: string, 
    path: string, 
    desc: string, 
    headers?: string, 
    payload?: string, 
    response?: string,
    isHeadersRaw?: boolean,
    parsedHeaders?: { active: boolean, key: string, value: string }[]
  }[] = [];
  repo_schema = '';
  repo_init_author = '';
  repo_init_date = new Date().toISOString().split('T')[0];
  repo_deadline = '';
  repo_issues = '';
  repo_review_log = '';
  repo_major_commits = '';
  repo_code_snippet = '';
  repo_code_snippets: { title: string, code: string }[] = [];
  selectedSnippetIndex = 0;
  repo_getting_started = '';
  repo_env = '';
  repo_deployment = '';
  repo_coding_standards = '';
  repo_architecture_diagram = '';

  // Access control: both admins and devs can be assigned roles
  repo_access: { emp_id: string, name: string, can: string, permission?: string, role_id?: number | null, role_catagory?: string, emp_role?: string }[] = [];
  deletedRoles: number[] = [];
  repo_maintainer: string = '';
  availableUsers: any[] = [];
  allUsers: any[] = [];
  roleOptions: { category: string, roles: string[] }[] = [];

  activeTab: string = 'basic';
  isSubmitting = false;

  // Files & Docs staging properties
  stagedFiles: { file: File, name: string, desc: string }[] = [];
  existingFiles: any[] = [];
  newFileName = '';
  newFileDesc = '';
  selectedFileToUpload: File | null = null;
  isUploadingFile = false;

  // Whiteboard property
  whiteboardUrl: SafeResourceUrl | null = null;
  selectedBranchId: number | null = null;

  // DB Diagram state
  dbDiagramSvg: SafeHtml | null = null;
  showDbDiagram = false;
  
  isFetchingGithub = false;

  async fetchFromGithub() {
    if (!this.repo_github_url) {
      this.toast.error('Please enter a GitHub URL first');
      return;
    }

    let urlStr = this.repo_github_url.trim();
    if (urlStr.endsWith('/')) urlStr = urlStr.slice(0, -1);
    const match = urlStr.match(/github\.com\/([^\/]+)\/([^\/]+)/i);
    
    if (!match) {
      this.toast.error('Invalid GitHub URL format. Please use https://github.com/owner/repo');
      return;
    }

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, ''); 
    
    this.isFetchingGithub = true;
    
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (response.status === 403) {
        throw new Error('GitHub API rate limit exceeded (60 requests/hr) or repository is private. Please try again later.');
      } else if (!response.ok) {
        throw new Error('Repository not found or private');
      }
      
      const data = await response.json();
      
      if (!this.repo_name) this.repo_name = data.name;
      this.repo_status = data.archived ? 'Archived' : 'Active';
      this.repo_branch = data.default_branch || 'main';
      this.toast.success('Successfully fetched repository details from GitHub!');
      
      // Attempt to fetch architecture diagram
      try {
        const archResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/architecture.mmd?ref=${data.default_branch}`, {
          headers: { 'Accept': 'application/vnd.github.v3.raw' }
        });
        if (archResponse.ok) {
          this.repo_architecture_diagram = await archResponse.text();
          this.toast.success('Architecture diagram auto-filled!');
        }
      } catch(e) {}

      const sanitizeText = (text: string) => {
        if (!text) return '';
        // Remove 4-byte emojis which crash MySQL utf8
        let safe = text.replace(/[\u{10000}-\u{10FFFF}]/gu, '');
        // Truncate to ~60KB to fit in standard TEXT columns
        if (safe.length > 60000) safe = safe.substring(0, 60000) + '\n\n... [Truncated]';
        return safe;
      };

      try {
        const contentsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents?ref=${data.default_branch}`);
        if (contentsResponse.ok) {
          const contents = await contentsResponse.json();
          if (Array.isArray(contents)) {
            // Find ANY .sql file
            const sqlFile = contents.find((f: any) => f.name.endsWith('.sql') && f.type === 'file');
            if (sqlFile) {
              const schemaResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${sqlFile.path}?ref=${data.default_branch}`, {
                headers: { 'Accept': 'application/vnd.github.v3.raw' }
              });
              if (schemaResponse.ok) {
                this.repo_schema = sanitizeText(await schemaResponse.text());
                this.toast.success(`Database schema auto-filled from ${sqlFile.name}!`);
                if (this.showDbDiagram) {
                  this.previewDbDiagram();
                }
              }
            }
            
            // Find ANY .env file (.env, .env.example, env.sample, etc.)
            const envFile = contents.find((f: any) => f.type === 'file' && (f.name.includes('.env') || f.name.startsWith('env.')));
            if (envFile) {
              const envResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${envFile.path}?ref=${data.default_branch}`, {
                headers: { 'Accept': 'application/vnd.github.v3.raw' }
              });
              if (envResponse.ok) {
                this.repo_env = sanitizeText(await envResponse.text());
                this.toast.success(`Environment variables auto-filled from ${envFile.name}!`);
              }
            }
          }
        }
      } catch(e) {}

      // Attempt to fetch languages for tech stack
      let detectedLanguages: string[] = [];
      try {
        const langResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`);
        if (langResponse.ok) {
          const langData = await langResponse.json();
          detectedLanguages = Object.keys(langData);
          let addedCount = 0;
          detectedLanguages.forEach(lang => {
            // Only add if it doesn't exist to avoid duplicates
            if (!this.repo_stack.includes(lang)) {
              this.repo_stack.push(lang);
              addedCount++;
            }
          });
          if (addedCount > 0) this.toast.success(`Auto-filled ${addedCount} technologies to the stack!`);
        }
      } catch(e) {}

      // Attempt to fetch README for Documentation, Getting Started, and Deployment
      try {
        const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
          headers: { 'Accept': 'application/vnd.github.v3.raw' }
        });
        
        const generateFallback = (type: 'install' | 'deploy', langs: string[]) => {
          let content = '';
          const lowerLangs = langs.map(l => l.toLowerCase());
          
          if (lowerLangs.includes('typescript') || lowerLangs.includes('javascript')) {
            if (type === 'install') content += "### Node.js Setup\n1. Ensure Node.js is installed.\n2. Run `npm install` to install dependencies.\n3. Run `npm start` or `npm run dev` to start the application.\n\n";
            else content += "### Node.js Deployment\n1. Run `npm run build` to create a production bundle.\n2. Start the server using `npm start` or deploy the static files to a web host.\n\n";
          }
          if (lowerLangs.includes('python')) {
            if (type === 'install') content += "### Python Setup\n1. Create a virtual environment: `python -m venv venv`\n2. Activate the environment.\n3. Run `pip install -r requirements.txt`.\n4. Run the main application file (e.g., `python main.py`).\n\n";
            else content += "### Python Deployment\n1. Setup a production WSGI server like Gunicorn or uWSGI.\n2. Configure a reverse proxy like Nginx to route traffic to the WSGI server.\n\n";
          }
          if (lowerLangs.includes('java')) {
            if (type === 'install') content += "### Java Setup\n1. Ensure JDK is installed.\n2. Run `mvn clean install` or `./gradlew build` depending on the build tool.\n\n";
            else content += "### Java Deployment\n1. Build the executable JAR/WAR file.\n2. Deploy to a Java Application Server (like Tomcat) or run `java -jar app.jar`.\n\n";
          }
          if (lowerLangs.includes('go')) {
            if (type === 'install') content += "### Go Setup\n1. Run `go mod tidy` to download dependencies.\n2. Run `go run main.go` to start the application.\n\n";
            else content += "### Go Deployment\n1. Build the binary using `go build -o app`.\n2. Execute the compiled binary on your production server.\n\n";
          }
          
          if (!content && langs.length > 0) {
            if (type === 'install') content = "### General Setup\n1. Clone the repository.\n2. Install the necessary language runtimes for: " + langs.join(', ') + ".\n3. Execute the standard build command for your framework.\n";
            if (type === 'deploy') content = "### General Deployment\n1. Build the production artifacts for: " + langs.join(', ') + ".\n2. Deploy to your preferred hosting provider.\n";
          }
          
          return content || (type === 'install' ? 'No specific setup instructions could be determined.' : 'No specific deployment instructions could be determined.');
        };

        if (readmeResponse.ok) {
          const readmeText = await readmeResponse.text();
          this.repo_coding_standards = sanitizeText(readmeText);
          
          const extractSection = (text: string, regex: RegExp) => {
             const match = text.match(regex);
             if (!match) return '';
             const headingLevel = match[1].length;
             const contentStartIndex = match.index! + match[0].length;
             const remainingText = text.substring(contentStartIndex);
             const nextHeadingRegex = new RegExp(`^#{1,${headingLevel}}\\s`, 'm');
             const nextHeadingMatch = remainingText.match(nextHeadingRegex);
             if (nextHeadingMatch) return remainingText.substring(0, nextHeadingMatch.index).trim();
             return remainingText.trim();
          };

          const installRegex = /^(#+)\s*(?:getting started|installation|setup|quick start|how to install)/im;
          const installContent = extractSection(readmeText, installRegex);
          this.repo_getting_started = sanitizeText(installContent || generateFallback('install', detectedLanguages));

          const deployRegex = /^(#+)\s*(?:deployment|deploying|production|hosting)/im;
          const deployContent = extractSection(readmeText, deployRegex);
          this.repo_deployment = sanitizeText(deployContent || generateFallback('deploy', detectedLanguages));

          this.toast.success('README parsed! Auto-filled Documentation and Guides.');
        } else {
          // If no README exists, just use the fallback generator
          this.repo_getting_started = sanitizeText(generateFallback('install', detectedLanguages));
          this.repo_deployment = sanitizeText(generateFallback('deploy', detectedLanguages));
        }
      } catch(e) {}

    } catch (err: any) {
      this.toast.error(err.message || 'Failed to fetch from GitHub. Please check the URL.');
    } finally {
      this.isFetchingGithub = false;
    }
  }

  parseSqlToMermaid(sql: string): string {
    let mermaidStr = 'erDiagram\n';
    
    // Remove comments, backticks, quotes, and IF NOT EXISTS
    let cleanSql = sql
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/IF NOT EXISTS/gi, '')
      .replace(/[`'"]/g, '');
      
    const relationships: string[] = [];

    // Extract ALTER TABLE foreign keys
    const alterTableRegex = /ALTER\s+TABLE\s+([a-zA-Z0-9_]+)\s+ADD\s+(?:CONSTRAINT\s+[a-zA-Z0-9_]+\s+)?FOREIGN\s+KEY\s*\([^)]+\)\s*REFERENCES\s+([a-zA-Z0-9_]+)/gi;
    let match;
    while ((match = alterTableRegex.exec(cleanSql)) !== null) {
      let srcTable = match[1];
      let refTable = match[2];
      if (/^[0-9]/.test(srcTable)) srcTable = 't_' + srcTable;
      if (/^[0-9]/.test(refTable)) refTable = 't_' + refTable;
      relationships.push(`${srcTable} }o--|| ${refTable} : "references"`);
    }
    
    // Split by CREATE TABLE
    const chunks = cleanSql.split(/CREATE\s+TABLE/i);
    let hasTables = false;

    for (let i = 1; i < chunks.length; i++) {
      const chunk = chunks[i].trim();
      
      // Extract table name
      const tableNameMatch = chunk.match(/^([a-zA-Z0-9_]+)/);
      if (!tableNameMatch) continue;
      let tableName = tableNameMatch[1];
      if (/^[0-9]/.test(tableName)) tableName = 't_' + tableName;
      
      const openIdx = chunk.indexOf('(');
      const closeIdx = chunk.lastIndexOf(')');
      if (openIdx === -1 || closeIdx === -1 || closeIdx < openIdx) continue;
      
      let body = chunk.substring(openIdx + 1, closeIdx);
      hasTables = true;
      
      // Protect commas inside parentheses like DECIMAL(10, 2)
      body = body.replace(/\([^)]+\)/g, (m) => m.replace(/,/g, ' '));
      
      const lines = body.split(',').map(l => l.trim()).filter(l => l);
      mermaidStr += `  ${tableName} {\n`;
      
      lines.forEach(line => {
        // Match explicit foreign keys: FOREIGN KEY (user_id) REFERENCES users(id)
        const fkMatch = line.match(/FOREIGN\s+KEY\s*\([^)]+\)\s*REFERENCES\s+([a-zA-Z0-9_]+)/i);
        if (fkMatch) {
          let refTable = fkMatch[1];
          if (/^[0-9]/.test(refTable)) refTable = 't_' + refTable;
          relationships.push(`${tableName} }o--|| ${refTable} : "references"`);
          return;
        }

        // Skip table-level constraints
        if (line.match(/^(PRIMARY|UNIQUE|KEY|CONSTRAINT|FULLTEXT|INDEX)/i)) {
          return;
        }

        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          let colName = parts[0].replace(/[^a-zA-Z0-9_]/g, '');
          let colType = parts[1].replace(/[^a-zA-Z0-9_]/g, ''); 
          
          if (!colName || !colType) return;
          if (/^[0-9]/.test(colName)) colName = 'c_' + colName;
          if (/^[0-9]/.test(colType)) colType = 't_' + colType;

          const inlineFk = line.match(/REFERENCES\s+([a-zA-Z0-9_]+)/i);
          if (inlineFk) {
            let refTable = inlineFk[1];
            if (/^[0-9]/.test(refTable)) refTable = 't_' + refTable;
            relationships.push(`${tableName} }o--|| ${refTable} : "references"`);
          }

          let keyMarker = '';
          if (line.match(/PRIMARY\s+KEY/i)) keyMarker = 'PK';
          else if (inlineFk) keyMarker = 'FK';

          mermaidStr += `    ${colType} ${colName} ${keyMarker}\n`;
        }
      });
      mermaidStr += `  }\n`;
    }

    if (!hasTables) {
      return '';
    }

    relationships.forEach(rel => {
      mermaidStr += `  ${rel}\n`;
    });
    
    return mermaidStr;
  }

  async previewDbDiagram() {
    if (!this.repo_schema) {
      this.toast.error('No schema available to visualize.');
      return;
    }
    
    const mermaidSyntax = this.parseSqlToMermaid(this.repo_schema);
    if (!mermaidSyntax) {
      this.toast.error('No CREATE TABLE statements found to visualize.');
      return;
    }

    try {
      mermaid.initialize({ startOnLoad: false, theme: this.themeService.isDarkMode ? 'dark' : 'default' });
      const id = 'mermaid-db-diagram-' + Date.now();
      const { svg } = await mermaid.render(id, mermaidSyntax);
      this.dbDiagramSvg = this.sanitizer.bypassSecurityTrustHtml(svg);
      this.showDbDiagram = true;
    } catch (err: any) {
      console.error('Mermaid render error:', err);
      console.error('Generated syntax:', mermaidSyntax);
      this.toast.error('Failed to generate diagram from SQL: ' + (err.message || 'Syntax error'));
    }
  }

  // Dynamic options tracking (will come from DB)
  stackOptions: { id: number | string, name: string }[] = [];
  statusOptions: { id: number | string, name: string }[] = [];
  archOptions: { id: number | string, name: string }[] = [];
  branchOptions: { id: number | string, name: string }[] = [];
  // Manage Modal State
  showManageModal = false;
  managingType: 'stack' | 'status' | 'arch' | 'branch' | null = null;
  newManageItemName = '';
  itemToDelete: any = null;

  get modalTitle(): string {
    if (this.managingType === 'stack') return 'Manage Stack';
    if (this.managingType === 'status') return 'Manage Status';
    if (this.managingType === 'arch') return 'Manage Architecture';
    if (this.managingType === 'branch') return 'Manage Branch';
    return 'Manage Category';
  }

  get currentManageItems(): { id: number | string, name: string }[] {
    if (this.managingType === 'stack') return this.stackOptions;
    if (this.managingType === 'status') return this.statusOptions;
    if (this.managingType === 'arch') return this.archOptions;
    if (this.managingType === 'branch') return this.branchOptions;
    return [];
  }

  get availableStacks(): { id: number | string, name: string }[] {
    return this.stackOptions.filter(s => !this.repo_stack.includes(s.name));
  }



  // For Access Control (roles): all users not already assigned a role
  get availableAccessUsers() {
    return this.allUsers.filter(u =>
      !this.repo_access.some(a => a.emp_id === (u.emp_id || u.id)?.toString())
    );
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
    private repoService: RepositoryService,
    private userService: UserService,
    private toast: ToastService,
    private sanitizer: DomSanitizer,
    private location: Location
  ) {}

  goBack() {
    this.location.back();
  }

  ngOnInit() {
    this.editorOptions = {
      ...this.editorOptions,
      theme: this.themeService.isDarkMode ? 'vs-dark' : 'vs'
    };

     // Check if editing
    combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, queryParams]) => {
      const branchIdStr = queryParams.get('branch_id');
      if (branchIdStr && branchIdStr !== 'null' && branchIdStr !== 'undefined') {
        this.selectedBranchId = parseInt(branchIdStr, 10);
      } else {
        this.selectedBranchId = null;
      }

      const idStr = params.get('id');
      if (idStr) {
        this.isEditMode = true;
        this.repoId = parseInt(idStr, 10);
        this.loadRepoData(this.repoId);
        this.fetchExistingFiles(this.repoId);
      } else {
        this.repo_init_author = localStorage.getItem('emp_name') || localStorage.getItem('admin_name') || '';
      }
    });

    this.fetchUsers();
    this.fetchStatuses();
    this.fetchArchitectures();
    this.fetchStacks();
    this.fetchBranches();
    this.fetchRoleOptions();
  }

  fetchRoleOptions() {
    this.http.get(`${CONFIG.BASE_URL}/repo-roles/options`).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.roleOptions = Object.keys(res.data).map(category => ({
            category,
            roles: res.data[category]
          }));
        }
      },
      error: () => {}
    });
  }

  fetchStatuses() {
    this.http.get(`${CONFIG.BASE_URL}/repo-statuses`).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        this.statusOptions = data.map((item: any) => ({
          id: item.id || item.repo_id || Date.now(),
          name: item.repo_status_name || item.name || item.status_name || 'Unknown'
        }));
      },
      error: () => {}
    });
  }

  fetchArchitectures() {
    this.http.get(`${CONFIG.BASE_URL}/repo-architectures`).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        this.archOptions = data.map((item: any) => ({
          id: item.id || Date.now(),
          name: item.repo_arch_name || item.repo_architecture_name || item.architecture_name || item.name || 'Unknown'
        }));
      },
      error: () => {}
    });
  }

  fetchStacks() {
    this.http.get(`${CONFIG.BASE_URL}/repo-stacks`).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        this.stackOptions = data.map((item: any) => ({
          id: item.id || Date.now(),
          name: item.repo_stack_name || item.stack_name || item.name || 'Unknown'
        }));
      },
      error: () => {}
    });
  }

  fetchBranches() {
    this.http.get(`${CONFIG.BASE_URL}/branches`).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        let repoBranches = data;
        
        if (this.repoId) {
          // Filter to only show branches for THIS specific repository
          repoBranches = data.filter((item: any) => item.repository_id == this.repoId);
        } else {
          repoBranches = [];
        }

        this.branchOptions = repoBranches.map((item: any) => ({
          id: item.id || Date.now(),
          name: item.repo_branch_name || item.branch_name || item.name || 'Unknown'
        }));
        
        // Ensure the currently selected branch is still an option if it's not in the list
        if (this.repo_branch && !this.branchOptions.some(b => b.name === this.repo_branch)) {
          this.branchOptions.push({ id: Date.now(), name: this.repo_branch });
        }
      },
      error: () => {}
    });
  }

  fetchUsers() {
    this.userService.getUsers().subscribe({
      next: (res: any) => {
        const users = Array.isArray(res) ? res : (res.data || []);
        this.allUsers = users;
        // Filter out admins since they have default access
        this.availableUsers = users.filter((u: any) => u.emp_role !== 'admin');
      },
      error: () => {}
    });
  }

  onEnvFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.includes('.env')) {
      this.toast.error('Only .env files are allowed');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const content = e.target.result;
      if (this.repo_env) {
        this.repo_env = this.repo_env + '\n' + content;
      } else {
        this.repo_env = content;
      }
      this.toast.success('.env file imported successfully');
    };
    reader.onerror = () => {
      this.toast.error('Failed to read the .env file');
    };
    reader.readAsText(file);
    
    // Clear the input so the same file can be selected again if needed
    const target = event.target as HTMLInputElement;
    if (target) target.value = '';
  }

  onSqlFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.sql')) {
      this.toast.error('Only .sql files are allowed');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const content = e.target.result;
      if (this.repo_schema) {
        this.repo_schema = this.repo_schema + '\n\n' + content;
      } else {
        this.repo_schema = content;
      }
      this.toast.success('.sql file imported successfully');
    };
    reader.onerror = () => {
      this.toast.error('Failed to read the .sql file');
    };
    reader.readAsText(file);
    
    // Clear the input so the same file can be selected again if needed
    const target = event.target as HTMLInputElement;
    if (target) target.value = '';
  }

  onPostmanFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      this.toast.error('Only .json files are allowed');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const content = JSON.parse(e.target.result);
        if (!content.item || !Array.isArray(content.item)) {
          this.toast.error('Invalid Postman Collection format (missing items)');
          return;
        }

        const apis: any[] = [];
        
        const extractRequests = (items: any[]) => {
          for (const item of items) {
            if (item.item && Array.isArray(item.item)) {
              extractRequests(item.item);
            } else if (item.request) {
              const req = item.request;
              let path = '';
              if (typeof req.url === 'string') {
                path = req.url;
              } else if (req.url && req.url.raw) {
                path = req.url.raw;
              } else if (req.url && req.url.path) {
                path = '/' + req.url.path.join('/');
              }
              
              let desc = item.name || '';
              if (req.description) desc += ' - ' + req.description;
              
              let payload = '';
              if (req.body && req.body.raw) {
                payload = req.body.raw;
              }
              
              let parsedHeaders: any[] = [];
              let isHeadersRaw = false;
              if (req.header && Array.isArray(req.header)) {
                parsedHeaders = req.header.map((h: any) => ({
                  active: !h.disabled,
                  key: h.key || '',
                  value: h.value || ''
                }));
              }
              
              const newApi = {
                method: req.method || 'GET',
                path: path,
                desc: desc,
                payload: payload,
                response: '',
                headers: '',
                isHeadersRaw: isHeadersRaw,
                parsedHeaders: parsedHeaders.length > 0 ? parsedHeaders : [{ active: true, key: '', value: '' }]
              };
              this.syncParsedHeadersToRaw(newApi);
              apis.push(newApi);
            }
          }
        };

        extractRequests(content.item);

        if (apis.length > 0) {
          // If the list has only one empty API item, replace it instead of appending
          if (this.repo_apis.length === 1 && !this.repo_apis[0].path && !this.repo_apis[0].desc) {
            this.repo_apis = apis;
          } else {
            this.repo_apis = [...this.repo_apis, ...apis];
          }
          this.toast.success(`Imported ${apis.length} APIs successfully`);
        } else {
          this.toast.warning('No APIs found in the collection');
        }

      } catch (err) {
        this.toast.error('Failed to parse the JSON file');
      }
    };
    reader.onerror = () => {
      this.toast.error('Failed to read the JSON file');
    };
    reader.readAsText(file);
    
    // Clear the input so the same file can be selected again if needed
    const target = event.target as HTMLInputElement;
    if (target) target.value = '';
  }

  loadRepoData(id: number) {
    this.repoService.getRepositoryById(id, this.selectedBranchId || undefined).subscribe({
      next: (res: any) => {
        const repo = res.data || res;
        
        // Generate sanitized whiteboard URL
        const rawUrl = `${CONFIG.BASE_URL.replace('/api', '')}/whiteboard.html?repo_id=${id}&token=${localStorage.getItem('token')}&theme=${this.themeService.isDarkMode ? 'dark' : 'light'}`;
        this.whiteboardUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);

        this.repo_name = repo.repo_name || '';
        this.repo_github_url = repo.repo_github_url || '';
        this.repo_status = repo.repo_status || 'Development Env';
        // Add status to list if it's custom
        if (this.repo_status && !this.statusOptions.some(s => s.name === this.repo_status)) {
          this.statusOptions.push({ id: Date.now(), name: this.repo_status });
        }
        this.repo_branch = repo.repo_branch || '';
        if (this.repo_branch && !this.branchOptions.some(b => b.name === this.repo_branch)) {
          this.branchOptions.push({ id: Date.now(), name: this.repo_branch });
        }
        
        this.repo_arch = repo.repo_arch || '';

        this.repo_schema = repo.repo_schema || '';
        this.repo_init_author = repo.repo_init_author || '';
        this.repo_init_date = repo.repo_init_date ? repo.repo_init_date.split('T')[0].split(' ')[0] : new Date().toISOString().split('T')[0];
        this.repo_deadline = repo.repo_deadline ? repo.repo_deadline.split('T')[0].split(' ')[0] : '';
        this.repo_code_snippets = repo.repo_code_snippets || [];
        if (this.repo_code_snippets.length === 0 && repo.repo_code_snippet) {
          this.repo_code_snippets = [{ title: 'Main Code Snippet', code: repo.repo_code_snippet }];
        }
        this.selectedSnippetIndex = 0;
        this.repo_getting_started = repo.repo_getting_started || '';
        this.repo_env = repo.repo_env || '';
        this.repo_deployment = repo.repo_deployment || '';
        this.repo_coding_standards = repo.repo_coding_standards || '';
        this.repo_architecture_diagram = repo.repo_architecture_diagram || '';

        // Handle array fields
        if (Array.isArray(repo.repo_apis)) {
          this.repo_apis = repo.repo_apis.map((api: any) => {
            const newApi = {
              method: api?.method || 'GET',
              path: api?.path || '',
              desc: api?.desc || '',
              headers: api?.headers || '',
              payload: api?.payload || '',
              response: api?.response || '',
              isHeadersRaw: false,
              parsedHeaders: []
            };
            this.initParsedHeaders(newApi);
            return newApi;
          });
        } else if (typeof repo.repo_apis === 'string' && repo.repo_apis.trim() !== '') {
          try {
            const parsed = JSON.parse(repo.repo_apis);
            if (Array.isArray(parsed)) {
              this.repo_apis = parsed.map(api => {
                const newApi = { ...api, isHeadersRaw: false, parsedHeaders: [] };
                this.initParsedHeaders(newApi);
                return newApi;
              });
            } else if (typeof parsed === 'object') {
              const newApi = { ...parsed, isHeadersRaw: false, parsedHeaders: [] };
              this.initParsedHeaders(newApi);
              this.repo_apis = [newApi];
            } else {
              this.repo_apis = [{ method: 'INFO', path: 'Raw Text', desc: repo.repo_apis, isHeadersRaw: false, parsedHeaders: [] }];
            }
          } catch {
            this.repo_apis = [{ method: 'INFO', path: 'Raw Text', desc: repo.repo_apis, isHeadersRaw: false, parsedHeaders: [] }];
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

        // Handle repo access
        let parsedAccess: any[] = [];
        if (Array.isArray(repo.repo_access)) {
          parsedAccess = repo.repo_access;
        } else if (typeof repo.repo_access === 'string' && repo.repo_access.trim() !== '') {
          try {
            parsedAccess = JSON.parse(repo.repo_access);
          } catch {
            parsedAccess = [];
          }
        }
        
        // Flatten pivot data if the backend uses Laravel Many-to-Many relationships
        this.repo_access = parsedAccess.map((access: any) => {
          const userObj = this.allUsers.find(u => (u.emp_id || u.id)?.toString() === (access.emp_id || access.id)?.toString());
          const isCreator = access.is_creator === true || access.pivot?.is_creator === true;
          return {
            ...access,
            role_id: access.pivot?.id || access.id || null,
            emp_id: (access.emp_id || access.id).toString(),
            name: access.name || access.emp_name || userObj?.emp_name || 'Unknown',
            emp_role: access.emp_role || userObj?.emp_role || 'dev',
            role_catagory: access.role_catagory || access.pivot?.role_catagory || null,
            can: access.role_name || access.can || access.role || access.repo_role || access.access_level || access.pivot?.can || access.pivot?.role || access.pivot?.role_name || '',
            permission: access.permission || access.pivot?.permission || ((access.emp_role === 'admin' || userObj?.emp_role === 'admin' || isCreator) ? 'EDIT' : 'VIEW')
          };
        });

        // Fetch exact roles from repo-roles table to ensure accurate role tracking in edit mode
        this.http.get(`${CONFIG.BASE_URL}/repo-roles`).subscribe({
          next: (roleRes: any) => {
            const data = Array.isArray(roleRes) ? roleRes : (roleRes.data || []);
            const currentRepoRoles = data.filter((r: any) => r.repo_id == id);
            
            // Map the actual assigned roles back into the UI state
            this.repo_access.forEach(access => {
              const matchedRole = currentRepoRoles.find((r: any) => r.emp_id == access.emp_id);
              if (matchedRole) {
                access.role_id = matchedRole.id;
                access.can = matchedRole.role_catagory === 'Permission' ? '' : matchedRole.role_name;
                access.role_catagory = matchedRole.role_catagory;
                access.permission = matchedRole.permission || 'VIEW';
              }
            });

            // Add any missing users that exist in repo-roles but not in the main repo_access array
            currentRepoRoles.forEach((role: any) => {
              if (!this.repo_access.some(a => a.emp_id == role.emp_id)) {
                const userObj = this.allUsers.find(u => u.emp_id == role.emp_id);
                this.repo_access.push({
                  emp_id: role.emp_id.toString(),
                  role_id: role.id,
                  can: role.role_catagory === 'Permission' ? '' : role.role_name,
                  role_catagory: role.role_catagory,
                  permission: role.permission || 'VIEW',
                  name: userObj?.emp_name || 'Unknown',
                  emp_role: userObj?.emp_role || 'dev'
                });
              }
            });
          }
        });

        // Handle repo maintainer
        this.repo_maintainer = repo.repo_maintainer ? repo.repo_maintainer.toString() : '';
      },
      error: () => {
        this.toast.error('Failed to load repository data.');
      }
    });
  }

  openManageModal(type: 'stack' | 'status' | 'arch' | 'branch') {
    this.managingType = type;
    this.showManageModal = true;
    this.newManageItemName = '';
  }

  closeManageModal() {
    this.showManageModal = false;
    this.managingType = null;
    this.newManageItemName = '';
  }

  confirmDeleteManageItem(item: any) {
    this.itemToDelete = item;
  }

  cancelDeleteManageItem() {
    this.itemToDelete = null;
  }

  executeDeleteManageItem() {
    if (!this.itemToDelete) return;
    const id = this.itemToDelete.id;
    
    if (this.managingType === 'status') {
      this.http.delete(`${CONFIG.BASE_URL}/repo-statuses/${id}`).subscribe({
        next: () => {
          this.toast.success('Status deleted successfully');
          this.itemToDelete = null;
          this.fetchStatuses();
        },
        error: (err) => this.showError(err)
      });
    } else if (this.managingType === 'stack') {
      this.http.delete(`${CONFIG.BASE_URL}/repo-stacks/${id}`).subscribe({
        next: () => {
          this.toast.success('Stack deleted successfully');
          this.itemToDelete = null;
          this.fetchStacks();
        },
        error: (err) => this.showError(err)
      });
    } else if (this.managingType === 'arch') {
      this.http.delete(`${CONFIG.BASE_URL}/repo-architectures/${id}`).subscribe({
        next: () => {
          this.toast.success('Architecture deleted successfully');
          this.itemToDelete = null;
          this.fetchArchitectures();
        },
        error: (err) => this.showError(err)
      });
    } else if (this.managingType === 'branch') {
      this.http.delete(`${CONFIG.BASE_URL}/branches/${id}`).subscribe({
        next: () => {
          this.toast.success('Branch deleted successfully');
          this.itemToDelete = null;
          this.fetchBranches();
        },
        error: (err) => this.showError(err)
      });
    }
  }

  saveManageItem() {
    if (!this.newManageItemName.trim()) return;
    const name = this.newManageItemName.trim();
    
    if (this.managingType === 'status') {
      const payload: any = {
        repo_status_name: name
      };
      
      this.http.post(`${CONFIG.BASE_URL}/repo-statuses`, payload).subscribe({
        next: () => {
          this.toast.success('Status added successfully');
          this.newManageItemName = '';
          this.fetchStatuses(); // Refresh from DB
        },
        error: (err) => this.showError(err)
      });
    } else if (this.managingType === 'stack') {
      const payload: any = {
        repo_stack_name: name
      };
      
      this.http.post(`${CONFIG.BASE_URL}/repo-stacks`, payload).subscribe({
        next: () => {
          this.toast.success('Stack added successfully');
          this.newManageItemName = '';
          this.fetchStacks();
        },
        error: (err) => this.showError(err)
      });
    } else if (this.managingType === 'arch') {
      const payload: any = {
        repo_arch_name: name
      };
      
      this.http.post(`${CONFIG.BASE_URL}/repo-architectures`, payload).subscribe({
        next: () => {
          this.toast.success('Architecture added successfully');
          this.newManageItemName = '';
          this.fetchArchitectures(); // Refresh from DB
        },
        error: (err) => this.showError(err)
      });
    } else if (this.managingType === 'branch') {
      const payload: any = {
        repository_id: this.repoId || 1, // Fallback to 1 if creating new
        repo_branch_name: name,
        repo_branch_initer: localStorage.getItem('emp_id') || 260623102611,
        repo_branch_desc: 'Added from UI',
        repo_branch_commit: 0
      };
      
      this.http.post(`${CONFIG.BASE_URL}/branches`, payload).subscribe({
        next: () => {
          this.toast.success('Branch added successfully');
          this.newManageItemName = '';
          this.fetchBranches();
        },
        error: (err) => this.showError(err)
      });
    }
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

  private textToArray(text: string): string[] {
    if (!text) return [];
    return text.split('\n').map(s => s.trim()).filter(s => s !== '');
  }

  addApiRow() {
    this.repo_apis.push({ 
      method: 'GET', 
      path: '', 
      desc: '', 
      payload: '', 
      response: '', 
      headers: '', 
      isHeadersRaw: false, 
      parsedHeaders: [{ active: true, key: '', value: '' }] 
    });
  }

  removeApiRow(index: number) {
    this.repo_apis.splice(index, 1);
  }

  // Header Parsing Helpers
  initParsedHeaders(api: any) {
    if (!api.headers) {
      api.parsedHeaders = [{ active: true, key: '', value: '' }];
      return;
    }
    const lines = api.headers.split(/\r?\n/);
    api.parsedHeaders = lines.map((line: string) => {
      const active = !line.startsWith('~');
      const cleanLine = active ? line : line.substring(1);
      const colonIdx = cleanLine.indexOf(':');
      if (colonIdx === -1) return { active, key: cleanLine.trim(), value: '' };
      return {
        active,
        key: cleanLine.substring(0, colonIdx).trim(),
        value: cleanLine.substring(colonIdx + 1).trim()
      };
    }).filter((h: any) => h.key || h.value);
    
    if (api.parsedHeaders.length === 0) {
      api.parsedHeaders.push({ active: true, key: '', value: '' });
    }
  }

  syncParsedHeadersToRaw(api: any) {
    if (!api.parsedHeaders) return;
    const lines = api.parsedHeaders
      .filter((h: any) => h.key || h.value)
      .map((h: any) => {
        const prefix = h.active ? '' : '~';
        return `${prefix}${h.key}: ${h.value}`;
      });
    api.headers = lines.join('\n');
  }

  syncRawToParsedHeaders(api: any) {
    this.initParsedHeaders(api);
  }

  toggleHeadersRaw(api: any) {
    if (api.isHeadersRaw) {
      // Switching to RAW: sync the parsed array back to raw string
      this.syncParsedHeadersToRaw(api);
    } else {
      // Switching to FORM: parse the raw string back to array
      this.syncRawToParsedHeaders(api);
    }
  }

  addParsedHeaderRow(api: any) {
    api.parsedHeaders.push({ active: true, key: '', value: '' });
    this.syncParsedHeadersToRaw(api);
  }

  removeParsedHeaderRow(api: any, index: number) {
    api.parsedHeaders.splice(index, 1);
    if (api.parsedHeaders.length === 0) {
      api.parsedHeaders.push({ active: true, key: '', value: '' });
    }
    this.syncParsedHeadersToRaw(api);
  }

  addAccessUser(event: any) {
    const val = event.target.value;
    if (!val) return;
    
    const user = this.allUsers.find(u => (u.emp_id || u.id)?.toString() === val);
    if (user && !this.repo_access.some(a => a.emp_id === (user.emp_id || user.id)?.toString())) {
      this.repo_access.push({
        emp_id: (user.emp_id || user.id).toString(),
        name: user.emp_name || user.name || 'Unknown User',
        can: '', // default empty so they select a role
        permission: user.emp_role === 'admin' ? 'EDIT' : 'VIEW', // admins get EDIT, devs default to VIEW
        emp_role: user.emp_role || 'dev',
        role_id: null
      });
    }
    event.target.value = '';
  }

  removeAccessUser(index: number) {
    const removed = this.repo_access[index];
    if (removed && removed.role_id) {
      this.deletedRoles.push(removed.role_id);
    }
    this.repo_access.splice(index, 1);
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
      repo_github_url: this.repo_github_url,
      repo_stack: this.repo_stack,
      repo_status: this.repo_status,
      repo_branch: this.repo_branch,
      repo_arch: this.repo_arch,
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
      repo_architecture_diagram: this.repo_architecture_diagram,
      repo_access: this.repo_access.map((a: any) => {
        let category = a.role_catagory || '';
        let roleName = a.can || '';
        if (!roleName) {
          category = 'Permission';
          roleName = a.permission === 'EDIT' ? 'Editor' : 'Viewer';
        } else {
          for (const group of this.roleOptions) {
            if (group.roles.includes(roleName)) {
              category = group.category;
              break;
            }
          }
          if (!category) {
            category = 'Management';
          }
        }
        return {
          emp_id: a.emp_id,
          role_catagory: category,
          role_name: roleName,
          permission: a.permission || 'VIEW'
        };
      }),
      repo_maintainer: this.repo_maintainer || null
    };

    payload.repo_code_snippets = this.repo_code_snippets;

    this.http.post(`${CONFIG.BASE_URL}/repositories`, payload).subscribe({
      next: (res: any) => {
        const newRepoId = res.data?.id || res.id;
        if (newRepoId) {
          this.uploadStagedFilesAndAssignRoles(newRepoId);
        } else {
          this.isSubmitting = false;
          this.toast.error('Failed to resolve new repository ID.');
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showError(err);
      }
    });
  }

  uploadStagedFilesAndAssignRoles(newRepoId: number) {
    const fileUploadRequests = this.stagedFiles.map(sf => {
      const formData = new FormData();
      formData.append('file', sf.file);
      formData.append('file_name', sf.name);
      formData.append('file_description', sf.desc);
      return this.http.post(`${CONFIG.BASE_URL}/repositories/${newRepoId}/files`, formData);
    });

    const roleRequests = this.repo_access.map((a: any) => {
      let category = a.role_catagory || '';
      let roleName = a.can || '';
      if (!roleName) {
        category = 'Permission';
        roleName = a.permission === 'EDIT' ? 'Editor' : 'Viewer';
      } else {
        for (const group of this.roleOptions) {
          if (group.roles.includes(roleName)) {
            category = group.category;
            break;
          }
        }
        if (!category) {
          category = 'Management';
        }
      }
      return this.http.post(`${CONFIG.BASE_URL}/repo-roles`, {
        emp_id: a.emp_id,
        repo_id: newRepoId,
        branch_id: null,
        role_catagory: category,
        role_name: roleName,
        permission: a.permission || 'VIEW'
      });
    });

    const allRequests = [...fileUploadRequests, ...roleRequests];

    if (allRequests.length > 0) {
      forkJoin(allRequests).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toast.success('Repository created, roles assigned, and files uploaded!');
          this.repoService.clearCache();
          this.router.navigate(['/admin/repositories']);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.showError(err);
        }
      });
    } else {
      this.isSubmitting = false;
      this.toast.success('Repository created successfully!');
      this.repoService.clearCache();
      this.router.navigate(['/admin/repositories']);
    }
  }

  fetchExistingFiles(id: number) {
    this.http.get(`${CONFIG.BASE_URL}/repositories/${id}/files`).subscribe({
      next: (res: any) => {
        this.existingFiles = res.data || [];
      },
      error: (err) => {
        console.error('Failed to fetch existing files', err);
      }
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFileToUpload = file;
      if (!this.newFileName.trim()) {
        const dotIndex = file.name.lastIndexOf('.');
        this.newFileName = dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name;
      }
    }
  }

  stageFile() {
    if (!this.selectedFileToUpload || !this.newFileName.trim()) {
      this.toast.warning('Please select a file and enter a name.');
      return;
    }
    this.stagedFiles.push({
      file: this.selectedFileToUpload,
      name: this.newFileName.trim(),
      desc: this.newFileDesc.trim()
    });
    this.newFileName = '';
    this.newFileDesc = '';
    this.selectedFileToUpload = null;
    const fileInput = document.getElementById('createRepoFileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    this.toast.success('File staged for upload!');
  }

  unstageFile(index: number) {
    this.stagedFiles.splice(index, 1);
    this.toast.success('File removed from staged list.');
  }

  uploadFileDirectly() {
    if (!this.repoId || !this.selectedFileToUpload || !this.newFileName.trim()) {
      this.toast.warning('Please select a file and enter a name.');
      return;
    }

    this.isUploadingFile = true;
    const formData = new FormData();
    formData.append('file', this.selectedFileToUpload);
    formData.append('file_name', this.newFileName.trim());
    formData.append('file_description', this.newFileDesc.trim());

    this.http.post(`${CONFIG.BASE_URL}/repositories/${this.repoId}/files`, formData).subscribe({
      next: (res: any) => {
        this.isUploadingFile = false;
        this.toast.success('File uploaded successfully!');
        this.newFileName = '';
        this.newFileDesc = '';
        this.selectedFileToUpload = null;
        const fileInput = document.getElementById('createRepoFileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        this.fetchExistingFiles(this.repoId!);
      },
      error: (err) => {
        this.isUploadingFile = false;
        this.showError(err);
      }
    });
  }

  deleteExistingFile(fileId: number) {
    if (!confirm('Are you sure you want to delete this file?')) return;

    this.http.delete(`${CONFIG.BASE_URL}/repo-files/${fileId}`).subscribe({
      next: () => {
        this.toast.success('File deleted successfully!');
        if (this.repoId) this.fetchExistingFiles(this.repoId);
      },
      error: (err) => {
        console.error('Failed to delete file', err);
        this.toast.error(err.error?.message || 'Failed to delete file.');
      }
    });
  }

  updateRepo() {
    let activeBranchId = this.selectedBranchId;
    if (this.branchOptions && this.branchOptions.length > 0) {
      const found = this.branchOptions.find(b => b.name === this.repo_branch);
      if (found) {
        activeBranchId = typeof found.id === 'string' ? parseInt(found.id, 10) : found.id;
      }
    }

    const payload: any = {
      emp_id: this.getEmpId(),
      branch_id: activeBranchId,
      repo_name: this.repo_name,
      repo_github_url: this.repo_github_url,
      repo_stack: this.repo_stack,
      repo_status: this.repo_status,
      repo_branch: this.repo_branch,
      repo_arch: this.repo_arch,
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
      repo_architecture_diagram: this.repo_architecture_diagram,
      repo_access: this.repo_access.map((a: any) => {
        let category = a.role_catagory || '';
        let roleName = a.can || '';
        if (!roleName) {
          category = 'Permission';
          roleName = a.permission === 'EDIT' ? 'Editor' : 'Viewer';
        } else {
          for (const group of this.roleOptions) {
            if (group.roles.includes(roleName)) {
              category = group.category;
              break;
            }
          }
          if (!category) {
            category = 'Management';
          }
        }
        return {
          emp_id: a.emp_id,
          role_catagory: category,
          role_name: roleName,
          permission: a.permission || 'VIEW'
        };
      }),
      repo_maintainer: this.repo_maintainer || null
    };

    payload.repo_code_snippets = this.repo_code_snippets;

    this.http.put(`${CONFIG.BASE_URL}/repositories/${this.repoId}`, payload).subscribe({
      next: () => {
        const requests: any[] = [];
        
        // Add delete requests for removed roles
        this.deletedRoles.forEach(roleId => {
          requests.push(this.http.delete(`${CONFIG.BASE_URL}/repo-roles/${roleId}`));
        });

        if (this.repo_access.length > 0) {
          const updateRequests = this.repo_access.map((a: any) => {
            let category = a.role_catagory || '';
            let roleName = a.can || '';
            if (!roleName) {
              category = 'Permission';
              roleName = a.permission === 'EDIT' ? 'Editor' : 'Viewer';
            } else {
              for (const group of this.roleOptions) {
                if (group.roles.includes(roleName)) {
                  category = group.category;
                  break;
                }
              }
              if (!category) {
                category = 'Management';
              }
            }
            if (a.role_id) {
              return this.http.put(`${CONFIG.BASE_URL}/repo-roles/${a.role_id}`, {
                role_catagory: category,
                role_name: roleName,
                branch_id: null,
                permission: a.permission || 'VIEW'
              });
            } else {
              return this.http.post(`${CONFIG.BASE_URL}/repo-roles`, {
                emp_id: a.emp_id,
                repo_id: this.repoId,
                branch_id: null,
                role_catagory: category,
                role_name: roleName,
                permission: a.permission || 'VIEW'
              });
            }
          });
          requests.push(...updateRequests);
        }

        if (requests.length > 0) {
          forkJoin(requests).subscribe({
            next: () => {
              this.isSubmitting = false;
              this.toast.success('Repository and roles updated successfully!');
              this.repoService.clearCache();
              this.router.navigate(['/admin/repositories', this.repoId]);
            },
            error: (err) => {
              this.isSubmitting = false;
              this.showError(err);
            }
          });
        } else {
          this.isSubmitting = false;
          this.toast.success('Repository updated successfully!');
          this.repoService.clearCache();
          this.router.navigate(['/admin/repositories', this.repoId]);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showError(err);
      }
    });
  }

  downloadEnvFile() {
    if (!this.repo_env || !this.repo_env.trim()) {
      this.toast.warning('No environment variables to download.');
      return;
    }
    const blob = new Blob([this.repo_env], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '.env';
    link.click();
    window.URL.revokeObjectURL(url);
    this.toast.success('.env file downloaded successfully');
  }

  downloadSqlFile() {
    if (!this.repo_schema || !this.repo_schema.trim()) {
      this.toast.warning('No database schema to download.');
      return;
    }
    const blob = new Blob([this.repo_schema], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema.sql';
    link.click();
    window.URL.revokeObjectURL(url);
    this.toast.success('Database schema (.sql) downloaded successfully');
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
    this.toast.error(errorMsg);
  }

  addSnippet() {
    this.repo_code_snippets.push({
      title: 'New Snippet ' + (this.repo_code_snippets.length + 1),
      code: '// Enter code here...'
    });
    this.selectedSnippetIndex = this.repo_code_snippets.length - 1;
  }

  deleteSnippet(index: number) {
    this.repo_code_snippets.splice(index, 1);
    if (this.selectedSnippetIndex >= this.repo_code_snippets.length) {
      this.selectedSnippetIndex = this.repo_code_snippets.length - 1;
    }
  }

  getSelectedSnippetCode(): string {
    if (this.selectedSnippetIndex >= 0 && this.selectedSnippetIndex < this.repo_code_snippets.length) {
      return this.repo_code_snippets[this.selectedSnippetIndex].code;
    }
    return '';
  }

  setSelectedSnippetCode(code: string) {
    if (this.selectedSnippetIndex >= 0 && this.selectedSnippetIndex < this.repo_code_snippets.length) {
      this.repo_code_snippets[this.selectedSnippetIndex].code = code;
    }
  }
}
