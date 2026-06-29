const fs = require('fs');
const path = require('path');

const tsPath = path.join(__dirname, 'src/app/features/repositories/create/create.ts');
let tsContent = fs.readFileSync(tsPath, 'utf8');

if (!tsContent.includes("activeTab = 'basic';")) {
  tsContent = tsContent.replace('isSubmitting = false;', "activeTab = 'basic';\n  isSubmitting = false;");
  fs.writeFileSync(tsPath, tsContent);
}

const htmlPath = path.join(__dirname, 'src/app/features/repositories/create/create.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// 1. Add Tabs Header
const tabsHeader = `
  <div style="display: flex; gap: 1rem; border-bottom: 1px solid var(--border-color); margin-bottom: 2rem; padding-bottom: 0.5rem; overflow-x: auto;">
    <button type="button" 
      [style.border-bottom]="activeTab === 'basic' ? '2px solid var(--primary-color)' : '2px solid transparent'"
      [style.color]="activeTab === 'basic' ? 'var(--text-main)' : 'var(--text-muted)'"
      style="background: transparent; border: none; border-bottom: 2px solid transparent; font-weight: 500; font-size: 1rem; cursor: pointer; padding: 0.5rem 0.5rem; white-space: nowrap; transition: 0.2s;"
      (click)="activeTab = 'basic'">
      Basic Info
    </button>
    <button type="button" 
      [style.border-bottom]="activeTab === 'env' ? '2px solid var(--primary-color)' : '2px solid transparent'"
      [style.color]="activeTab === 'env' ? 'var(--text-main)' : 'var(--text-muted)'"
      style="background: transparent; border: none; border-bottom: 2px solid transparent; font-weight: 500; font-size: 1rem; cursor: pointer; padding: 0.5rem 0.5rem; white-space: nowrap; transition: 0.2s;"
      (click)="activeTab = 'env'">
      Env & Docs
    </button>
    <button type="button" 
      [style.border-bottom]="activeTab === 'api' ? '2px solid var(--primary-color)' : '2px solid transparent'"
      [style.color]="activeTab === 'api' ? 'var(--text-main)' : 'var(--text-muted)'"
      style="background: transparent; border: none; border-bottom: 2px solid transparent; font-weight: 500; font-size: 1rem; cursor: pointer; padding: 0.5rem 0.5rem; white-space: nowrap; transition: 0.2s;"
      (click)="activeTab = 'api'">
      DB & APIs
    </button>
    <button type="button" 
      [style.border-bottom]="activeTab === 'access' ? '2px solid var(--primary-color)' : '2px solid transparent'"
      [style.color]="activeTab === 'access' ? 'var(--text-main)' : 'var(--text-muted)'"
      style="background: transparent; border: none; border-bottom: 2px solid transparent; font-weight: 500; font-size: 1rem; cursor: pointer; padding: 0.5rem 0.5rem; white-space: nowrap; transition: 0.2s;"
      (click)="activeTab = 'access'">
      Access Control
    </button>
  </div>
`;

if (!htmlContent.includes("activeTab = 'basic'")) {
  htmlContent = htmlContent.replace('<div class="form-card">\n', '<div class="form-card">\n' + tabsHeader + '\n');
}

// 2. Replace @if (activeStep === X) with activeTab
htmlContent = htmlContent.replace(/@if\s*\(\s*activeStep\s*===\s*1\s*\)/g, "@if (activeTab === 'basic')");
htmlContent = htmlContent.replace(/@if\s*\(\s*activeStep\s*===\s*2\s*\)/g, "@if (activeTab === 'env')");
htmlContent = htmlContent.replace(/@if\s*\(\s*activeStep\s*===\s*3\s*\)/g, "@if (activeTab === 'api')");
htmlContent = htmlContent.replace(/@if\s*\(\s*activeStep\s*===\s*4\s*\)/g, "@if (activeTab === 'access')");

// 3. Replace the pagination footer with a fixed footer
const footerRegex = /<div style="margin-top: 3rem; display: flex; flex-direction: column; align-items: center; gap: 1rem;">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const newFooter = `
  <div class="form-actions" style="margin-top: 2rem; display: flex; justify-content: flex-start; gap: 15px; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
    <button type="button" class="btn-secondary" routerLink="/admin/repositories">Cancel</button>
    <button type="button" class="btn-primary" (click)="submitRepo()" [disabled]="isSubmitting">
      {{ isSubmitting ? 'Saving...' : (isEditMode ? 'Update Repository' : 'Create Repository') }}
    </button>
  </div>
`;

if (footerRegex.test(htmlContent)) {
  htmlContent = htmlContent.replace(footerRegex, newFooter);
}

fs.writeFileSync(htmlPath, htmlContent);
console.log("Tab style successfully applied!");
