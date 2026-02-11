/**
 * Theme Switcher for Image Gallery
 * Handles theme selection and persistence using localStorage
 */

class ThemeSwitcher {
    constructor() {
        this.themeSelect = document.getElementById('themeSelect');
        this.storageKey = 'gallery-theme';
        
        this.init();
    }
    
    init() {
        // Load saved theme on page load
        this.loadSavedTheme();
        
        // Bind theme change event
        if (this.themeSelect) {
            this.themeSelect.addEventListener('change', (e) => {
                this.applyTheme(e.target.value);
                this.saveTheme(e.target.value);
            });
        }
    }
    
    /**
     * Load and apply the saved theme from localStorage
     */
    loadSavedTheme() {
        const savedTheme = localStorage.getItem(this.storageKey);
        
        if (savedTheme) {
            this.applyTheme(savedTheme);
            
            // Update the select dropdown to reflect saved theme
            if (this.themeSelect) {
                this.themeSelect.value = savedTheme;
            }
        }
    }
    
    /**
     * Apply a theme to the document body
     * @param {string} themeName - The theme class name or 'default'
     */
    applyTheme(themeName) {
        // Remove all theme classes first
        document.body.classList.remove('theme-pink-red');
        
        // Apply new theme if not default
        if (themeName && themeName !== 'default') {
            document.body.classList.add(themeName);
        }
    }
    
    /**
     * Save the theme selection to localStorage
     * @param {string} themeName - The theme to save
     */
    saveTheme(themeName) {
        localStorage.setItem(this.storageKey, themeName);
    }
    
    /**
     * Get the currently active theme
     * @returns {string} The current theme name
     */
    getCurrentTheme() {
        return localStorage.getItem(this.storageKey) || 'default';
    }
}

// Initialize theme switcher when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeSwitcher = new ThemeSwitcher();
});
