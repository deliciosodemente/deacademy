/**
 * Enhanced Application Bootstrap System
 * Handles coordinated initialization with dependency injection and progressive loading
 */

import { configManager } from './configuration-manager.js';

export class AppBootstrap {
    constructor() {
        this.initializationStatus = {
            config: false,
            errorBoundary: false,
            performance: false,
            accessibility: false,
            resourceOptimizer: false,
            auth: false,
            database: false,
            payments: false,
            router: false,
            ui: false
        };
        this.initializationErrors = [];
        this.modules = new Map();
        this.dependencies = new Map();
        this.loadingQueue = [];
        this.criticalModules = ['config', 'errorBoundary', 'router'];
        this.optionalModules = ['auth', 'database', 'payments', 'performance', 'accessibility'];

        // Module definitions with dependencies
        this.moduleDefinitions = new Map([
            ['config', {
                dependencies: [],
                loader: () => this.initializeConfiguration(),
                critical: true
            }],
            ['errorBoundary', {
                dependencies: ['config'],
                loader: () => this.initializeErrorBoundary(),
                critical: true
            }],
            ['performance', {
                dependencies: ['config', 'errorBoundary'],
                loader: () => this.initializePerformanceMonitor(),
                critical: false
            }],
            ['accessibility', {
                dependencies: ['config'],
                loader: () => this.initializeAccessibility(),
                critical: false
            }],
            ['resourceOptimizer', {
                dependencies: ['config', 'performance'],
                loader: () => this.initializeResourceOptimizer(),
                critical: false
            }],
            ['auth', {
                dependencies: ['config', 'errorBoundary'],
                loader: () => this.initializeAuth(),
                critical: false
            }],
            ['database', {
                dependencies: ['config', 'auth'],
                loader: () => this.initializeDatabase(),
                critical: false
            }],
            ['payments', {
                dependencies: ['config', 'auth'],
                loader: () => this.initializePayments(),
                critical: false
            }],
            ['router', {
                dependencies: ['config'],
                loader: () => this.initializeRouter(),
                critical: true
            }],
            ['ui', {
                dependencies: ['config', 'accessibility'],
                loader: () => this.initializeUI(),
                critical: false
            }]
        ]);

        // Initialization tracking
        this.initializationStartTime = null;
        this.moduleLoadTimes = new Map();
        this.retryAttempts = new Map();
        this.maxRetries = 3;
    }

    /**
     * Main initialization method with dependency injection
     */
    async initialize(customConfig = {}) {
        this.initializationStartTime = performance.now();
        console.log('🚀 Starting Digital English Academy initialization...');

        try {
            // Step 1: Initialize critical modules first
            await this.initializeCriticalModules(customConfig);

            // Step 2: Initialize optional modules progressively
            await this.initializeOptionalModules();

            // Step 3: Final setup and health check
            await this.finalizeInitialization();

            const totalTime = performance.now() - this.initializationStartTime;
            console.log(`✅ Application initialization complete in ${totalTime.toFixed(2)}ms`);

            return this.getInitializationStatus();

        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            await this.handleInitializationError(error);
            throw error;
        }
    }

    /**
     * Initialize critical modules in dependency order
     */
    async initializeCriticalModules(customConfig = {}) {
        console.log('⚡ Initializing critical modules...');

        // Get critical modules in dependency order
        const criticalModules = this.resolveDependencyOrder(this.criticalModules);

        for (const moduleName of criticalModules) {
            await this.initializeModule(moduleName, customConfig);
        }

        console.log('✅ Critical modules initialized');
    }

    /**
     * Initialize optional modules progressively
     */
    async initializeOptionalModules() {
        console.log('🔄 Initializing optional modules...');

        // Get optional modules in dependency order
        const optionalModules = this.resolveDependencyOrder(this.optionalModules);

        // Initialize optional modules with error tolerance
        const initPromises = optionalModules.map(moduleName =>
            this.initializeModuleWithRetry(moduleName).catch(error => {
                console.warn(`⚠️ Optional module ${moduleName} failed to initialize:`, error);
                this.initializationErrors.push({ module: moduleName, error, optional: true });
            })
        );

        await Promise.allSettled(initPromises);
        console.log('✅ Optional modules initialization complete');
    }

