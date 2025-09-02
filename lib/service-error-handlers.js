/**
 * Service-specific error handlers for Auth0, Stripe, and MongoDB
 */

/**
 * Auth0 Error Handler
 */
class Auth0ErrorHandler {
    static handleError(error, context = {}) {
        const errorEvent = new CustomEvent('auth0Error', {
            detail: {
                error,
                context,
                timestamp: new Date(),
                errorType: this.categorizeAuth0Error(error)
            }
        });

        window.dispatchEvent(errorEvent);
    }

    static categorizeAuth0Error(error) {
        const message = error?.message?.toLowerCase() || '';
        const code = error?.error || error?.code || '';

        if (code === 'login_required' || message.includes('login required')) {
            return 'login_required';
        }

        if (code === 'consent_required' || message.includes('consent required')) {
            return 'consent_required';
        }

        if (code === 'interaction_required' || message.includes('interaction required')) {
            return 'interaction_required';
        }

        if (message.includes('network') || message.includes('fetch')) {
            return 'network_error';
        }

        if (message.includes('token') || message.includes('jwt')) {
            return 'token_error';
        }

        if (message.includes('popup') || message.includes('window')) {
            return 'popup_error';
        }

        return 'unknown_auth_error';
    }

    static getRecoveryStrategy(errorType) {
        const strategies = {
            login_required: async () => {
                console.log('🔐 Redirecting to login...');
                if (window.dea?.auth?.login) {
                    await window.dea.auth.login();
                    return { success: true, message: 'Redirected to login' };
                }
                throw new Error('Login function not available');
            },

            consent_required: async () => {
                console.log('📋 Requesting user consent...');
                if (window.dea?.auth?.login) {
                    await window.dea.auth.login({ prompt: 'consent' });
                    return { success: true, message: 'Consent requested' };
                }
                throw new Error('Consent flow not available');
            },

            token_error: async () => {
                console.log('🔄 Refreshing token...');
                if (window.deaAuth?.client) {
                    try {
                        await window.deaAuth.client.getTokenSilently({ ignoreCache: true });
                        return { success: true, message: 'Token refreshed' };
                    } catch (refreshError) {
                        // If silent refresh fails, redirect to login
                        await window.dea.auth.login();
                        return { success: true, message: 'Redirected to login for new token' };
                    }
                }
                throw new Error('Auth client not available');
            },

            popup_error: async () => {
                console.log('🪟 Switching to redirect flow...');
                if (window.dea?.auth?.login) {
                    await window.dea.auth.login({ redirect: true });
                    return { success: true, message: 'Switched to redirect flow' };
                }
                throw new Error('Redirect flow not available');
            },

            network_error: async () => {
                console.log('🌐 Retrying Auth0 connection...');
                // Wait and retry
                await new Promise(resolve => setTimeout(resolve, 2000));

                if (window.deaAuth?.client) {
                    await window.deaAuth.client.checkSession();
                    return { success: true, message: 'Auth0 connection restored' };
                }
                throw new Error('Auth0 client not available');
            }
        };

        return strategies[errorType] || strategies.network_error;
    }
}

/**
 * Stripe Error Handler
 */
class StripeErrorHandler {
    static handleError(error, context = {}) {
        const errorEvent = new CustomEvent('stripeError', {
            detail: {
                error,
                context,
                timestamp: new Date(),
                errorType: this.categorizeStripeError(error)
            }
        });

        window.dispatchEvent(errorEvent);
    }

    static categorizeStripeError(error) {
        const type = error?.type || '';
        const code = error?.code || '';
        const message = error?.message?.toLowerCase() || '';

        // Stripe-specific error types
        if (type === 'card_error') {
            return 'card_error';
        }

        if (type === 'validation_error') {
            return 'validation_error';
        }

        if (type === 'api_error') {
            return 'api_error';
        }

        if (type === 'authentication_error') {
            return 'authentication_error';
        }

        if (type === 'rate_limit_error') {
            return 'rate_limit_error';
        }

        // Network-related errors
        if (message.includes('network') || message.includes('fetch')) {
            return 'network_error';
        }

        // Configuration errors
        if (message.includes('publishable key') || message.includes('api key')) {
            return 'configuration_error';
        }

        return 'unknown_stripe_error';
    }

