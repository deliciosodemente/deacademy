/**
 * Error Boundary System for Digital English Academy
 * Handles global error catching, classification, and recovery
 */

export class ErrorBoundary {
    constructor() {
        this.errorHistory = [];
        this.errorCounts = new Map();
        this.recoveryStrategies = new Map();
        this.isInitialized = false;
        this.maxErrorHistory = 50;
        this.errorReportingEndpoint = null;

        // Error categories
        this.errorCategories = {
            INITIALIZATION: 'initialization',
            AUTHENTICATION: 'authentication',
            NETWORK: 'network',
            PAYMENT: 'payment',
            DATABASE: 'database',
            JAVASCRIPT: 'javascript',
            RESOURCE_LOADING: 'resource_loading',
            USER_INPUT: 'user_input',
            UNKNOWN: 'unknown'
        };

        // Initialize recovery strategies
        this.setupRecoveryStrategies();
    }

    /**
     * Initialize the error boundary system
     */
    initialize(config = {}) {
        if (this.isInitialized) return;

        this.errorReportingEndpoint = config.reportingEndpoint;

        // Set up global error handlers
        this.setupGlobalErrorHandlers();

        // Set up unhandled promise rejection handler
        this.setupPromiseRejectionHandler();

        // Set up custom error event listeners
        this.setupCustomErrorHandlers();

        this.isInitialized = true;
        console.log('🛡️ Error Boundary System initialized');
    }

    /**
     * Set up global error handlers
     */
    setupGlobalErrorHandlers() {
        window.addEventListener('error', (event) => {
            const errorContext = {
                type: this.errorCategories.JAVASCRIPT,
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                timestamp: new Date(),
                userAgent: navigator.userAgent,
                url: window.location.href,
                userId: this.getCurrentUserId(),
                sessionId: this.getSessionId()
            };

            this.captureError(event.error || new Error(event.message), errorContext);
        });
    }

    /**
     * Set up promise rejection handler
     */
    setupPromiseRejectionHandler() {
        window.addEventListener('unhandledrejection', (event) => {
            const errorContext = {
                type: this.errorCategories.JAVASCRIPT,
                message: 'Unhandled Promise Rejection',
                reason: event.reason,
                timestamp: new Date(),
                userAgent: navigator.userAgent,
                url: window.location.href,
                userId: this.getCurrentUserId(),
                sessionId: this.getSessionId()
            };

            this.captureError(event.reason, errorContext);
        });
    }

    /**
     * Set up custom error handlers for specific scenarios
     */
    setupCustomErrorHandlers() {
        // Auth0 errors
        window.addEventListener('auth0Error', (event) => {
            this.captureError(event.detail.error, {
                type: this.errorCategories.AUTHENTICATION,
                context: 'Auth0',
                additionalInfo: event.detail
            });
        });

        // Stripe errors
        window.addEventListener('stripeError', (event) => {
            this.captureError(event.detail.error, {
                type: this.errorCategories.PAYMENT,
                context: 'Stripe',
                additionalInfo: event.detail
            });
        });

        // MongoDB errors
        window.addEventListener('mongoError', (event) => {
            this.captureError(event.detail.error, {
                type: this.errorCategories.DATABASE,
                context: 'MongoDB',
                additionalInfo: event.detail
            });
        });

        // Network errors
        window.addEventListener('networkError', (event) => {
            this.captureError(event.detail.error, {
                type: this.errorCategories.NETWORK,
                context: 'Network Request',
                additionalInfo: event.detail
            });
        });
    }

    /**
     * Capture and process an error
     */
    captureError(error, context = {}) {
        try {
            // Create comprehensive error context
            const errorContext = {
                timestamp: new Date(),
                errorType: this.categorizeError(error, context),
                message: error?.message || 'Unknown error',
                stack: error?.stack || 'No stack trace available',
                userAgent: navigator.userAgent,
                url: window.location.href,
                userId: this.getCurrentUserId(),
                sessionId: this.getSessionId(),
                additionalContext: context,
                errorId: this.generateErrorId(),
                ...context
            };

            // Add to error history
            this.addToErrorHistory(errorContext);

            // Update error counts
            this.updateErrorCounts(errorContext.errorType);

            // Log error (with different levels based on severity)
            this.logError(errorContext);

            // Show user-friendly message
            this.showUserFriendlyMessage(errorContext);

            // Attempt recovery
            this.attemptRecovery(errorContext);

            // Report error to external service
            this.reportError(errorContext);

            return errorContext.errorId;

        } catch (boundaryError) {
            // Prevent infinite error loops
            console.error('Error in error boundary:', boundaryError);
            this.showCriticalErrorMessage();
        }
    }