    /**
     * Initialize a single module
     */
    async initializeModule(moduleName, customConfig = {}) {
        const startTime = performance.now();

        try {
            console.log(`🔧 Initializing ${moduleName}...`);

            const moduleDefinition = this.moduleDefinitions.get(moduleName);
            if (!moduleDefinition) {
                throw new Error(`Module definition not found: ${moduleName}`);
            }

            // Check dependencies
            const missingDeps = this.checkDependencies(moduleName);
            if (missingDeps.length > 0) {
                throw new Error(`Missing dependencies for ${moduleName}: ${missingDeps.join(', ')}`);
            }

            // Load the module
            const result = await moduleDefinition.loader(customConfig);

            // Store module instance
            if (result) {
                this.modules.set(moduleName, result);
            }

            // Mark as initialized
            this.initializationStatus[moduleName] = true;

            const loadTime = performance.now() - startTime;
            this.moduleLoadTimes.set(moduleName, loadTime);

            console.log(`✅ ${moduleName} initialized in ${loadTime.toFixed(2)}ms`);

        } catch (error) {
            const loadTime = performance.now() - startTime;
            this.moduleLoadTimes.set(moduleName, loadTime);

            console.error(`❌ Failed to initialize ${moduleName}:`, error);
            this.initializationErrors.push({ module: moduleName, error });

            // Re-throw for critical modules
            const moduleDefinition = this.moduleDefinitions.get(moduleName);
            if (moduleDefinition?.critical) {
                throw error;
            }
        }
    }

