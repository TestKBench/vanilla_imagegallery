/**
 * Theme Switcher for Image Gallery
 * Handles theme selection and persistence via localStorage
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
        
        // Bind change event to theme selector
        if (this.themeSelect) {
            this.themeSelect.addEventListener('change', (e) => {
                this.setTheme(e.target.value);
            });
        }
    }
    
    /**
     * Load theme from localStorage and apply it
     */
    loadSavedTheme() {
        const savedTheme = localStorage.getItem(this.storageKey) || 'default';
        this.setTheme(savedTheme, false);
        
        // Update the select dropdown to reflect current theme
        if (this.themeSelect) {
            this.themeSelect.value = savedTheme;
        }
    }
    
    /**
     * Set the theme on the document
     * @param {string} theme - Theme identifier ('default' or 'pink-red')
     * @param {boolean} save - Whether to save the theme to localStorage
     */
    setTheme(theme, save = true) {
        if (theme === 'default') {
            // Remove the data-theme attribute for default theme
            document.body.removeAttribute('data-theme');
        } else {
            // Set the data-theme attribute for other themes
            document.body.setAttribute('data-theme', theme);
        }
        
        // Save theme preference to localStorage
        if (save) {
            localStorage.setItem(this.storageKey, theme);
        }
    }
    
    /**
     * Get the current active theme
     * @returns {string} Current theme identifier
     */
    getCurrentTheme() {
        return document.body.getAttribute('data-theme') || 'default';
    }
}

// Initialize theme switcher when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.themeSwitcher = new ThemeSwitcher();
});
