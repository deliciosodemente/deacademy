/**
 * Auth0 Manager for Digital English Academy
 * Based on Auth0 AI samples patterns from:
 * - vercel-ai-next-js-starter
 * - langchain-next-js
 */

import { Auth0ErrorHandler } from './service-error-handlers.js';

export class Auth0Manager {
    constructor() {
        this.client = null;
        this.user = null;
        this.isAuthenticated = false;
        this.isLoading = false;
        this.authStateCallbacks = new Set();
        this.config = null;
        this.tokenCache = new Map();
        this.refreshPromise = null;
    }

    /**
     * Initialize Auth0 client with configuration
     */
    async initializeAuth0Client(config) {
        try {
            this.config = config;
            console.log('🔐 Initializing Auth0 client...');

            if (!window.createAuth0Client) {
                await new Promise(resolve => {
                    const interval = setInterval(() => {
                        if (window.createAuth0Client) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 100);
                });
            }

            // Create Auth0 client with enhanced configuration
            this.client = await window.createAuth0Client({
                domain: config.domain,
                clientId: config.clientId,
                authorizationParams: {
                    redirect_uri: config.redirectUri,
                    audience: config.audience,
                    scope: config.scope || 'openid profile email'
                },
                cacheLocation: 'localstorage',
                useRefreshTokens: true,
                useRefreshTokensFallback: true
            });

            // Handle redirect callback if present
            await this.handleAuthCallback();

            // Check if user is authenticated
            await this.checkAuthState();

            console.log('✅ Auth0 client initialized successfully');
            return this.client;

        } catch (error) {
            console.error('❌ Auth0 initialization failed:', error);
            Auth0ErrorHandler.handleError(error, { context: 'initialization' });
            throw error;
        }
    }

    /**
     * Handle authentication callback from Auth0
     */
    async handleAuthCallback() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const hasAuthParams = urlParams.has('code') && urlParams.has('state');

            if (hasAuthParams) {
                console.log('🔄 Processing Auth0 callback...');
                this.isLoading = true;
                this.notifyAuthStateChange();

                // Handle the callback
                const result = await this.client.handleRedirectCallback();

                // Clean up URL
                const url = new URL(window.location);
                url.search = '';
                window.history.replaceState({}, document.title, url.toString());

                // Update auth state
                await this.checkAuthState();

                console.log('✅ Auth0 callback processed successfully');
                return result;
            }
        } catch (error) {
            console.error('❌ Auth0 callback handling failed:', error);
            Auth0ErrorHandler.handleError(error, { context: 'callback' });

            // Clean up URL even on error
            const url = new URL(window.location);
            url.search = '';
            window.history.replaceState({}, document.title, url.toString());

            throw error;
        } finally {
            this.isLoading = false;
            this.notifyAuthStateChange();
        }
    }

    /**
     * Check current authentication state
     */
    async checkAuthState() {
        try {
            this.isAuthenticated = await this.client.isAuthenticated();

            if (this.isAuthenticated) {
                this.user = await this.client.getUser();
                console.log('👤 User authenticated:', this.user?.email);

                // Sync user with MongoDB if available
                await this.syncUserWithDatabase();
            } else {
                this.user = null;
                console.log('👤 User not authenticated');
            }

            this.notifyAuthStateChange();
            return this.isAuthenticated;

        } catch (error) {
            console.error('❌ Auth state check failed:', error);
            Auth0ErrorHandler.handleError(error, { context: 'auth_state_check' });

            // Reset state on error
            this.isAuthenticated = false;
            this.user = null;
            this.notifyAuthStateChange();

            return false;
        }
    }

    /**
     * Login with redirect (recommended for production)
     */
    async loginWithRedirect(options = {}) {
        try {
            console.log('🔐 Initiating login with redirect...');

            const loginOptions = {
                authorizationParams: {
                    redirect_uri: this.config.redirectUri,
                    ...options.authorizationParams
                },
                ...options
            };

            await this.client.loginWithRedirect(loginOptions);

        } catch (error) {
            console.error('❌ Login with redirect failed:', error);
            Auth0ErrorHandler.handleError(error, { context: 'login_redirect' });
            throw error;
        }
    }

    /**
     * Login with popup (for better UX in some cases)
     */
    async loginWithPopup(options = {}) {
        try {
            console.log('🔐 Initiating login with popup...');
            this.isLoading = true;
            this.notifyAuthStateChange();

            const loginOptions = {
                authorizationParams: {
                    audience: this.config.audience,
                    scope: this.config.scope || 'openid profile email',
                    ...options.authorizationParams
                },
                ...options
            };

            await this.client.loginWithPopup(loginOptions);

            // Update auth state after successful login
            await this.checkAuthState();

            console.log('✅ Login with popup successful');

        } catch (error) {
            console.error('❌ Login with popup failed:', error);
            Auth0ErrorHandler.handleError(error, { context: 'login_popup' });

            // If popup fails, fallback to redirect
            if (error.error === 'popup_closed_by_user' || error.message?.includes('popup')) {
                console.log('🔄 Popup failed, falling back to redirect...');
                await this.loginWithRedirect(options);
            } else {
                throw error;
            }
        } finally {
            this.isLoading = false;
            this.notifyAuthStateChange();
        }
    }

    /**
     * Logout user
     */
    async logout(options = {}) {
        try {
            console.log('🚪 Logging out user...');

            const logoutOptions = {
                logoutParams: {
                    returnTo: this.config.logoutUri || window.location.origin
                },
                ...options
            };

            // Clear local state
            this.user = null;
            this.isAuthenticated = false;
            this.tokenCache.clear();

            // Clear any cached user data
            await this.clearUserData();

            this.notifyAuthStateChange();

            // Logout from Auth0
            await this.client.logout(logoutOptions);

            console.log('✅ Logout successful');

        } catch (error) {
            console.error('❌ Logout failed:', error);
            Auth0ErrorHandler.handleError(error, { context: 'logout' });
            throw error;
        }
    }

    /**
     * Get current user
     */
    async getUser() {
        if (!this.isAuthenticated) {
            return null;
        }

        if (!this.user) {
            try {
                this.user = await this.client.getUser();
            } catch (error) {
                console.error('❌ Failed to get user:', error);
                Auth0ErrorHandler.handleError(error, { context: 'get_user' });
                return null;
            }
        }

        return this.user;
    }

    /**
     * Get access token (with caching and refresh)
     */
    async getAccessToken(options = {}) {
        try {
            const cacheKey = JSON.stringify(options);

            // Check cache first
            if (this.tokenCache.has(cacheKey)) {
                const cached = this.tokenCache.get(cacheKey);
                if (cached.expires > Date.now()) {
                    return cached.token;
                }
                this.tokenCache.delete(cacheKey);
            }

            // If already refreshing, wait for it
            if (this.refreshPromise) {
                await this.refreshPromise;
                return this.getAccessToken(options);
            }

            // Get new token
            this.refreshPromise = this.client.getTokenSilently({
                authorizationParams: {
                    audience: this.config.audience,
                    scope: this.config.scope || 'openid profile email',
                    ...options.authorizationParams
                },
                ...options
            });

            const token = await this.refreshPromise;
            this.refreshPromise = null;

            // Cache token (expires in 50 minutes to be safe)
            this.tokenCache.set(cacheKey, {
                token,
                expires: Date.now() + (50 * 60 * 1000)
            });

            return token;

        } catch (error) {
            this.refreshPromise = null;
            console.error('❌ Failed to get access token:', error);
            Auth0ErrorHandler.handleError(error, { context: 'get_token' });

            // If token refresh fails, user might need to re-authenticate
            if (error.error === 'login_required' || error.error === 'consent_required') {
                this.isAuthenticated = false;
                this.user = null;
                this.notifyAuthStateChange();
            }

            throw error;
        }
    }

    /**
     * Check if user is authenticated
     */
    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    /**
     * Register callback for auth state changes
     */
    onAuthStateChange(callback) {
        this.authStateCallbacks.add(callback);

        // Return unsubscribe function
        return () => {
            this.authStateCallbacks.delete(callback);
        };
    }

    /**
     * Notify all callbacks of auth state change
     */
    notifyAuthStateChange() {
        const authState = {
            isAuthenticated: this.isAuthenticated,
            isLoading: this.isLoading,
            user: this.user,
            error: null
        };

        this.authStateCallbacks.forEach(callback => {
            try {
                callback(authState);
            } catch (error) {
                console.error('Auth state callback error:', error);
            }
        });

        // Update global auth state
        window.deaAuth = {
            client: this.client,
            user: this.user,
            isAuthenticated: this.isAuthenticated,
            isLoading: this.isLoading
        };
    }

    /**
     * Sync user with database (MongoDB integration)
     */
    async syncUserWithDatabase() {
        try {
            if (!this.user) return;

            console.log('🔄 Syncing user with database...');

            // Get PostgreSQL manager if available
            const { postgresManager } = await import('./postgresql-manager.js');

            if (postgresManager && postgresManager.isConnected) {
                // Check if user exists in database
                const existingUser = await postgresManager.query('SELECT * FROM users WHERE auth0_id = $1', [this.user.sub]);

                const userData = {
                    auth0_id: this.user.sub,
                    email: this.user.email,
                    name: this.user.name,
                    picture: this.user.picture,
                    email_verified: this.user.email_verified,
                    last_login: new Date(),
                    locale: this.user.locale || 'es',
                    nickname: this.user.nickname,
                    given_name: this.user.given_name,
                    family_name: this.user.family_name
                };

                if (existingUser.rows.length === 0) {
                    // Create new user record with comprehensive profile
                    const newUser = {
                        ...userData,
                        preferences: {
                            language: this.user.locale || 'es',
                            notifications: {
                                email: true,
                                push: true,
                                marketing: false
                            },
                            theme: 'light',
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                            accessibility: {
                                highContrast: false,
                                largeText: false,
                                reducedMotion: false
                            }
                        },
                        progress: {
                            level: 'beginner',
                            currentCourse: null,
                            completedLessons: [],
                            totalPoints: 0,
                            streak: 0,
                            lastActivity: new Date()
                        },
                        subscription: {
                            plan: 'free',
                            status: 'active',
                            startDate: new Date(),
                            endDate: null,
                            stripeCustomerId: null
                        },
                        roles: ['student'], // Default role
                        metadata: {
                            signupSource: 'web',
                            referrer: document.referrer || null,
                            userAgent: navigator.userAgent
                        }
                    };

                    const result = await postgresManager.query(
                        'INSERT INTO users (auth0_id, email, name, picture, email_verified, last_login, locale, nickname, given_name, family_name, preferences, progress, subscription, roles, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id',
                        [
                            newUser.auth0_id,
                            newUser.email,
                            newUser.name,
                            newUser.picture,
                            newUser.email_verified,
                            newUser.last_login,
                            newUser.locale,
                            newUser.nickname,
                            newUser.given_name,
                            newUser.family_name,
                            newUser.preferences,
                            newUser.progress,
                            newUser.subscription,
                            newUser.roles,
                            newUser.metadata
                        ]
                    );
                    console.log('✅ New user created in database:', result.rows[0].id);

                    // Create user activity log
                    await this.logUserActivity('user_created', {
                        userId: result.rows[0].id,
                        auth0Id: this.user.sub
                    });

                } else {
                    // Update existing user's information
                    const updateData = {
                        ...userData,
                        'progress.lastActivity': new Date()
                    };

                    await postgresManager.query(
                        'UPDATE users SET email = $1, name = $2, picture = $3, email_verified = $4, last_login = $5, locale = $6, nickname = $7, given_name = $8, family_name = $9, progress = $10 WHERE auth0_id = $11',
                        [
                            updateData.email,
                            updateData.name,
                            updateData.picture,
                            updateData.email_verified,
                            updateData.last_login,
                            updateData.locale,
                            updateData.nickname,
                            updateData.given_name,
                            updateData.family_name,
                            updateData['progress.lastActivity'],
                            this.user.sub
                        ]
                    );

                    console.log('✅ User updated in database');

                    // Log login activity
                    await this.logUserActivity('user_login', {
                        userId: existingUser.rows[0].id,
                        auth0Id: this.user.sub
                    });
                }

                // Initialize user session data
                await this.initializeUserSession();

            }

        } catch (error) {
            console.error('❌ User sync failed:', error);
            // Don't throw - this is not critical for auth flow
        }
    }

    /**
     * Initialize user session data
     */
    async initializeUserSession() {
        try {
            if (!this.user) return;

            const sessionData = {
                userId: this.user.sub,
                email: this.user.email,
                name: this.user.name,
                picture: this.user.picture,
                sessionStart: new Date(),
                lastActivity: new Date(),
                deviceInfo: {
                    userAgent: navigator.userAgent,
                    language: navigator.language,
                    platform: navigator.platform,
                    cookieEnabled: navigator.cookieEnabled
                }
            };

            // Store session data in localStorage for quick access
            localStorage.setItem('dea_session', JSON.stringify(sessionData));

            // Update session in database if PostgreSQL is available
            const { postgresManager } = await import('./postgresql-manager.js');
            if (postgresManager && postgresManager.isConnected) {
                await postgresManager.query(
                    'INSERT INTO user_sessions (user_id, email, name, picture, session_start, last_activity, device_info, expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                    [
                        sessionData.userId,
                        sessionData.email,
                        sessionData.name,
                        sessionData.picture,
                        sessionData.sessionStart,
                        sessionData.lastActivity,
                        sessionData.deviceInfo,
                        new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
                    ]
                );
            }

            console.log('✅ User session initialized');

        } catch (error) {
            console.error('❌ Session initialization failed:', error);
        }
    }

    /**
     * Log user activity
     */
    async logUserActivity(action, metadata = {}) {
        try {
            const { postgresManager } = await import('./postgresql-manager.js');
            if (postgresManager && postgresManager.isConnected) {
                await postgresManager.query(
                    'INSERT INTO user_activities (user_id, action, metadata, timestamp, ip, user_agent) VALUES ($1, $2, $3, $4, $5, $6)',
                    [
                        this.user?.sub,
                        action,
                        metadata,
                        new Date(),
                        await this.getUserIP(),
                        navigator.userAgent
                    ]
                );
            }
        } catch (error) {
            console.error('❌ Activity logging failed:', error);
        }
    }

    /**
     * Get user IP address (for activity logging)
     */
    async getUserIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }

    /**
     * Clear user data from local storage and cache
     */
    async clearUserData() {
        try {
            // Clear localStorage items
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('@@auth0spajs@@') || key.startsWith('dea_user_'))) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => localStorage.removeItem(key));

            // Clear token cache
            this.tokenCache.clear();

            console.log('🧹 User data cleared');

        } catch (error) {
            console.error('❌ Failed to clear user data:', error);
        }
    }

    /**
     * Get user profile with additional data from database
     */
    async getUserProfile() {
        try {
            const user = await this.getUser();
            if (!user) return null;

            // Try to get additional profile data from database
            const { postgresManager } = await import('./postgresql-manager.js');

            if (postgresManager && postgresManager.isConnected) {
                const result = await postgresManager.query('SELECT * FROM users WHERE auth0_id = $1', [user.sub]);

                if (result.rows.length > 0) {
                    return {
                        ...user,
                        ...result.rows[0],
                        id: user.sub // Ensure we use Auth0 ID as primary ID
                    };
                }
            }

            return user;

        } catch (error) {
            console.error('❌ Failed to get user profile:', error);
            return this.user;
        }
    }

    /**
     * Update user preferences in database
     */
    async updateUserPreferences(preferences) {
        try {
            if (!this.isAuthenticated || !this.user) {
                throw new Error('User not authenticated');
            }

            const { postgresManager } = await import('./postgresql-manager.js');

            if (postgresManager && postgresManager.isConnected) {
                await postgresManager.query('UPDATE users SET preferences = $1 WHERE auth0_id = $2', [preferences, this.user.sub]);

                console.log('✅ User preferences updated');
                return true;
            }

            // Fallback to localStorage
            localStorage.setItem(`dea_user_preferences_${this.user.sub}`, JSON.stringify(preferences));
            return true;

        } catch (error) {
            console.error('❌ Failed to update user preferences:', error);
            throw error;
        }
    }

    /**
     * Get authentication headers for API requests
     */
    async getAuthHeaders() {
        try {
            if (!this.isAuthenticated) {
                return {};
            }

            const token = await this.getAccessToken();
            return {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

        } catch (error) {
            console.error('❌ Failed to get auth headers:', error);
            return {};
        }
    }

    /**
     * Make authenticated API request
     */
    async authenticatedFetch(url, options = {}) {
        try {
            const headers = await this.getAuthHeaders();

            const response = await fetch(url, {
                ...options,
                headers: {
                    ...headers,
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response;

        } catch (error) {
            console.error('❌ Authenticated fetch failed:', error);

            // If unauthorized, try to refresh token
            if (error.message?.includes('401')) {
                try {
                    await this.getAccessToken({ ignoreCache: true });
                    // Retry the request
                    return this.authenticatedFetch(url, options);
                } catch (refreshError) {
                    console.error('❌ Token refresh failed:', refreshError);
                }
            }

            throw error;
        }
    }

    /**
     * Get user roles from database
     */
    async getUserRoles() {
        try {
            if (!this.isAuthenticated || !this.user) {
                return [];
            }

            const { postgresManager } = await import('./postgresql-manager.js');
            if (postgresManager && postgresManager.isConnected) {
                const result = await postgresManager.query('SELECT roles FROM users WHERE auth0_id = $1', [this.user.sub]);

                if (result.rows.length > 0) {
                    return result.rows[0].roles || ['student'];
                }
            }

            // Fallback to Auth0 roles if available
            return this.user['https://digitalenglishacademy.com/roles'] || ['student'];

        } catch (error) {
            console.error('❌ Failed to get user roles:', error);
            return ['student']; // Default role
        }
    }

    /**
     * Check if user has specific role
     */
    async hasRole(role) {
        const roles = await this.getUserRoles();
        return roles.includes(role);
    }

    /**
     * Check if user has any of the specified roles
     */
    async hasAnyRole(roles) {
        const userRoles = await this.getUserRoles();
        return roles.some(role => userRoles.includes(role));
    }

    /**
     * Check if user has all specified roles
     */
    async hasAllRoles(roles) {
        const userRoles = await this.getUserRoles();
        return roles.every(role => userRoles.includes(role));
    }

    /**
     * Update user roles (admin only)
     */
    async updateUserRoles(userId, roles) {
        try {
            // Check if current user is admin
            if (!await this.hasRole('admin')) {
                throw new Error('Insufficient permissions to update user roles');
            }

            const { postgresManager } = await import('./postgresql-manager.js');
            if (postgresManager && postgresManager.isConnected) {
                await postgresManager.query('UPDATE users SET roles = $1 WHERE auth0_id = $2', [roles, userId]);

                // Log role change
                await this.logUserActivity('roles_updated', {
                    targetUserId: userId,
                    newRoles: roles,
                    updatedBy: this.user.sub
                });

                console.log('✅ User roles updated');
                return true;
            }

            throw new Error('Database not available');

        } catch (error) {
            console.error('❌ Failed to update user roles:', error);
            throw error;
        }
    }

    /**
     * Get user subscription status
     */
    async getSubscriptionStatus() {
        try {
            if (!this.isAuthenticated || !this.user) {
                return { plan: 'free', status: 'inactive' };
            }

            const { postgresManager } = await import('./postgresql-manager.js');
            if (postgresManager && postgresManager.isConnected) {
                const result = await postgresManager.query('SELECT subscription FROM users WHERE auth0_id = $1', [this.user.sub]);

                if (result.rows.length > 0) {
                    return result.rows[0].subscription || { plan: 'free', status: 'active' };
                }
            }

            return { plan: 'free', status: 'active' };

        } catch (error) {
            console.error('❌ Failed to get subscription status:', error);
            return { plan: 'free', status: 'active' };
        }
    }

    /**
     * Check if user has premium access
     */
    async hasPremiumAccess() {
        const subscription = await this.getSubscriptionStatus();
        return subscription.plan !== 'free' && subscription.status === 'active';
    }

    /**
     * Refresh user session
     */
    async refreshSession() {
        try {
            console.log('🔄 Refreshing user session...');

            // Get fresh token
            await this.getAccessToken({ ignoreCache: true });

            // Update session data
            await this.initializeUserSession();

            // Log session refresh
            await this.logUserActivity('session_refreshed');

            console.log('✅ Session refreshed successfully');
            return true;

        } catch (error) {
            console.error('❌ Session refresh failed:', error);
            throw error;
        }
    }

    /**
     * Setup automatic token refresh
     */
    setupTokenRefresh() {
        // Refresh token every 45 minutes (tokens expire in 1 hour)
        setInterval(async () => {
            if (this.isAuthenticated) {
                try {
                    await this.refreshSession();
                } catch (error) {
                    console.error('❌ Automatic token refresh failed:', error);
                    // If refresh fails, user might need to re-authenticate
                    this.notifyAuthStateChange();
                }
            }
        }, 45 * 60 * 1000); // 45 minutes
    }

    /**
     * Get user permissions based on roles and subscription
     */
    async getUserPermissions() {
        try {
            const roles = await this.getUserRoles();
            const subscription = await this.getSubscriptionStatus();

            const permissions = {
                // Basic permissions for all authenticated users
                canViewCourses: true,
                canTakeQuizzes: true,
                canParticipateInCommunity: true,

                // Premium permissions
                canAccessPremiumCourses: subscription.plan !== 'free',
                canDownloadContent: subscription.plan !== 'free',
                canAccessAdvancedFeatures: subscription.plan !== 'free',

                // Role-based permissions
                canModerateContent: roles.includes('moderator') || roles.includes('admin'),
                canManageUsers: roles.includes('admin'),
                canAccessAnalytics: roles.includes('admin') || roles.includes('teacher'),
                canCreateCourses: roles.includes('teacher') || roles.includes('admin'),
                canManageSubscriptions: roles.includes('admin')
            };

            return permissions;

        } catch (error) {
            console.error('❌ Failed to get user permissions:', error);
            return {
                canViewCourses: true,
                canTakeQuizzes: true,
                canParticipateInCommunity: true
            };
        }
    }

    /**
     * Validate session and refresh if needed
     */
    async validateSession() {
        try {
            if (!this.isAuthenticated) {
                return false;
            }

            // Check if token is still valid
            try {
                await this.getAccessToken();
                return true;
            } catch (error) {
                if (error.error === 'login_required') {
                    // Session expired, clear auth state
                    this.isAuthenticated = false;
                    this.user = null;
                    this.notifyAuthStateChange();
                    return false;
                }
                throw error;
            }

        } catch (error) {
            console.error('❌ Session validation failed:', error);
            return false;
        }
    }

    /**
     * Get current auth state with enhanced information
     */
    getAuthState() {
        return {
            isAuthenticated: this.isAuthenticated,
            isLoading: this.isLoading,
            user: this.user,
            client: this.client,
            hasValidSession: this.isAuthenticated && this.user !== null
        };
    }

    /**
     * Initialize Auth0 manager with automatic session management
     */
    async initialize(config) {
        try {
            await this.initializeAuth0Client(config);

            // Setup automatic token refresh
            this.setupTokenRefresh();

            // Validate session periodically
            setInterval(async () => {
                if (this.isAuthenticated) {
                    await this.validateSession();
                }
            }, 5 * 60 * 1000); // Every 5 minutes

            console.log('✅ Auth0 Manager fully initialized');
            return true;

        } catch (error) {
            console.error('❌ Auth0 Manager initialization failed:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const auth0Manager = new Auth0Manager();