    /**
     * Categorize error based on error object and context
     */
    categorizeError(error, context) {
        if (context.type) return context.type;

        const message = error?.message?.toLowerCase() || '';
        const stack = error?.stack?.toLowerCase() || '';

        // Authentication errors
        if (message.includes('auth') || message.includes('login') || message.includes('token')) {
            return this.errorCategories.AUTHENTICATION;
        }

        // Network errors
        if (message.includes('fetch') || message.includes('network') || message.includes('cors')) {
            return this.errorCategories.NETWORK;
        }

        // Payment errors
        if (message.includes('stripe') || message.includes('payment') || message.includes('card')) {
            return this.errorCategories.PAYMENT;
        }

        // Database errors
        if (message.includes('mongo') || message.includes('database') || message.includes('collection')) {
            return this.errorCategories.DATABASE;
        }

        // Resource loading errors
        if (message.includes('loading') || message.includes('script') || message.includes('css')) {
            return this.errorCategories.RESOURCE_LOADING;
        }

        // Initialization errors
        if (message.includes('initialize') || message.includes('bootstrap') || message.includes('config')) {
            return this.errorCategories.INITIALIZATION;
        }

        return this.errorCategories.JAVASCRIPT;
    }

    /**
     * Add error to history with size limit
     */
    addToErrorHistory(errorContext) {
        this.errorHistory.unshift(errorContext);

        // Keep only the most recent errors
        if (this.errorHistory.length > this.maxErrorHistory) {
            this.errorHistory = this.errorHistory.slice(0, this.maxErrorHistory);
        }
    }

    /**
     * Update error counts for analytics
     */
    updateErrorCounts(errorType) {
        const count = this.errorCounts.get(errorType) || 0;
        this.errorCounts.set(errorType, count + 1);
    }

    /**
     * Log error with appropriate level
     */
    logError(errorContext) {
        const logLevel = this.getLogLevel(errorContext.errorType);
        const logMessage = `[${errorContext.errorType.toUpperCase()}] ${errorContext.message}`;

        switch (logLevel) {
            case 'error':
                console.error(logMessage, errorContext);
                break;
            case 'warn':
                console.warn(logMessage, errorContext);
                break;
            case 'info':
                console.info(logMessage, errorContext);
                break;
            default:
                console.log(logMessage, errorContext);
        }
    }

    /**
     * Get appropriate log level for error type
     */
    getLogLevel(errorType) {
        const criticalErrors = [
            this.errorCategories.INITIALIZATION,
            this.errorCategories.AUTHENTICATION,
            this.errorCategories.PAYMENT
        ];

        const warningErrors = [
            this.errorCategories.NETWORK,
            this.errorCategories.DATABASE,
            this.errorCategories.RESOURCE_LOADING
        ];

        if (criticalErrors.includes(errorType)) return 'error';
        if (warningErrors.includes(errorType)) return 'warn';
        return 'info';
    }

    /**
     * Show user-friendly error message
     */
    showUserFriendlyMessage(errorContext) {
        const message = this.getUserFriendlyMessage(errorContext.errorType);
        const severity = this.getErrorSeverity(errorContext.errorType);

        // Don't show UI for low-severity errors
        if (severity === 'low') return;

        this.displayErrorNotification(message, severity, errorContext);
    }

    /**
     * Get user-friendly message for error type
     */
    getUserFriendlyMessage(errorType) {
        const messages = {
            [this.errorCategories.INITIALIZATION]: 'La aplicación está teniendo problemas al iniciar. Por favor, recarga la página.',
            [this.errorCategories.AUTHENTICATION]: 'Hubo un problema con tu sesión. Por favor, inicia sesión nuevamente.',
            [this.errorCategories.NETWORK]: 'Problemas de conexión. Verifica tu internet e intenta nuevamente.',
            [this.errorCategories.PAYMENT]: 'Error en el procesamiento del pago. Por favor, intenta nuevamente.',
            [this.errorCategories.DATABASE]: 'Error al cargar los datos. Por favor, intenta nuevamente.',
            [this.errorCategories.RESOURCE_LOADING]: 'Algunos recursos no se cargaron correctamente.',
            [this.errorCategories.JAVASCRIPT]: 'Ocurrió un error inesperado. La página se recargará automáticamente.',
            [this.errorCategories.USER_INPUT]: 'Hay un problema con la información ingresada.',
            [this.errorCategories.UNKNOWN]: 'Ocurrió un error inesperado. Por favor, intenta nuevamente.'
        };

        return messages[errorType] || messages[this.errorCategories.UNKNOWN];
    }

