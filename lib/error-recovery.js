/**
 * Error Recovery System for Digital English Academy
 * Advanced recovery mechanisms with exponential backoff and graceful degradation
 */

export class ErrorRecoverySystem {
    constructor() {
        this.recoveryAttempts = new Map();
        this.maxRetryAttempts = 3;
        this.baseRetryDelay = 1000; // 1 second
        this.maxRetryDelay = 30000; // 30 seconds
        this.circuitBreakers = new Map();
        this.fallbackStrategies = new Map();
        this.recoveryCallbacks = new Map();

        this.setupFallbackStrategies();
        this.setupRecoveryCallbacks();
    }

    /**
     * Attempt automatic recovery with exponential backoff
     */
    async attemptRecovery(errorContext, recoveryFunction) {
        const errorKey = this.getErrorKey(errorContext);
        const attempts = this.recoveryAttempts.get(errorKey) || 0;

        if (attempts >= this.maxRetryAttempts) {
            console.warn(`Max retry attempts reached for ${errorKey}`);
            return this.executeGracefulDegradation(errorContext);
        }

        // Check circuit breaker
        if (this.isCircuitBreakerOpen(errorKey)) {
            console.warn(`Circuit breaker open for ${errorKey}`);
            return this.executeFallbackStrategy(errorContext);
        }

        try {
            console.log(`🔄 Recovery attempt ${attempts + 1} for ${errorKey}`);

            // Calculate delay with exponential backoff
            const delay = this.calculateRetryDelay(attempts);
            if (delay > 0) {
                await this.sleep(delay);
            }

            // Attempt recovery
            const result = await recoveryFunction();

            if (result.success) {
                // Reset attempts on success
                this.recoveryAttempts.delete(errorKey);
                this.resetCircuitBreaker(errorKey);
                console.log(`✅ Recovery successful for ${errorKey}`);

                // Execute success callback
                await this.executeRecoveryCallback(errorContext, 'success', result);

                return result;
            } else {
                throw new Error(result.message || 'Recovery function returned failure');
            }

        } catch (recoveryError) {
            console.error(`❌ Recovery attempt ${attempts + 1} failed for ${errorKey}:`, recoveryError);

            // Increment attempts
            this.recoveryAttempts.set(errorKey, attempts + 1);

            // Update circuit breaker
            this.updateCircuitBreaker(errorKey, false);

            // Execute failure callback
            await this.executeRecoveryCallback(errorContext, 'failure', { error: recoveryError, attempts: attempts + 1 });

            // If max attempts reached, try graceful degradation
            if (attempts + 1 >= this.maxRetryAttempts) {
                return this.executeGracefulDegradation(errorContext);
            }

            // Otherwise, schedule next retry
            return this.scheduleRetry(errorContext, recoveryFunction);
        }
    }

    /**
     * Schedule next retry attempt
     */
    async scheduleRetry(errorContext, recoveryFunction) {
        const errorKey = this.getErrorKey(errorContext);
        const attempts = this.recoveryAttempts.get(errorKey) || 0;
        const delay = this.calculateRetryDelay(attempts);

        console.log(`⏰ Scheduling retry for ${errorKey} in ${delay}ms`);

        setTimeout(() => {
            this.attemptRecovery(errorContext, recoveryFunction);
        }, delay);

        return {
            success: false,
            message: `Retry scheduled in ${delay}ms`,
            nextAttempt: Date.now() + delay
        };
    }

    /**
     * Calculate retry delay with exponential backoff
     */
    calculateRetryDelay(attempts) {
        const delay = this.baseRetryDelay * Math.pow(2, attempts);
        return Math.min(delay, this.maxRetryDelay);
    }

    /**
     * Execute graceful degradation
     */
    async executeGracefulDegradation(errorContext) {
        console.log(`🔄 Executing graceful degradation for ${errorContext.errorType}`);

        const degradationStrategy = this.getDegradationStrategy(errorContext.errorType);

        try {
            const result = await degradationStrategy(errorContext);
            console.log(`✅ Graceful degradation successful:`, result);

            // Execute degradation callback
            await this.executeRecoveryCallback(errorContext, 'degradation', result);

            return result;
        } catch (degradationError) {
            console.error(`❌ Graceful degradation failed:`, degradationError);

            // Last resort: show user-friendly error
            return this.executeLastResort(errorContext);
        }
    }

