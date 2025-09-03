import { configManager } from './configuration-manager.js';

class AuthManager {
    constructor() {
        this.auth0Client = null;
        this.isInitialized = false;
        this.user = null;
    }

    async initialize() {
        try {
            const config = configManager.getConfig();
            
            // Check if Auth0 configuration is available
            if (!config.auth0Domain || !config.auth0ClientId) {
                console.warn('Auth0 configuration not found. Running in demo mode.');
                this.isInitialized = true;
                return;
            }

            // In a real implementation, you would initialize Auth0 here
            // For now, we'll simulate initialization
            console.log('Auth0 initialized in demo mode');
            this.isInitialized = true;
        } catch (error) {
            console.error('Error initializing Auth0:', error);
            this.isInitialized = true; // Continue in demo mode
        }
    }

    isAuthenticated() {
        // In demo mode, return false
        return false;
    }

    async login() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        // Demo mode - simulate login
        console.log('Login attempted in demo mode');
        return { success: false, message: 'Demo mode - login not available' };
    }

    async logout() {
        // Demo mode - simulate logout
        console.log('Logout attempted in demo mode');
        this.user = null;
    }

    getUser() {
        return this.user;
    }

    async getToken() {
        // Demo mode - return null
        return null;
    }
}

// Create singleton instance
const authManager = new AuthManager();

export { authManager };
export default authManager;