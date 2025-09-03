import { configManager } from './configuration-manager.js';

class DatabaseManager {
    constructor() {
        this.isConnected = false;
        this.connection = null;
    }

    async initialize() {
        try {
            const config = configManager.getConfig();
            
            // Check if database configuration is available
            if (!config.databaseUrl) {
                console.warn('Database configuration not found. Running with local storage fallback.');
                this.isConnected = true;
                return;
            }

            // In a real implementation, you would connect to the database here
            // For now, we'll simulate connection
            console.log('Database initialized with local storage fallback');
            this.isConnected = true;
        } catch (error) {
            console.error('Error initializing database:', error);
            this.isConnected = true; // Continue with fallback
        }
    }

    isReady() {
        return this.isConnected;
    }

    async saveUserProgress(userId, lessonId, progress) {
        if (!this.isReady()) {
            await this.initialize();
        }
        
        try {
            // Use localStorage as fallback
            const key = `progress_${userId}_${lessonId}`;
            localStorage.setItem(key, JSON.stringify(progress));
            return { success: true };
        } catch (error) {
            console.error('Error saving progress:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserProgress(userId, lessonId) {
        if (!this.isReady()) {
            await this.initialize();
        }
        
        try {
            const key = `progress_${userId}_${lessonId}`;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting progress:', error);
            return null;
        }
    }

    async saveUserProfile(userId, profile) {
        if (!this.isReady()) {
            await this.initialize();
        }
        
        try {
            const key = `profile_${userId}`;
            localStorage.setItem(key, JSON.stringify(profile));
            return { success: true };
        } catch (error) {
            console.error('Error saving profile:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserProfile(userId) {
        if (!this.isReady()) {
            await this.initialize();
        }
        
        try {
            const key = `profile_${userId}`;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting profile:', error);
            return null;
        }
    }
}

// Create singleton instance
const databaseManager = new DatabaseManager();

export { databaseManager };
export default databaseManager;