    /**
     * Execute fallback strategy
     */
    async executeFallbackStrategy(errorContext) {
        console.log(`🔄 Executing fallback strategy for ${errorContext.errorType}`);

        const fallbackStrategy = this.fallbackStrategies.get(errorContext.errorType);
        if (!fallbackStrategy) {
            return this.executeGracefulDegradation(errorContext);
        }

        try {
            const result = await fallbackStrategy(errorContext);
            console.log(`✅ Fallback strategy successful:`, result);

            // Execute fallback callback
            await this.executeRecoveryCallback(errorContext, 'fallback', result);

            return result;
        } catch (fallbackError) {
            console.error(`❌ Fallback strategy failed:`, fallbackError);
            return this.executeGracefulDegradation(errorContext);
        }
    }

    /**
     * Execute last resort recovery
     */
    async executeLastResort(errorContext) {
        console.log(`🚨 Executing last resort for ${errorContext.errorType}`);

        // Show critical error message and offer page reload
        const message = this.getLastResortMessage(errorContext.errorType);

        return {
            success: false,
            message: 'Last resort executed',
            action: 'critical_error_shown',
            userMessage: message
        };
    }

    /**
     * Get last resort message for error type
     */
    getLastResortMessage(errorType) {
        const messages = {
            authentication: 'No se pudo restaurar tu sesión. La página se recargará para intentar solucionarlo.',
            network: 'Problemas de conexión persistentes. Verifica tu internet y recarga la página.',
            payment: 'Error en el sistema de pagos. Por favor, contacta soporte si el problema persiste.',
            database: 'Error de base de datos. Algunos datos pueden no estar disponibles temporalmente.',
            initialization: 'Error crítico de inicialización. La aplicación se recargará automáticamente.',
            javascript: 'Error crítico en la aplicación. Se recargará automáticamente para solucionarlo.'
        };

        return messages[errorType] || 'Error crítico. La aplicación necesita recargarse.';
    }

    /**
     * Setup fallback strategies for different error types
     */
    setupFallbackStrategies() {
        // Authentication fallback: Use guest mode
        this.fallbackStrategies.set('authentication', async (errorContext) => {
            console.log('🔄 Using guest mode fallback');

            // Clear auth state
            if (window.deaAuth) {
                window.deaAuth.user = null;
            }

            // Update UI to guest mode
            this.updateUIForGuestMode();

            return {
                success: true,
                message: 'Switched to guest mode',
                mode: 'guest'
            };
        });

        // Network fallback: Use cached data
        this.fallbackStrategies.set('network', async (errorContext) => {
            console.log('🔄 Using cached data fallback');

            // Try to load from localStorage/sessionStorage
            const cachedData = this.loadCachedData(errorContext);

            if (cachedData) {
                return {
                    success: true,
                    message: 'Using cached data',
                    data: cachedData,
                    mode: 'offline'
                };
            }

            throw new Error('No cached data available');
        });

        // Database fallback: Use local storage
        this.fallbackStrategies.set('database', async (errorContext) => {
            console.log('🔄 Using local storage fallback');

            // Switch to localStorage-based data management
            this.enableLocalStorageMode();

            return {
                success: true,
                message: 'Switched to local storage mode',
                mode: 'local'
            };
        });

        // Payment fallback: Disable payment features
        this.fallbackStrategies.set('payment', async (errorContext) => {
            console.log('🔄 Disabling payment features');

            // Hide payment UI elements
            this.disablePaymentFeatures();

            return {
                success: true,
                message: 'Payment features disabled',
                mode: 'free_only'
            };
        });

        // Resource loading fallback: Use minimal UI
        this.fallbackStrategies.set('resource_loading', async (errorContext) => {
            console.log('🔄 Using minimal UI fallback');

            // Switch to basic CSS and minimal features
            this.enableMinimalMode();

            return {
                success: true,
                message: 'Switched to minimal mode',
                mode: 'minimal'
            };
        });
    }