    /**
     * Initialize module with retry logic
     */
    async initializeModuleWithRetry(moduleName) {
        const maxRetries = this.maxRetries;
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await this.initializeModule(moduleName);
                return;
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ ${moduleName} initialization attempt ${attempt}/${maxRetries} failed:`, error);

                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                    console.log(`⏰ Retrying ${moduleName} in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    /**
     * Resolve dependency order for modules
     */
    resolveDependencyOrder(moduleNames) {
        const resolved = [];
        const resolving = new Set();

        const resolve = (moduleName) => {
            if (resolved.includes(moduleName)) return;
            if (resolving.has(moduleName)) {
                throw new Error(`Circular dependency detected: ${moduleName}`);
            }

            resolving.add(moduleName);

            const moduleDefinition = this.moduleDefinitions.get(moduleName);
            if (moduleDefinition) {
                for (const dependency of moduleDefinition.dependencies) {
                    if (moduleNames.includes(dependency)) {
                        resolve(dependency);
                    }
                }
            }

            resolving.delete(moduleName);
            resolved.push(moduleName);
        };

        for (const moduleName of moduleNames) {
            resolve(moduleName);
        }

        return resolved;
    }

    /**
     * Check if module dependencies are satisfied
     */
    checkDependencies(moduleName) {
        const moduleDefinition = this.moduleDefinitions.get(moduleName);
        if (!moduleDefinition) return [];

        return moduleDefinition.dependencies.filter(dep =>
            !this.initializationStatus[dep]
        );
    }

    /**
     * Initialize configuration system
     */
    async initializeConfiguration(customConfig = {}) {
        try {
            // Load environment configuration
            const config = configManager.loadEnvironmentConfig();

            // Apply custom overrides
            if (Object.keys(customConfig).length > 0) {
                configManager.updateConfig(customConfig);
            }

            // Validate configuration
            const validation = configManager.validateConfiguration();
            if (!validation.isValid) {
                throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
            }

            // Log warnings
            validation.warnings.forEach(warning => {
                console.warn('⚠️', warning);
            });

            // Log secure config in development
            if (configManager.isDevelopmentMode()) {
                console.log('🔧 Configuration:', configManager.getSecureConfig());
            }

            return configManager;

        } catch (error) {
            throw new Error(`Configuration initialization failed: ${error.message}`);
        }
    }

    /**
     * Initialize Error Boundary System
     */
    async initializeErrorBoundary() {
        try {
            const { errorBoundary } = await import('./error-boundary.js');
            const config = configManager.getConfig();

            errorBoundary.initialize({
                reportingEndpoint: config.performance?.reportingEndpoint
            });

            return errorBoundary;

        } catch (error) {
            throw new Error(`Error boundary initialization failed: ${error.message}`);
        }
    }

    /**
     * Initialize Performance Monitor
     */
    async initializePerformanceMonitor() {
        try {
            const { performanceMonitor } = await import('./performance-monitor.js');
            const config = configManager.getConfig();

            performanceMonitor.initialize({
                reportingEndpoint: config.performance?.reportingEndpoint,
                reportingInterval: config.performance?.reportingInterval,
                optimization: {
                    enablePreloading: config.features?.resourceOptimization,
                    enableLazyLoading: config.features?.lazyLoading
                }
            });

            return performanceMonitor;

        } catch (error) {
            throw new Error(`Performance monitor initialization failed: ${error.message}`);
        }
    }

    /**
     * Initialize Accessibility Manager
     */
    async initializeAccessibility() {
        try {
            const { accessibilityManager } = await import('./accessibility-manager.js');
            const config = configManager.getConfig();

            accessibilityManager.initialize({
                enableKeyboardNavigation: config.accessibility?.enableEnhancements,
                enableScreenReaderSupport: config.accessibility?.enableEnhancements,
                announceRouteChanges: config.accessibility?.announceRouteChanges,
                enableHighContrast: config.accessibility?.highContrastMode
            });

            return accessibilityManager;

        } catch (error) {
            throw new Error(`Accessibility manager initialization failed: ${error.message}`);
        }
    }

    /**
     * Initialize Resource Optimizer
     */
    async initializeResourceOptimizer() {
        try {
            const { resourceOptimizer } = await import('./resource-optimizer.js');
            const config = configManager.getConfig();

            resourceOptimizer.initialize({
                enablePreloading: config.features?.resourceOptimization,
                enableLazyLoading: config.features?.lazyLoading,
                enableResourceHints: config.features?.resourceHints,
                criticalResourceTimeout: config.performance?.criticalResourceTimeout
            });

            return resourceOptimizer;

        } catch (error) {
            throw new Error(`Resource optimizer initialization failed: ${error.message}`);
        }
    }

    /**
     * Load critical resources (CSS, fonts, etc.)
     */
    async loadCriticalResources() {
        console.log('📦 Loading critical resources...');

        const config = configManager.getConfig();
        const loadPromises = [];

        try {
            // Load Auth0 SDK if enabled
            if (config.features.auth0) {
                loadPromises.push(this.loadScript('https://cdn.auth0.com/js/auth0-spa-js/2.1/auth0-spa-js.production.js'));
            }

            // Load Stripe SDK if enabled
            if (config.features.stripe) {
                loadPromises.push(this.loadScript('https://js.stripe.com/v3/'));
            }

            // Load MongoDB driver (if using client-side operations)
            if (config.features.mongodb && config.environment === 'development') {
                // Note: In production, MongoDB operations should be server-side only
                console.log('📊 MongoDB client-side operations enabled for development');
            }

            // Wait for all critical resources
            await Promise.allSettled(loadPromises);

            console.log('✅ Critical resources loaded');

        } catch (error) {
            console.warn('⚠️ Some critical resources failed to load:', error);
            // Don't throw here - app can still function with degraded features
        }
    }

    /**
     * Initialize modules in dependency order
     */
    async initializeModules() {
        console.log('🔧 Initializing modules...');

        const config = configManager.getConfig();

        try {
            // Initialize Auth0 if enabled
            if (config.features.auth0) {
                await this.initializeAuth();
            }

            // Initialize database connection if enabled
            if (config.features.mongodb) {
                await this.initializeDatabase();
            }

            // Initialize Stripe if enabled
            if (config.features.stripe) {
                await this.initializePayments();
            }

            // Initialize router
            await this.initializeRouter();

            // Initialize UI components
            await this.initializeUI();

            console.log('✅ All modules initialized');

        } catch (error) {
            this.initializationErrors.push({ step: 'modules', error });
            throw error;
        }
    }

    /**
     * Initialize Auth0 authentication
     */
    async initializeAuth() {
        try {
            console.log('🔐 Initializing Auth0...');

            if (!window.createAuth0Client) {
                throw new Error('Auth0 SDK not loaded');
            }

            const config = configManager.getConfig();
            const { initAuth } = await import('../auth.js');

            // Update window.deaConfig for existing auth.js compatibility
            window.deaConfig = {
                ...window.deaConfig,
                auth0Domain: config.auth0.domain,
                auth0ClientId: config.auth0.clientId
            };

            await initAuth();
            this.initializationStatus.auth = true;
            console.log('✅ Auth0 initialized');

        } catch (error) {
            console.error('❌ Auth0 initialization failed:', error);
            // Don't throw - app can work without auth in degraded mode
            this.initializationErrors.push({ step: 'auth', error });
        }
    }

    /**
     * Initialize database connection
     */
    async initializeDatabase() {
        try {
            const { postgresManager } = await import('./postgresql-manager.js');
            this.dbManager = postgresManager;
            await this.dbManager.connect();
            this.initializationStatus.database = true;
            console.log('✅ Database initialized');

        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            this.initializationErrors.push({ step: 'database', error });
            // Don't throw - app can work with local storage fallback
        }
    }

    /**
     * Initialize Stripe payments
     */
    async initializePayments() {
        try {
            console.log('💳 Initializing Stripe...');

            if (!window.Stripe) {
                throw new Error('Stripe SDK not loaded');
            }

            const config = configManager.getConfig();
            const stripe = window.Stripe(config.stripe.publishableKey);

            // Update window.deaConfig for existing compatibility
            window.deaConfig = {
                ...window.deaConfig,
                stripePaymentLink: config.stripe.paymentLinkUrl
            };

            this.modules.set('stripe', stripe);
            this.initializationStatus.payments = true;
            console.log('✅ Stripe initialized');

        } catch (error) {
            console.error('❌ Stripe initialization failed:', error);
            this.initializationErrors.push({ step: 'payments', error });
            // Don't throw - app can work without payments
        }
    }

    /**
     * Initialize router
     */
    async initializeRouter() {
        try {
            console.log('🧭 Initializing router...');

            const { initRouter } = await import('../router.js');
            initRouter();

            this.initializationStatus.router = true;
            console.log('✅ Router initialized');

        } catch (error) {
            console.error('❌ Router initialization failed:', error);
            this.initializationErrors.push({ step: 'router', error });
            throw error; // Router is critical
        }
    }

    /**
     * Initialize UI components
     */
    async initializeUI() {
        try {
            console.log('🎨 Initializing UI...');

            const { setupHeader } = await import('../utils.js');
            setupHeader();

            this.initializationStatus.ui = true;
            console.log('✅ UI initialized');

        } catch (error) {
            console.error('❌ UI initialization failed:', error);
            this.initializationErrors.push({ step: 'ui', error });
            // Don't throw - basic UI can still work
        }
    }

    /**
     * Finalize initialization with progressive loading
     */
    async finalizeInitialization() {
        console.log('🏁 Finalizing initialization...');

        // Expose enhanced global API
        this.exposeGlobalAPI();

        // Set up progressive loading for non-critical features
        this.setupProgressiveLoading();

        // Perform health check
        const healthCheck = this.performHealthCheck();

        // Dispatch initialization complete event
        window.dispatchEvent(new CustomEvent('deaInitialized', {
            detail: {
                ...this.getInitializationStatus(),
                healthCheck,
                loadTimes: Object.fromEntries(this.moduleLoadTimes),
                totalInitTime: performance.now() - this.initializationStartTime
            }
        }));

        console.log('🎉 Digital English Academy ready!');
    }

    /**
     * Expose enhanced global API
     */
    exposeGlobalAPI() {
        window.dea = {
            ...window.dea,

            // Core systems
            config: configManager,
            bootstrap: this,
            modules: this.modules,

            // Enhanced API methods
            getModule: (name) => this.modules.get(name),
            reloadModule: (name) => this.reloadModule(name),
            getModuleStatus: (name) => this.getModuleStatus(name),

            // Utility methods
            restart: () => location.reload(),
            setFeature: (name, enabled) => configManager.setFeatureFlag(name, enabled),
            getStatus: () => this.getInitializationStatus(),
            getHealthCheck: () => this.performHealthCheck(),

            // Progressive loading
            loadFeature: (featureName) => this.loadFeatureOnDemand(featureName),
            preloadFeature: (featureName) => this.preloadFeature(featureName)
        };
    }

    /**
     * Set up progressive loading for non-critical features
     */
    setupProgressiveLoading() {
        // Load features based on user interaction
        this.setupFeatureLoading();

        // Preload features based on user behavior
        this.setupIntelligentPreloading();

        // Set up lazy loading for heavy components
        this.setupComponentLazyLoading();
    }

    /**
     * Set up feature loading based on user interaction
     */
    setupFeatureLoading() {
        // Load mini-chat when user scrolls down
        let chatLoaded = false;
        const loadMiniChat = () => {
            if (!chatLoaded && window.scrollY > 500) {
                chatLoaded = true;
                this.loadFeatureOnDemand('miniChat');
                window.removeEventListener('scroll', loadMiniChat);
            }
        };
        window.addEventListener('scroll', loadMiniChat, { passive: true });

        // Load onboarding when user is idle
        setTimeout(() => {
            this.loadFeatureOnDemand('onboarding');
        }, 5000);
    }

    /**
     * Set up intelligent preloading
     */
    setupIntelligentPreloading() {
        // Preload features based on route
        const currentRoute = window.location.hash;

        if (currentRoute.includes('course')) {
            this.preloadFeature('coursePlayer');
        } else if (currentRoute.includes('community')) {
            this.preloadFeature('communityFeatures');
        }

        // Preload on hover for navigation links
        document.addEventListener('mouseover', (event) => {
            const link = event.target.closest('a[href*="#"]');
            if (link) {
                const route = link.getAttribute('href');
                this.preloadRouteFeatures(route);
            }
        });
    }

    /**
     * Set up component lazy loading
     */
    setupComponentLazyLoading() {
        // Use Intersection Observer for component lazy loading
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const component = entry.target.dataset.lazyComponent;
                        if (component) {
                            this.loadComponent(component, entry.target);
                            observer.unobserve(entry.target);
                        }
                    }
                });
            }, { rootMargin: '100px' });

            // Observe lazy components
            document.querySelectorAll('[data-lazy-component]').forEach(el => {
                observer.observe(el);
            });
        }
    }

    /**
     * Load feature on demand
     */
    async loadFeatureOnDemand(featureName) {
        try {
            console.log(`🔄 Loading feature on demand: ${featureName}`);

            switch (featureName) {
                case 'miniChat':
                    const { mountMiniChat } = await import('../mini-chat.js');
                    mountMiniChat();
                    break;

                case 'onboarding':
                    const { initOnboarding } = await import('../onboarding.js');
                    initOnboarding();
                    break;

                case 'coursePlayer':
                    // Load course player components
                    await this.loadCoursePlayerComponents();
                    break;

                case 'communityFeatures':
                    // Load community features
                    await this.loadCommunityFeatures();
                    break;

                default:
                    console.warn(`Unknown feature: ${featureName}`);
            }

            console.log(`✅ Feature loaded: ${featureName}`);

        } catch (error) {
            console.error(`❌ Failed to load feature ${featureName}:`, error);
        }
    }

    /**
     * Preload feature for faster access
     */
    async preloadFeature(featureName) {
        try {
            // Preload without executing
            switch (featureName) {
                case 'coursePlayer':
                    import('../course-player.js');
                    break;
                case 'communityFeatures':
                    import('../views/community.js');
                    break;
            }
        } catch (error) {
            console.warn(`Failed to preload feature ${featureName}:`, error);
        }
    }

    /**
     * Preload features for a specific route
     */
    preloadRouteFeatures(route) {
        if (route.includes('course')) {
            this.preloadFeature('coursePlayer');
        } else if (route.includes('community')) {
            this.preloadFeature('communityFeatures');
        }
    }

    /**
     * Load component dynamically
     */
    async loadComponent(componentName, element) {
        try {
            console.log(`🔄 Loading component: ${componentName}`);

            // Component loading logic would go here
            // This is a placeholder for dynamic component loading
            element.innerHTML = `<div>Loading ${componentName}...</div>`;

            // Simulate component loading
            await new Promise(resolve => setTimeout(resolve, 100));
            element.innerHTML = `<div>${componentName} loaded!</div>`;

        } catch (error) {
            console.error(`Failed to load component ${componentName}:`, error);
            element.innerHTML = `<div>Failed to load ${componentName}</div>`;
        }
    }

    /**
     * Perform application health check
     */
    performHealthCheck() {
        const health = {
            overall: 'healthy',
            modules: {},
            performance: {},
            errors: this.initializationErrors.length
        };

        // Check module health
        for (const [name, status] of Object.entries(this.initializationStatus)) {
            health.modules[name] = status ? 'healthy' : 'failed';
        }

        // Check performance
        const totalInitTime = performance.now() - this.initializationStartTime;
        health.performance = {
            totalInitTime,
            averageModuleTime: Array.from(this.moduleLoadTimes.values()).reduce((a, b) => a + b, 0) / this.moduleLoadTimes.size,
            slowestModule: this.getSlowestModule()
        };

        // Determine overall health
        const criticalFailures = this.criticalModules.filter(module => !this.initializationStatus[module]);
        if (criticalFailures.length > 0) {
            health.overall = 'critical';
        } else if (this.initializationErrors.length > 0) {
            health.overall = 'degraded';
        }

        return health;
    }

    /**
     * Get slowest loading module
     */
    getSlowestModule() {
        let slowest = { name: null, time: 0 };

        for (const [name, time] of this.moduleLoadTimes) {
            if (time > slowest.time) {
                slowest = { name, time };
            }
        }

        return slowest;
    }

    /**
     * Reload a specific module
     */
    async reloadModule(moduleName) {
        try {
            console.log(`🔄 Reloading module: ${moduleName}`);

            // Mark as not initialized
            this.initializationStatus[moduleName] = false;

            // Remove from modules map
            this.modules.delete(moduleName);

            // Reinitialize
            await this.initializeModule(moduleName);

            console.log(`✅ Module reloaded: ${moduleName}`);
            return true;

        } catch (error) {
            console.error(`❌ Failed to reload module ${moduleName}:`, error);
            return false;
        }
    }

    /**
     * Get status of a specific module
     */
    getModuleStatus(moduleName) {
        return {
            initialized: this.initializationStatus[moduleName] || false,
            loadTime: this.moduleLoadTimes.get(moduleName),
            instance: this.modules.get(moduleName),
            retryAttempts: this.retryAttempts.get(moduleName) || 0
        };
    }

    /**
     * Set up global error handling
     */
    setupGlobalErrorHandling() {
        // Initialize the error boundary system
        import('./error-boundary.js').then(({ errorBoundary }) => {
            const config = configManager.getConfig();
            errorBoundary.initialize({
                reportingEndpoint: config.performance.reportingEndpoint
            });

            console.log('🛡️ Error boundary system activated');
        }).catch(error => {
            console.error('Failed to initialize error boundary:', error);

            // Fallback to basic error handling
            window.addEventListener('error', (event) => {
                console.error('Global error:', event.error);
            });

            window.addEventListener('unhandledrejection', (event) => {
                console.error('Unhandled promise rejection:', event.reason);
            });
        });
    }

    /**
     * Handle initialization errors
     */
    async handleInitializationError(error) {
        console.error('🚨 Initialization error:', error);

        // Show user-friendly error message
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; background: #ff6b6b; color: white; padding: 1rem; border-radius: 8px; z-index: 9999; max-width: 300px;">
        <h4 style="margin: 0 0 0.5rem 0;">Initialization Error</h4>
        <p style="margin: 0; font-size: 0.9rem;">The app encountered an error during startup. Please refresh the page.</p>
        <button onclick="location.reload()" style="margin-top: 0.5rem; background: rgba(255,255,255,0.2); border: none; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer;">Refresh</button>
      </div>
    `;
        document.body.appendChild(errorDiv);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 10000);
    }

    /**
     * Load external script
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Get comprehensive initialization status
     */
    getInitializationStatus() {
        const totalSteps = Object.keys(this.initializationStatus).length;
        const completedSteps = Object.values(this.initializationStatus).filter(Boolean).length;
        const criticalSteps = this.criticalModules.length;
        const completedCriticalSteps = this.criticalModules.filter(module => this.initializationStatus[module]).length;

        return {
            status: this.initializationStatus,
            progress: completedSteps / totalSteps,
            criticalProgress: completedCriticalSteps / criticalSteps,
            errors: this.initializationErrors,
            isComplete: completedSteps === totalSteps,
            isCriticalComplete: completedCriticalSteps === criticalSteps,
            modules: Array.from(this.modules.keys()),
            loadTimes: Object.fromEntries(this.moduleLoadTimes),
            retryAttempts: Object.fromEntries(this.retryAttempts),
            totalInitTime: this.initializationStartTime ? performance.now() - this.initializationStartTime : 0
        };
    }

    /**
     * Load course player components
     */
    async loadCoursePlayerComponents() {
        // Placeholder for course player loading
        console.log('📚 Loading course player components...');
        // In a real implementation, this would load course-specific modules
    }

    /**
     * Load community features
     */
    async loadCommunityFeatures() {
        // Placeholder for community features loading
        console.log('👥 Loading community features...');
        // In a real implementation, this would load community-specific modules
    }
}

// Export singleton instance
export const appBootstrap = new AppBootstrap();

// Database initialization is handled server-side only
// Frontend will communicate with backend API for database operations

async function initializeDatabase() {
  // Database initialization skipped in frontend
  // All database operations are handled via API calls to the backend
  logger.info('Frontend: Database operations handled via API calls to backend.');
}

async function closeDatabase() {
  // No database connection to close in frontend
  logger.info('Frontend: No database connection to close.');
}