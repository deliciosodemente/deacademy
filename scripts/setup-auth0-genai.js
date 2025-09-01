/**
 * Auth0 GenAI Integration Setup Script
 * Optimized for seamless AI agent authentication
 */

import { auth0Manager } from '../lib/auth0-manager.js';
import { apiConfig } from '../lib/api-config.js';

export class Auth0GenAISetup {
    constructor() {
        this.config = null;
        this.isInitialized = false;
    }

    /**
     * Initialize Auth0 with GenAI optimizations
     */
    async initialize(config = {}) {
        try {
            console.log('🤖 Setting up Auth0 for GenAI integration...');

            // Enhanced config for AI agents
            this.config = {
                domain: config.domain || process.env.AUTH0_DOMAIN,
                clientId: config.clientId || process.env.AUTH0_CLIENT_ID,
                audience: config.audience || process.env.AUTH0_AUDIENCE || 'https://denglishacademy.com/api',
                scope: 'openid profile email read:user_metadata update:user_metadata offline_access',

                // GenAI specific configurations
                useRefreshTokens: true,
                cacheLocation: 'localstorage',

                // AI agent authentication settings
                agentSettings: {
                    enableContextualAuth: true,
                    autoRefreshTokens: true,
                    persistUserContext: true,
                    enableRoleBasedAccess: true
                },

                ...config
            };

            // Initialize Auth0Manager with GenAI enhancements
            await auth0Manager.initializeAuth0Client(this.config);

            // Setup AI-specific authentication flows
            await this.setupAIAuthenticationFlows();

            // Setup contextual user data for AI
            await this.setupAIUserContext();

            this.isInitialized = true;
            console.log('✅ Auth0 GenAI integration initialized successfully');

            return this;

        } catch (error) {
            console.error('❌ Auth0 GenAI setup failed:', error);
            throw error;
        }
    }

    /**
     * Setup AI-specific authentication flows
     */
    async setupAIAuthenticationFlows() {
        // Enhanced login for AI context
        window.loginForAI = async (aiContext = {}) => {
            try {
                const loginOptions = {
                    authorizationParams: {
                        // Pass AI context as custom parameters
                        ai_session_id: aiContext.sessionId || this.generateSessionId(),
                        ai_intent: aiContext.intent || 'general',
                        ai_user_level: aiContext.userLevel || 'beginner'
                    }
                };

                await auth0Manager.loginWithRedirect(loginOptions);
            } catch (error) {
                console.error('AI-enhanced login failed:', error);
                throw error;
            }
        };

        // Silent authentication for AI agents
        window.authenticateAIAgent = async () => {
            try {
                if (!auth0Manager.isUserAuthenticated()) {
                    return null;
                }

                const token = await auth0Manager.getAccessToken({
                    audience: this.config.audience,
                    scope: 'read:ai_context write:ai_context'
                });

                return {
                    token,
                    user: await auth0Manager.getUser(),
                    permissions: await auth0Manager.getUserPermissions()
                };

            } catch (error) {
                console.warn('AI agent authentication failed:', error);
                return null;
            }
        };
    }

    /**
     * Setup AI user context management
     */
    async setupAIUserContext() {
        // Listen for auth state changes and update AI context
        auth0Manager.onAuthStateChange(async (authState) => {
            if (authState.isAuthenticated && authState.user) {
                await this.updateAIUserContext(authState.user);
            } else {
                await this.clearAIUserContext();
            }
        });

        // Setup periodic context refresh for long AI sessions
        setInterval(async () => {
            if (auth0Manager.isUserAuthenticated()) {
                await this.refreshAIContext();
            }
        }, 15 * 60 * 1000); // Every 15 minutes
    }