    static getRecoveryStrategy(errorType) {
        const strategies = {
            card_error: async (errorContext) => {
                console.log('💳 Handling card error...');
                // Show user-friendly card error message
                const cardError = errorContext.error;
                return {
                    success: false,
                    message: 'Card error - user action required',
                    userMessage: cardError.message,
                    requiresUserAction: true
                };
            },

            validation_error: async (errorContext) => {
                console.log('📝 Handling validation error...');
                return {
                    success: false,
                    message: 'Validation error - user input required',
                    userMessage: 'Por favor, verifica la información ingresada',
                    requiresUserAction: true
                };
            },

            api_error: async () => {
                console.log('🔄 Retrying Stripe API call...');
                // Wait and retry
                await new Promise(resolve => setTimeout(resolve, 1000));
                return { success: true, message: 'Retry Stripe API call' };
            },

            authentication_error: async () => {
                console.log('🔑 Stripe authentication error...');
                // This usually means configuration issue
                return {
                    success: false,
                    message: 'Stripe authentication failed',
                    requiresConfiguration: true
                };
            },

            rate_limit_error: async () => {
                console.log('⏱️ Stripe rate limit hit, waiting...');
                // Wait longer for rate limit
                await new Promise(resolve => setTimeout(resolve, 5000));
                return { success: true, message: 'Rate limit wait completed' };
            },

            network_error: async () => {
                console.log('🌐 Retrying Stripe connection...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                return { success: true, message: 'Retry Stripe connection' };
            },

            configuration_error: async () => {
                console.log('⚙️ Stripe configuration error...');
                return {
                    success: false,
                    message: 'Stripe configuration error',
                    requiresConfiguration: true
                };
            }
        };

        return strategies[errorType] || strategies.network_error;
    }
}

/**
 * MongoDB Error Handler
 */
class MongoDBErrorHandler {
    static handleError(error, context = {}) {
        const errorEvent = new CustomEvent('mongoError', {
            detail: {
                error,
                context,
                timestamp: new Date(),
                errorType: this.categorizeMongoError(error)
            }
        });

        window.dispatchEvent(errorEvent);
    }

    static categorizeMongoError(error) {
        const message = error?.message?.toLowerCase() || '';
        const code = error?.code || error?.codeName || '';

        // Connection errors
        if (message.includes('connection') || message.includes('connect')) {
            return 'connection_error';
        }

        // Authentication errors
        if (message.includes('authentication') || message.includes('unauthorized') || code === 'Unauthorized') {
            return 'authentication_error';
        }

        // Network errors
        if (message.includes('network') || message.includes('timeout') || message.includes('dns')) {
            return 'network_error';
        }

        // Database errors
        if (message.includes('database') || message.includes('collection')) {
            return 'database_error';
        }

        // Validation errors
        if (message.includes('validation') || code === 'ValidationError') {
            return 'validation_error';
        }

        // Duplicate key errors
        if (message.includes('duplicate') || code === 11000) {
            return 'duplicate_key_error';
        }

        // Permission errors
        if (message.includes('permission') || message.includes('access denied')) {
            return 'permission_error';
        }

        return 'unknown_mongo_error';
    }

    static getRecoveryStrategy(errorType) {
        const strategies = {
            connection_error: async () => {
                console.log('🔄 MongoDB connection error - switching to local storage...');
                // Switch to local storage mode as fallback
                localStorage.setItem('dea_storage_mode', 'local');
                return { 
                    success: true, 
                    message: 'Switched to local storage mode' 
                };
            },

            authentication_error: async () => {
                console.log('🔐 MongoDB authentication failed...');
                // Switch to local storage mode
                localStorage.setItem('dea_storage_mode', 'local');
                return {
                    success: true,
                    message: 'Switched to local storage mode',
                    mode: 'local'
                };
            },

            network_error: async () => {
                console.log('🌐 MongoDB network error, retrying...');
                await new Promise(resolve => setTimeout(resolve, 3000));
                return { success: true, message: 'Retry MongoDB connection' };
            },

            database_error: async () => {
                console.log('📊 MongoDB database error...');
                // Use cached data if available
                const cachedData = localStorage.getItem('dea_cached_data');
                if (cachedData) {
                    return {
                        success: true,
                        message: 'Using cached data',
                        mode: 'cached'
                    };
                }
                return { success: false, message: 'No cached data available' };
            },

            validation_error: async (errorContext) => {
                console.log('📝 MongoDB validation error...');
                return {
                    success: false,
                    message: 'Data validation failed',
                    userMessage: 'Los datos no son válidos, por favor verifica la información',
                    requiresUserAction: true
                };
            },

            duplicate_key_error: async (errorContext) => {
                console.log('🔑 MongoDB duplicate key error...');
                return {
                    success: false,
                    message: 'Duplicate data detected',
                    userMessage: 'Esta información ya existe en el sistema',
                    requiresUserAction: true
                };
            },

            permission_error: async () => {
                console.log('🚫 MongoDB permission error...');
                return {
                    success: false,
                    message: 'Insufficient permissions',
                    userMessage: 'No tienes permisos para realizar esta acción',
                    requiresUserAction: true
                };
            }
        };

        return strategies[errorType] || strategies.network_error;
    }
}

/**
 * Network Error Handler (for general network requests)
 */
class NetworkErrorHandler {
    static handleError(error, context = {}) {
        const errorEvent = new CustomEvent('networkError', {
            detail: {
                error,
                context,
                timestamp: new Date(),
                errorType: this.categorizeNetworkError(error)
            }
        });

        window.dispatchEvent(errorEvent);
    }

