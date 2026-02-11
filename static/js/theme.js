/**
 * Theme Manager for Image Gallery
 * Handles theme switching and persistence using localStorage
 */
class ThemeManager {
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
            this.themeSelect.addEventListener('change', (e) => this.setTheme(e.target.value));
        }
    }
    
    /**
     * Load the saved theme from localStorage and apply it
     */
    loadSavedTheme() {
        const savedTheme = localStorage.getItem(this.storageKey) || '';
        this.applyTheme(savedTheme);
        
        // Update the select dropdown to match the saved theme
        if (this.themeSelect) {
            this.themeSelect.value = savedTheme;
        }
    }
    
    /**
     * Set and save a new theme
     * @param {string} themeName - The theme class name (e.g., 'theme-pink-red' or '' for default)
     */
    setTheme(themeName) {
        this.applyTheme(themeName);
        this.saveTheme(themeName);
    }
    
    /**
     * Apply a theme to the document body
     * @param {string} themeName - The theme class name
     */
    applyTheme(themeName) {
        // Remove all theme classes first
        document.body.classList.remove('theme-pink-red');
        
        // Add the new theme class if specified
        if (themeName) {
            document.body.classList.add(themeName);
        }
    }
    
    /**
     * Save the theme preference to localStorage
     * @param {string} themeName - The theme class name
     */
    saveTheme(themeName) {
        localStorage.setItem(this.storageKey, themeName);
    }
    
    /**
     * Get the current theme
     * @returns {string} The current theme class name
     */
    getCurrentTheme() {
        return localStorage.getItem(this.storageKey) || '';
    }
}

// Initialize the theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});