    /**
     * Setup recovery callbacks for different scenarios
     */
    setupRecoveryCallbacks() {
        // Success callback: Re-enable features
        this.recoveryCallbacks.set('success', async (errorContext, result) => {
            console.log('🎉 Recovery successful, re-enabling features');

            // Re-enable disabled features based on error type
            switch (errorContext.errorType) {
                case 'authentication':
                    this.restoreAuthenticationFeatures();
                    break;
                case 'network':
                    this.restoreNetworkFeatures();
                    break;
                case 'payment':
                    this.restorePaymentFeatures();
                    break;
                case 'database':
                    this.restoreDatabaseFeatures();
                    break;
            }

            // Show success notification
            this.showRecoveryNotification('success', 'Conexión restaurada exitosamente');
        });

        // Failure callback: Update user about ongoing issues
        this.recoveryCallbacks.set('failure', async (errorContext, result) => {
            console.log('⚠️ Recovery failed, updating user');

            if (result.attempts >= this.maxRetryAttempts) {
                this.showRecoveryNotification('warning', 'Problemas persistentes detectados. Cambiando a modo limitado.');
            }
        });

        // Degradation callback: Inform user about limited functionality
        this.recoveryCallbacks.set('degradation', async (errorContext, result) => {
            console.log('📉 Graceful degradation executed');

            const message = this.getDegradationMessage(errorContext.errorType);
            this.showRecoveryNotification('info', message);
        });

        // Fallback callback: Inform user about fallback mode
        this.recoveryCallbacks.set('fallback', async (errorContext, result) => {
            console.log('🔄 Fallback strategy executed');

            const message = this.getFallbackMessage(errorContext.errorType, result.mode);
            this.showRecoveryNotification('info', message);
        });
    }

    /**
     * Get degradation strategy for error type
     */
    getDegradationStrategy(errorType) {
        const strategies = {
            authentication: async (errorContext) => {
                // Disable auth-required features
                this.disableAuthRequiredFeatures();
                return { success: true, message: 'Auth features disabled', mode: 'no_auth' };
            },

            network: async (errorContext) => {
                // Enable offline mode
                this.enableOfflineMode();
                return { success: true, message: 'Offline mode enabled', mode: 'offline' };
            },

            payment: async (errorContext) => {
                // Show free content only
                this.showFreeContentOnly();
                return { success: true, message: 'Free content mode', mode: 'free' };
            },

            database: async (errorContext) => {
                // Use static content
                this.useStaticContent();
                return { success: true, message: 'Static content mode', mode: 'static' };
            },

            javascript: async (errorContext) => {
                // Reload page after delay
                setTimeout(() => location.reload(), 5000);
                return { success: true, message: 'Page reload scheduled', mode: 'reload' };
            }
        };

        return strategies[errorType] || strategies.javascript;
    }

    /**
     * Circuit breaker methods
     */
    isCircuitBreakerOpen(errorKey) {
        const breaker = this.circuitBreakers.get(errorKey);
        if (!breaker) return false;

        const now = Date.now();
        return breaker.state === 'open' && now < breaker.nextAttempt;
    }

    updateCircuitBreaker(errorKey, success) {
        const breaker = this.circuitBreakers.get(errorKey) || {
            failures: 0,
            state: 'closed',
            nextAttempt: 0
        };

        if (success) {
            breaker.failures = 0;
            breaker.state = 'closed';
        } else {
            breaker.failures++;
            if (breaker.failures >= 5) {
                breaker.state = 'open';
                breaker.nextAttempt = Date.now() + 60000; // 1 minute
            }
        }

        this.circuitBreakers.set(errorKey, breaker);
    }

    resetCircuitBreaker(errorKey) {
        this.circuitBreakers.delete(errorKey);
    }

    /**
     * Utility methods for UI updates
     */
    updateUIForGuestMode() {
        // Hide auth-required elements
        const authElements = document.querySelectorAll('[data-auth-required]');
        authElements.forEach(el => el.style.display = 'none');

        // Show guest message
        const header = document.querySelector('.site-header .cta-group');
        if (header) {
            header.innerHTML = `
        <span class="guest-mode-indicator" style="color: #856404; font-size: 0.9rem;">
          Modo invitado - Funcionalidad limitada
        </span>
      `;
        }
    }

    disablePaymentFeatures() {
        const paymentElements = document.querySelectorAll('[data-payment-required]');
        paymentElements.forEach(el => {
            el.style.opacity = '0.5';
            el.style.pointerEvents = 'none';
        });
    }

    enableLocalStorageMode() {
        // Set flag for data layer to use localStorage
        localStorage.setItem('dea_storage_mode', 'local');
        console.log('📦 Local storage mode enabled');
    }

