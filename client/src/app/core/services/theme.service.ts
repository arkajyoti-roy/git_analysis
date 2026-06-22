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
    } else if (savedTheme === 'light') {
      this.setTheme(false);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark);
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
