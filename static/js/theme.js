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
            this.themeSelect.addEventListener('change', (e) => {
                this.setTheme(e.target.value);
            });
        }
    }
    
    /**
     * Load the saved theme from localStorage and apply it
     */
    loadSavedTheme() {
        const savedTheme = localStorage.getItem(this.storageKey) || 'default';
        this.setTheme(savedTheme, false);
        
        // Update select element to match saved theme
        if (this.themeSelect) {
            this.themeSelect.value = savedTheme;
        }
    }
    
    /**
     * Set the theme on the body element
     * @param {string} themeName - The theme name ('default' or 'pink-red')
     * @param {boolean} save - Whether to save the theme to localStorage (default: true)
     */
    setTheme(themeName, save = true) {
        // Remove all theme classes from body
        document.body.classList.remove('theme-pink-red');
        
        // Apply the selected theme
        if (themeName === 'pink-red') {
            document.body.classList.add('theme-pink-red');
        }
        
        // Save to localStorage
        if (save) {
            localStorage.setItem(this.storageKey, themeName);
        }
    }
    
    /**
     * Get the current theme name
     * @returns {string} The current theme name
     */
    getCurrentTheme() {
        return localStorage.getItem(this.storageKey) || 'default';
    }
}

// Initialize Theme Manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

// Apply theme immediately to prevent flash of wrong theme
(function() {
    const savedTheme = localStorage.getItem('gallery-theme');
    if (savedTheme === 'pink-red') {
        document.body.classList.add('theme-pink-red');
    }
})();
