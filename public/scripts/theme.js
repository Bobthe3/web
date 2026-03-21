class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem('theme') || 'dark';
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.createToggleButton();
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    localStorage.setItem('theme', theme);
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    this.updateToggleButton();
  }

  createToggleButton() {
    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle';
    toggle.innerHTML = this.currentTheme === 'dark' ? '☀️ Light' : '🌙 Dark';
    toggle.addEventListener('click', () => this.toggleTheme());
    document.body.appendChild(toggle);
    this.toggleButton = toggle;
  }

  updateToggleButton() {
    if (this.toggleButton) {
      this.toggleButton.innerHTML = this.currentTheme === 'dark' ? '☀️ Light' : '🌙 Dark';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ThemeManager();
});