    enableMinimalMode() {
        document.body.classList.add('dea-minimal-mode');

        // Add minimal mode styles
        if (!document.querySelector('#dea-minimal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'dea-minimal-styles';
            styles.textContent = `
        .dea-minimal-mode .fancy-animation { display: none !important; }
        .dea-minimal-mode .non-essential { display: none !important; }
        .dea-minimal-mode .app-bg-video { display: none !important; }
      `;
            document.head.appendChild(styles);
        }
    }

    showRecoveryNotification(type, message) {
        // Create recovery notification
        const notification = document.createElement('div');
        notification.className = `dea-recovery-notification dea-recovery-${type}`;
        notification.innerHTML = `
      <div class="dea-recovery-content">
        <div class="dea-recovery-icon">
          ${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}
        </div>
        <div class="dea-recovery-message">${message}</div>
      </div>
    `;

        // Add styles if not present
        this.addRecoveryNotificationStyles();

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after delay
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    addRecoveryNotificationStyles() {
        if (document.querySelector('#dea-recovery-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'dea-recovery-styles';
        styles.textContent = `
      .dea-recovery-notification {
        position: fixed;
        bottom: 20px;
        left: 20px;
        max-width: 300px;
        padding: 12px;
        border-radius: 6px;
        z-index: 9999;
        font-family: system-ui;
        font-size: 14px;
        animation: slideInLeft 0.3s ease-out;
      }
      
      .dea-recovery-success {
        background: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
      }
      
      .dea-recovery-warning {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        color: #856404;
      }
      
      .dea-recovery-info {
        background: #d1ecf1;
        border: 1px solid #bee5eb;
        color: #0c5460;
      }
      
      .dea-recovery-content {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      @keyframes slideInLeft {
        from {
          transform: translateX(-100%);
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
     * Helper methods
     */
    getErrorKey(errorContext) {
        return `${errorContext.errorType}_${errorContext.url || 'unknown'}`;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    loadCachedData(errorContext) {
        const cacheKey = `dea_cache_${errorContext.errorType}`;
        const cached = localStorage.getItem(cacheKey);
        return cached ? JSON.parse(cached) : null;
    }

    getDegradationMessage(errorType) {
        const messages = {
            authentication: 'Funcionando en modo limitado sin autenticación',
            network: 'Modo sin conexión activado - usando datos guardados',
            payment: 'Sistema de pagos temporalmente deshabilitado',
            database: 'Usando contenido estático temporalmente'
        };

        return messages[errorType] || 'Funcionando en modo limitado';
    }

    getFallbackMessage(errorType, mode) {
        const messages = {
            guest: 'Cambiado a modo invitado',
            offline: 'Modo sin conexión activado',
            local: 'Usando almacenamiento local',
            free_only: 'Solo contenido gratuito disponible',
            minimal: 'Modo básico activado'
        };

        return messages[mode] || 'Modo alternativo activado';
    }

    // Placeholder methods for feature restoration
    restoreAuthenticationFeatures() { console.log('🔐 Auth features restored'); }
    restoreNetworkFeatures() { console.log('🌐 Network features restored'); }
    restorePaymentFeatures() { console.log('💳 Payment features restored'); }
    restoreDatabaseFeatures() { console.log('📊 Database features restored'); }

    disableAuthRequiredFeatures() { console.log('🔒 Auth-required features disabled'); }
    enableOfflineMode() { console.log('📴 Offline mode enabled'); }
    showFreeContentOnly() { console.log('🆓 Free content only'); }
    useStaticContent() { console.log('📄 Static content mode'); }

    /**
     * Execute recovery callback
     */
    async executeRecoveryCallback(errorContext, callbackType, result) {
        const callback = this.recoveryCallbacks.get(callbackType);
        if (callback) {
            try {
                await callback(errorContext, result);
            } catch (callbackError) {
                console.error(`Recovery callback ${callbackType} failed:`, callbackError);
            }
        }
    }

    /**
     * Get recovery statistics
     */
    getRecoveryStatistics() {
        return {
            totalAttempts: Array.from(this.recoveryAttempts.values()).reduce((sum, attempts) => sum + attempts, 0),
            activeCircuitBreakers: Array.from(this.circuitBreakers.entries()).filter(([key, breaker]) => breaker.state === 'open').length,
            recoveryAttempts: Object.fromEntries(this.recoveryAttempts),
            circuitBreakers: Object.fromEntries(this.circuitBreakers)
        };
    }
}

// Export singleton instance
export const errorRecovery = new ErrorRecoverySystem();