    static categorizeNetworkError(error) {
        const message = error?.message?.toLowerCase() || '';
        const status = error?.status || context?.status || 0;

        if (status === 0 || message.includes('network error') || message.includes('fetch')) {
            return 'connection_failed';
        }

        if (status >= 500) {
            return 'server_error';
        }

        if (status === 404) {
            return 'not_found';
        }

        if (status === 401 || status === 403) {
            return 'unauthorized';
        }

        if (status === 429) {
            return 'rate_limited';
        }

        if (message.includes('timeout')) {
            return 'timeout';
        }

        if (message.includes('cors')) {
            return 'cors_error';
        }

        return 'unknown_network_error';
    }

    static getRecoveryStrategy(errorType) {
        const strategies = {
            connection_failed: async () => {
                console.log('🌐 Connection failed, checking network...');

                // Check if online
                if (!navigator.onLine) {
                    return {
                        success: false,
                        message: 'Device is offline',
                        mode: 'offline'
                    };
                }

                // Try a simple connectivity test
                try {
                    await fetch(window.location.origin, { method: 'HEAD', cache: 'no-cache' });
                    return { success: true, message: 'Network connectivity restored' };
                } catch (testError) {
                    return { success: false, message: 'Network still unavailable' };
                }
            },

            server_error: async () => {
                console.log('🔄 Server error, retrying...');
                await new Promise(resolve => setTimeout(resolve, 5000));
                return { success: true, message: 'Retry after server error' };
            },

            timeout: async () => {
                console.log('⏱️ Request timeout, retrying with longer timeout...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                return { success: true, message: 'Retry with extended timeout' };
            },

            rate_limited: async () => {
                console.log('⏱️ Rate limited, waiting...');
                await new Promise(resolve => setTimeout(resolve, 10000));
                return { success: true, message: 'Rate limit wait completed' };
            },

            unauthorized: async () => {
                console.log('🔐 Unauthorized, refreshing auth...');
                if (window.dea?.auth?.login) {
                    await window.dea.auth.login();
                    return { success: true, message: 'Redirected to login' };
                }
                return { success: false, message: 'Auth refresh not available' };
            }
        };

        return strategies[errorType] || strategies.connection_failed;
    }
}

/**
 * Utility function to set up all service error handlers
 */
export function setupServiceErrorHandlers() {
    console.log('🔧 Setting up service error handlers...');

    // The handlers are automatically set up when errors occur
    // This function can be used to register additional listeners if needed

    window.addEventListener('auth0Error', (event) => {
        console.log('🔐 Auth0 error detected:', event.detail);
    });

    window.addEventListener('stripeError', (event) => {
        console.log('💳 Stripe error detected:', event.detail);
    });

    window.addEventListener('mongoError', (event) => {
        console.log('📊 MongoDB error detected:', event.detail);
    });

    window.addEventListener('networkError', (event) => {
        console.log('🌐 Network error detected:', event.detail);
    });

    console.log('✅ Service error handlers ready');
}

// Export all handlers
export {
    Auth0ErrorHandler,
    StripeErrorHandler,
    MongoDBErrorHandler,
    NetworkErrorHandler
};