    /**
     * Get error severity level
     */
    getErrorSeverity(errorType) {
        const highSeverity = [
            this.errorCategories.INITIALIZATION,
            this.errorCategories.AUTHENTICATION,
            this.errorCategories.PAYMENT
        ];

        const mediumSeverity = [
            this.errorCategories.NETWORK,
            this.errorCategories.DATABASE,
            this.errorCategories.JAVASCRIPT
        ];

        if (highSeverity.includes(errorType)) return 'high';
        if (mediumSeverity.includes(errorType)) return 'medium';
        return 'low';
    }

    /**
     * Display error notification to user
     */
    displayErrorNotification(message, severity, errorContext) {
        // Remove existing error notifications
        const existingNotifications = document.querySelectorAll('.dea-error-notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `dea-error-notification dea-error-${severity}`;
        notification.innerHTML = `
      <div class="dea-error-content">
        <div class="dea-error-icon">
          ${severity === 'high' ? '🚨' : severity === 'medium' ? '⚠️' : 'ℹ️'}
        </div>
        <div class="dea-error-message">${message}</div>
        <div class="dea-error-actions">
          ${this.getErrorActions(errorContext)}
        </div>
        <button class="dea-error-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

        // Add styles
        this.addErrorNotificationStyles();

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after delay (except for high severity)
        if (severity !== 'high') {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, severity === 'medium' ? 8000 : 5000);
        }
    }

    /**
     * Get appropriate actions for error type
     */
    getErrorActions(errorContext) {
        const actions = [];

        switch (errorContext.errorType) {
            case this.errorCategories.AUTHENTICATION:
                actions.push('<button onclick="window.dea?.auth?.login()" class="dea-error-action">Iniciar Sesión</button>');
                break;
            case this.errorCategories.NETWORK:
                actions.push('<button onclick="location.reload()" class="dea-error-action">Reintentar</button>');
                break;
            case this.errorCategories.INITIALIZATION:
            case this.errorCategories.JAVASCRIPT:
                actions.push('<button onclick="location.reload()" class="dea-error-action">Recargar Página</button>');
                break;
        }

        return actions.join('');
    }

    /**
     * Add CSS styles for error notifications
     */
    addErrorNotificationStyles() {
        if (document.querySelector('#dea-error-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'dea-error-styles';
        styles.textContent = `
      .dea-error-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        z-index: 10000;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: system-ui, -apple-system, sans-serif;
        animation: slideIn 0.3s ease-out;
      }
      
      .dea-error-high {
        background: #fee;
        border: 1px solid #fcc;
        color: #c33;
      }
      
      .dea-error-medium {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        color: #856404;
      }
      
      .dea-error-low {
        background: #d1ecf1;
        border: 1px solid #bee5eb;
        color: #0c5460;
      }
      
      .dea-error-content {
        padding: 16px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        position: relative;
      }
      
      .dea-error-icon {
        font-size: 20px;
        flex-shrink: 0;
      }
      
      .dea-error-message {
        flex: 1;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .dea-error-actions {
        margin-top: 8px;
        display: flex;
        gap: 8px;
      }
      
      .dea-error-action {
        background: rgba(0,0,0,0.1);
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .dea-error-action:hover {
        background: rgba(0,0,0,0.2);
      }
      
      .dea-error-close {
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        opacity: 0.6;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .dea-error-close:hover {
        opacity: 1;
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;

        document.head.appendChild(styles);
    }

    /**
     * Show critical error message when error boundary itself fails
     */
    showCriticalErrorMessage() {
        document.body.insertAdjacentHTML('beforeend', `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 99999; display: flex; align-items: center; justify-content: center; color: white; font-family: system-ui;">
        <div style="background: #333; padding: 2rem; border-radius: 8px; text-align: center; max-width: 400px;">
          <h2 style="margin: 0 0 1rem 0; color: #ff6b6b;">Error Crítico</h2>
          <p style="margin: 0 0 1.5rem 0;">La aplicación ha encontrado un error crítico y necesita reiniciarse.</p>
          <button onclick="location.reload()" style="background: #0a66ff; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; font-size: 1rem;">
            Recargar Aplicación
          </button>
        </div>
      </div>
    `);
    }

    /**
     * Set up recovery strategies
     */
    setupRecoveryStrategies() {
        // Authentication recovery
        this.recoveryStrategies.set(this.errorCategories.AUTHENTICATION, async (errorContext) => {
            console.log('🔄 Attempting authentication recovery...');
            try {
                if (window.deaAuth?.client) {
                    await window.deaAuth.client.logout({ returnTo: window.location.origin });
                }
                return { success: true, message: 'Redirected to login' };
            } catch (error) {
                return { success: false, message: 'Failed to logout' };
            }
        });

        // Network recovery
        this.recoveryStrategies.set(this.errorCategories.NETWORK, async (errorContext) => {
            console.log('🔄 Attempting network recovery...');
            try {
                // Wait a bit and retry
                await new Promise(resolve => setTimeout(resolve, 2000));
                const response = await fetch(window.location.href, { method: 'HEAD' });
                return { success: response.ok, message: response.ok ? 'Network recovered' : 'Network still down' };
            } catch (error) {
                return { success: false, message: 'Network recovery failed' };
            }
        });

        // JavaScript error recovery
        this.recoveryStrategies.set(this.errorCategories.JAVASCRIPT, async (errorContext) => {
            console.log('🔄 Attempting JavaScript error recovery...');

            // For critical JS errors, reload the page
            if (this.errorCounts.get(this.errorCategories.JAVASCRIPT) > 3) {
                setTimeout(() => location.reload(), 3000);
                return { success: true, message: 'Page will reload in 3 seconds' };
            }

            return { success: false, message: 'No recovery strategy for JS error' };
        });
    }

    /**
     * Attempt recovery based on error type
     */
    async attemptRecovery(errorContext) {
        // First try the advanced recovery system
        try {
            const { errorRecovery } = await import('./error-recovery.js');

            const strategy = this.recoveryStrategies.get(errorContext.errorType);
            if (strategy) {
                const result = await errorRecovery.attemptRecovery(errorContext, strategy);
                console.log(`Advanced recovery attempt for ${errorContext.errorType}:`, result);
                return result;
            }
        } catch (recoveryError) {
            console.error('Advanced recovery failed, trying basic recovery:', recoveryError);
        }

        // Fallback to basic recovery
        const strategy = this.recoveryStrategies.get(errorContext.errorType);
        if (!strategy) return null;

        try {
            const result = await strategy(errorContext);
            console.log(`Basic recovery attempt for ${errorContext.errorType}:`, result);
            return result;
        } catch (recoveryError) {
            console.error('Basic recovery strategy failed:', recoveryError);
            return { success: false, message: 'Recovery strategy failed' };
        }
    }

    /**
     * Report error to external service
     */
    async reportError(errorContext, metadata = {}) {
        if (!this.errorReportingEndpoint) return;

        try {
            const reportData = {
                ...errorContext,
                metadata: {
                    ...metadata,
                    userAgent: navigator.userAgent,
                    timestamp: errorContext.timestamp.toISOString(),
                    pageUrl: window.location.href,
                    referrer: document.referrer
                }
            };

            // Don't block the UI for error reporting
            fetch(this.errorReportingEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reportData)
            }).catch(reportingError => {
                console.warn('Failed to report error:', reportingError);
            });

        } catch (error) {
            console.warn('Error reporting failed:', error);
        }
    }

    /**
     * Get error history
     */
    getErrorHistory() {
        return [...this.errorHistory];
    }

    /**
     * Get error statistics
     */
    getErrorStatistics() {
        return {
            totalErrors: this.errorHistory.length,
            errorsByType: Object.fromEntries(this.errorCounts),
            recentErrors: this.errorHistory.slice(0, 10),
            mostCommonError: this.getMostCommonError()
        };
    }

    /**
     * Get most common error type
     */
    getMostCommonError() {
        let maxCount = 0;
        let mostCommon = null;

        for (const [errorType, count] of this.errorCounts) {
            if (count > maxCount) {
                maxCount = count;
                mostCommon = errorType;
            }
        }

        return mostCommon;
    }

    /**
     * Utility methods
     */
    getCurrentUserId() {
        return window.deaAuth?.user?.sub || 'anonymous';
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('dea_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('dea_session_id', sessionId);
        }
        return sessionId;
    }

    generateErrorId() {
        return 'error_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Clear error history
     */
    clearErrorHistory() {
        this.errorHistory = [];
        this.errorCounts.clear();
        console.log('🧹 Error history cleared');
    }
}

// Export singleton instance
export const errorBoundary = new ErrorBoundary();