    /**
     * Update AI context with user information
     */
    async updateAIUserContext(user) {
        try {
            const userProfile = await auth0Manager.getUserProfile();
            const permissions = await auth0Manager.getUserPermissions();
            const subscription = await auth0Manager.getSubscriptionStatus();

            const aiContext = {
                userId: user.sub,
                name: user.name || user.email?.split('@')[0],
                email: user.email,
                level: userProfile?.progress?.level || 'beginner',
                preferences: userProfile?.preferences || {},
                permissions,
                subscription,
                lastActivity: new Date().toISOString(),

                // AI-specific context
                learningGoals: userProfile?.learningGoals || [],
                currentCourse: userProfile?.progress?.currentCourse,
                completedLessons: userProfile?.progress?.completedLessons || [],
                preferredLanguage: userProfile?.preferences?.language || 'es'
            };

            // Store in global AI context
            window.aiUserContext = aiContext;

            // Notify AI systems of context update
            window.dispatchEvent(new CustomEvent('aiContextUpdated', {
                detail: aiContext
            }));

            console.log('🤖 AI user context updated');

        } catch (error) {
            console.error('Failed to update AI context:', error);
        }
    }

    /**
     * Clear AI user context
     */
    async clearAIUserContext() {
        window.aiUserContext = null;

        window.dispatchEvent(new CustomEvent('aiContextCleared'));

        console.log('🤖 AI user context cleared');
    }

    /**
     * Refresh AI context for long sessions
     */
    async refreshAIContext() {
        try {
            const user = await auth0Manager.getUser();
            if (user) {
                await this.updateAIUserContext(user);
            }
        } catch (error) {
            console.warn('AI context refresh failed:', error);
        }
    }

    /**
     * Get authenticated API headers for AI requests
     */
    async getAIAuthHeaders() {
        try {
            const authData = await window.authenticateAIAgent();

            if (!authData) {
                return {};
            }

            return {
                'Authorization': `Bearer ${authData.token}`,
                'Content-Type': 'application/json',
                'X-AI-User-ID': authData.user.sub,
                'X-AI-Session-ID': this.getCurrentSessionId()
            };

        } catch (error) {
            console.error('Failed to get AI auth headers:', error);
            return {};
        }
    }

    /**
     * Make authenticated AI API request
     */
    async makeAIRequest(endpoint, options = {}) {
        try {
            const headers = await this.getAIAuthHeaders();

            const response = await fetch(endpoint, {
                ...options,
                headers: {
                    ...headers,
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`AI API request failed: ${response.status}`);
            }

            return response.json();

        } catch (error) {
            console.error('AI API request failed:', error);
            throw error;
        }
    }

    /**
     * Generate unique session ID for AI context
     */
    generateSessionId() {
        return `ai_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get current AI session ID
     */
    getCurrentSessionId() {
        return window.aiUserContext?.sessionId || this.generateSessionId();
    }

    /**
     * Check if user has AI access permissions
     */
    async hasAIAccess() {
        try {
            const permissions = await auth0Manager.getUserPermissions();
            return permissions.canAccessAdvancedFeatures || permissions.canAccessPremiumCourses;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get AI usage limits based on user subscription
     */
    async getAIUsageLimits() {
        try {
            const subscription = await auth0Manager.getSubscriptionStatus();

            const limits = {
                free: {
                    dailyRequests: 10,
                    monthlyRequests: 100,
                    features: ['basic_chat']
                },
                premium: {
                    dailyRequests: 100,
                    monthlyRequests: 1000,
                    features: ['basic_chat', 'advanced_tutoring', 'image_generation']
                },
                pro: {
                    dailyRequests: 500,
                    monthlyRequests: 5000,
                    features: ['basic_chat', 'advanced_tutoring', 'image_generation', 'custom_lessons']
                }
            };

            return limits[subscription.plan] || limits.free;

        } catch (error) {
            return limits.free;
        }
    }
}

// Export singleton instance
export const auth0GenAI = new Auth0GenAISetup();

// Auto-initialize if config is available
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', async () => {
        try {
            if (window.deaConfig?.auth0Domain && window.deaConfig?.auth0ClientId) {
                await auth0GenAI.initialize(window.deaConfig);
            }
        } catch (error) {
            console.warn('Auto-initialization failed:', error);
        }
    });
}