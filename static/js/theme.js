/**
 * Theme Manager for Image Gallery
 * Handles theme switching and persistence using localStorage
 */
class ThemeManager {
    constructor() {
        this.themeSelect = document.getElementById('themeSelect');
        this.body = document.body;
        this.storageKey = 'gallery-theme';
        
        this.init();
    }
    
    init() {
        // Load saved theme on page load
        this.loadSavedTheme();
        
        // Bind theme change event
        if (this.themeSelect) {
            this.themeSelect.addEventListener('change', (e) => {
                this.setTheme(e.target.value);
            });
        }
    }
    
    /**
     * Load the saved theme from localStorage
     */
    loadSavedTheme() {
        const savedTheme = localStorage.getItem(this.storageKey) || 'default';
        this.setTheme(savedTheme, false);
        
        // Update the select element to reflect the current theme
        if (this.themeSelect) {
            this.themeSelect.value = savedTheme;
        }
    }
    
    /**
     * Set the active theme
     * @param {string} themeName - The name of the theme to apply
     * @param {boolean} save - Whether to save the theme to localStorage (default: true)
     */
    setTheme(themeName, save = true) {
        // Remove all theme classes
        this.body.classList.remove('theme-pink-red');
        
        // Apply the selected theme
        switch (themeName) {
            case 'pink-red':
                this.body.classList.add('theme-pink-red');
                break;
            case 'default':
            default:
                // Default theme uses :root variables, no class needed
                break;
        }
        
        // Save preference to localStorage
        if (save) {
            localStorage.setItem(this.storageKey, themeName);
        }
    }
    
    /**
     * Get the currently active theme
     * @returns {string} The current theme name
     */
    getCurrentTheme() {
        return localStorage.getItem(this.storageKey) || 'default';
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});
