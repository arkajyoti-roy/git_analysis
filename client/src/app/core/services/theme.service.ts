import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  isDarkMode = false;

  constructor() {
    this.initTheme();
  }

  private initTheme() {
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    
    if (savedTheme === 'dark') {
      this.setTheme(true);
    } else {
      // Default to light mode for the first time
      this.setTheme(false);
    }
  }

  toggleTheme() {
    this.setTheme(!this.isDarkMode);
  }

  private setTheme(isDark: boolean) {
    this.isDarkMode = isDark;
    
    if (this.isDarkMode) {
      document.body.setAttribute('data-theme', 'dark');
      localStorage.setItem(this.THEME_KEY, 'dark');
    } else {
      document.body.removeAttribute('data-theme');
      localStorage.setItem(this.THEME_KEY, 'light');
    }
  }
}
