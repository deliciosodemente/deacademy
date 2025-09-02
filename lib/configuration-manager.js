/**
 * Configuration Manager for Digital English Academy
 * Handles Auth0, Stripe, MongoDB, and feature flag configuration
 */

export class ConfigurationManager {
    constructor() {
        this.config = null;
        this.environment = this.detectEnvironment();
        this.featureFlags = new Map();
    }

    /**
     * Detect current environment based on URL and localStorage
     */
    detectEnvironment() {
        try {
            // Check localStorage override first
            const envOverride = localStorage.getItem('dea_environment');
            if (envOverride) return envOverride;
        } catch (e) {
            // localStorage is not available
        }


        // Detect based on hostname
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        } else if (hostname.includes('staging') || hostname.includes('dev')) {
            return 'staging';
        } else {
            return 'production';
        }
    }

    /**
     * Load environment-specific configuration
     */
    loadEnvironmentConfig() {
        const baseConfig = {
            environment: this.environment,

            // Auth0 Configuration
            auth0: {
                domain: this.getEnvVar('AUTH0_DOMAIN', ''),
                clientId: this.getEnvVar('AUTH0_CLIENT_ID', ''),
                audience: this.getEnvVar('AUTH0_AUDIENCE', ''),
                scope: 'openid profile email',
                redirectUri: window.location.origin + window.location.pathname,
                logoutUri: window.location.origin + window.location.pathname
            },

            // Stripe Configuration  
            stripe: {
                publishableKey: this.getEnvVar('STRIPE_PUBLISHABLE_KEY', ''),
                paymentLinkUrl: this.getEnvVar('STRIPE_PAYMENT_LINK', ''),
                successUrl: window.location.origin + '/#/payment-success',
                cancelUrl: window.location.origin + '/#/payment-cancel'
            },

            // MongoDB Configuration
            mongodb: {
                connectionString: this.getEnvVar('MONGODB_CONNECTION_STRING', ''),
                databaseName: this.getDatabaseName(),
                options: {
                    retryWrites: true,
                    w: "majority",
                    appName: "digital-english-academy"
                }
            },

            // Gemini AI Configuration
            gemini: {
                apiKey: this.getEnvVar('GEMINI_API_KEY', '')
            },

            // Feature Flags
            features: {
                auth0: this.getFeatureFlag('auth0', true),
                stripe: this.getFeatureFlag('stripe', true),
                mongodb: this.getFeatureFlag('mongodb', true),
                analytics: this.getFeatureFlag('analytics', this.environment === 'production'),
                serviceWorker: this.getFeatureFlag('serviceWorker', this.environment === 'production'),
                realtime: this.getFeatureFlag('realtime', true)
            },

            // Performance Configuration
            performance: {
                enableMetrics: this.environment !== 'development',
                reportingEndpoint: this.getEnvVar('PERFORMANCE_ENDPOINT', ''),
                criticalResourceTimeout: 5000
            },

            // Accessibility Configuration
            accessibility: {
                enableEnhancements: true,
                announceRouteChanges: true,
                highContrastMode: this.getFeatureFlag('highContrast', false)
            }
        };

        this.config = baseConfig;
        return this.config;
    }

    /**
     * Get environment variable with fallback
     */
    getEnvVar(key, defaultValue = '') {
        // Check window.deaConfig first (set by WordPress or external config)
        if (window.deaConfig && window.deaConfig[key]) {
            return window.deaConfig[key];
        }

        // Check Vite environment variables
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            const viteKey = `VITE_${key}`;
            if (import.meta.env[viteKey] !== undefined) {
                return import.meta.env[viteKey];
            }
        }

        try {
            // Check localStorage for development overrides
            const localKey = `dea_${key.toLowerCase()}`;
            const localValue = localStorage.getItem(localKey);
            if (localValue) return localValue;
        } catch (e) {
            // localStorage is not available
        }

        return defaultValue;
    }

    /**
     * Get database name based on environment
     */
    getDatabaseName() {
        switch (this.environment) {
            case 'development':
                return 'digital_english_academy_dev';
            case 'staging':
                return 'digital_english_academy_staging';
            case 'production':
                return 'digital_english_academy';
            default:
                return 'digital_english_academy_dev';
        }
    }

    /**
     * Get feature flag value
     */
    getFeatureFlag(flagName, defaultValue = false) {
        try {
            // Check localStorage override
            const localFlag = localStorage.getItem(`dea_feature_${flagName}`);
            if (localFlag !== null) {
                return localFlag === 'true';
            }
        } catch (e) {
            // localStorage is not available
        }

        // Check environment variables
        const envFlag = this.getEnvVar(`ENABLE_${flagName.toUpperCase()}`, '');
        if (envFlag !== '') {
            return envFlag === 'true' || envFlag === '1';
        }

        // Check URL parameters for temporary overrides
        const urlParams = new URLSearchParams(window.location.search);
        const urlFlag = urlParams.get(`feature_${flagName}`);
        if (urlFlag !== null) {
            return urlFlag === '1' || urlFlag === 'true';
        }

        return defaultValue;
    }

    /**
     * Set feature flag (persists to localStorage)
     */
    setFeatureFlag(flagName, value) {
        try {
            localStorage.setItem(`dea_feature_${flagName}`, String(value));
        } catch (e) {
            // localStorage is not available
        }

        if (this.config && this.config.features) {
            this.config.features[flagName] = value;
        }
        this.featureFlags.set(flagName, value);
    }

    /**
     * Validate configuration completeness
     */
    validateConfiguration(config = this.config) {
        const errors = [];
        const warnings = [];

        if (!config) {
            errors.push('Configuration not loaded');
            return { isValid: false, errors, warnings };
        }

        // Validate Auth0 if enabled
        if (config.features.auth0) {
            if (!config.auth0.domain) {
                errors.push('Auth0 domain is required when Auth0 is enabled');
            }
            if (!config.auth0.clientId) {
                errors.push('Auth0 client ID is required when Auth0 is enabled');
            }
        }

        // Validate Stripe if enabled
        if (config.features.stripe) {
            if (!config.stripe.publishableKey) {
                errors.push('Stripe publishable key is required when Stripe is enabled');
            }
        }

        // Validate MongoDB if enabled
        if (config.features.mongodb) {
            if (!config.mongodb.connectionString) {
                errors.push('MongoDB connection string is required when MongoDB is enabled');
            }
            if (!config.mongodb.databaseName) {
                errors.push('MongoDB database name is required when MongoDB is enabled');
            }
        }

        // Performance warnings
        if (config.environment === 'production' && !config.performance.enableMetrics) {
            warnings.push('Performance metrics disabled in production');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Get secure configuration (excludes sensitive data for client-side logging)
     */
    getSecureConfig(key = null) {
        if (!this.config) return null;

        const secureConfig = {
            ...this.config,
            mongodb: {
                databaseName: this.config.mongodb.databaseName,
                options: this.config.mongodb.options
                // connectionString excluded for security
            }
        };

        return key ? secureConfig[key] : secureConfig;
    }

    /**
     * Set development mode (enables debug features)
     */
    setDevelopmentMode(enabled) {
        try {
            localStorage.setItem('dea_development_mode', String(enabled));
        } catch (e) {
            // localStorage is not available
        }

        if (enabled) {
            console.log('🔧 Development mode enabled');
            window.deaConfig = window.deaConfig || {};
            window.deaConfig.debug = true;
        }
    }

    /**
     * Check if development mode is enabled
     */
    isDevelopmentMode() {
        let devMode = false;
        try {
            devMode = localStorage.getItem('dea_development_mode') === 'true';
        } catch (e) {
            // localStorage is not available
        }
        return this.environment === 'development' ||
            devMode ||
            new URLSearchParams(window.location.search).get('debug') === '1';
    }

    /**
     * Get current configuration
     */
    getConfig() {
        return this.config;
    }

    /**
     * Update configuration at runtime
     */
    updateConfig(updates) {
        if (!this.config) {
            throw new Error('Configuration not initialized');
        }

        this.config = { ...this.config, ...updates };
        return this.config;
    }
}

// Export singleton instance
export const configManager = new ConfigurationManager();