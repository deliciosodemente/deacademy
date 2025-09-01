/**
 * Responsive Design Manager for Digital English Academy
 * Handles advanced viewport management, orientation changes, and touch optimization
 */

export class ResponsiveDesignManager {
    constructor() {
        this.isInitialized = false;
        this.currentBreakpoint = null;
        this.orientation = null;
        this.touchDevice = false;
        this.safeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };

        // Breakpoint definitions
        this.breakpoints = {
            xs: { min: 0, max: 575 },
            sm: { min: 576, max: 767 },
            md: { min: 768, max: 991 },
            lg: { min: 992, max: 1199 },
            xl: { min: 1200, max: 1399 },
            xxl: { min: 1400, max: Infinity }
        };

        // Viewport management
        this.viewportManager = {
            width: window.innerWidth,
            height: window.innerHeight,
            ratio: window.devicePixelRatio || 1,
            isRetina: (window.devicePixelRatio || 1) > 1
        };

        // Touch and gesture settings
        this.touchSettings = {
            minTouchTarget: 44, // Minimum touch target size in pixels
            swipeThreshold: 50, // Minimum distance for swipe recognition
            tapTimeout: 300, // Maximum time for tap recognition
            doubleTapTimeout: 300 // Maximum time between taps for double tap
        };

        // Event listeners storage
        this.eventListeners = new Map();
        this.resizeObserver = null;
        this.orientationChangeCallbacks = [];
        this.breakpointChangeCallbacks = [];
    }

    /**
     * Initialize responsive design manager
     */
    initialize(config = {}) {
        if (this.isInitialized) return;

        // Apply configuration
        this.applyConfig(config);

        // Detect device capabilities
        this.detectDeviceCapabilities();

        // Set up viewport management
        this.setupViewportManagement();

        // Set up orientation handling
        this.setupOrientationHandling();

        // Set up safe area handling
        this.setupSafeAreaHandling();

        // Set up breakpoint management
        this.setupBreakpointManagement();

        // Set up touch optimization
        this.setupTouchOptimization();

        // Set up gesture recognition
        this.setupGestureRecognition();

        // Apply initial responsive styles
        this.applyResponsiveStyles();

        this.isInitialized = true;
        console.log('📱 Responsive Design Manager initialized');
    }

    /**
     * Apply configuration settings
     */
    applyConfig(config) {
        if (config.breakpoints) {
            this.breakpoints = { ...this.breakpoints, ...config.breakpoints };
        }
        if (config.touchSettings) {
            this.touchSettings = { ...this.touchSettings, ...config.touchSettings };
        }
    }

    /**
     * Detect device capabilities
     */
    detectDeviceCapabilities() {
        // Detect touch support
        this.touchDevice = 'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0;

        // Detect mobile device
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Detect iOS
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        // Detect Android
        this.isAndroid = /Android/.test(navigator.userAgent);

        // Update body classes
        document.body.classList.toggle('touch-device', this.touchDevice);
        document.body.classList.toggle('mobile-device', this.isMobile);
        document.body.classList.toggle('ios-device', this.isIOS);
        document.body.classList.toggle('android-device', this.isAndroid);

        console.log('📱 Device capabilities detected:', {
            touch: this.touchDevice,
            mobile: this.isMobile,
            ios: this.isIOS,
            android: this.isAndroid
        });
    }

    /**
     * Set up viewport management
     */
    setupViewportManagement() {
        // Create dynamic viewport meta tag
        this.createDynamicViewportMeta();

        // Handle viewport changes
        this.handleViewportChanges();

        // Set up resize observer
        this.setupResizeObserver();

        console.log('🖥️ Viewport management configured');
    }

    /**
     * Create dynamic viewport meta tag
     */
    createDynamicViewportMeta() {
        let viewportMeta = document.querySelector('meta[name="viewport"]');

        if (!viewportMeta) {
            viewportMeta = document.createElement('meta');
            viewportMeta.name = 'viewport';
            document.head.appendChild(viewportMeta);
        }

        // Base viewport configuration
        let viewportContent = 'width=device-width, initial-scale=1';

        // iOS specific adjustments
        if (this.isIOS) {
            viewportContent += ', viewport-fit=cover';

            // Prevent zoom on input focus for iOS
            if (this.isMobile) {
                viewportContent += ', maximum-scale=1, user-scalable=no';
            }
        }

        // Android specific adjustments
        if (this.isAndroid) {
            viewportContent += ', shrink-to-fit=no';
        }

        viewportMeta.content = viewportContent;
        console.log('📐 Dynamic viewport meta configured:', viewportContent);
    }

    /**
     * Handle viewport changes
     */
    handleViewportChanges() {
        const handleResize = () => {
            const oldWidth = this.viewportManager.width;
            const oldHeight = this.viewportManager.height;

            this.viewportManager.width = window.innerWidth;
            this.viewportManager.height = window.innerHeight;
            this.viewportManager.ratio = window.devicePixelRatio || 1;
            this.viewportManager.isRetina = this.viewportManager.ratio > 1;

            // Check if breakpoint changed
            const newBreakpoint = this.getCurrentBreakpoint();
            if (newBreakpoint !== this.currentBreakpoint) {
                this.handleBreakpointChange(this.currentBreakpoint, newBreakpoint);
                this.currentBreakpoint = newBreakpoint;
            }

            // Dispatch viewport change event
            this.dispatchViewportChangeEvent({
                oldWidth,
                oldHeight,
                newWidth: this.viewportManager.width,
                newHeight: this.viewportManager.height,
                breakpoint: this.currentBreakpoint
            });
        };

        // Debounced resize handler
        let resizeTimeout;
        const debouncedResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(handleResize, 100);
        };

        window.addEventListener('resize', debouncedResize);
        this.eventListeners.set('resize', debouncedResize);

        // Initial call
        handleResize();
    }

    /**
     * Set up resize observer for element-specific handling
     */
    setupResizeObserver() {
        if ('ResizeObserver' in window) {
            this.resizeObserver = new ResizeObserver((entries) => {
                entries.forEach(entry => {
                    const element = entry.target;
                    const { width, height } = entry.contentRect;

                    // Dispatch element resize event
                    element.dispatchEvent(new CustomEvent('elementResize', {
                        detail: { width, height, element }
                    }));
                });
            });

            // Observe main content areas
            const observeElements = document.querySelectorAll('[data-responsive-observe]');
            observeElements.forEach(element => {
                this.resizeObserver.observe(element);
            });
        }
    }

    /**
     * Set up orientation handling
     */
    setupOrientationHandling() {
        // Get initial orientation
        this.updateOrientation();

        // Handle orientation change
        const handleOrientationChange = () => {
            // Use timeout to ensure viewport dimensions are updated
            setTimeout(() => {
                const oldOrientation = this.orientation;
                this.updateOrientation();

                if (oldOrientation !== this.orientation) {
                    this.handleOrientationChange(oldOrientation, this.orientation);
                }
            }, 100);
        };

        // Listen for orientation change events
        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', handleOrientationChange);

        this.eventListeners.set('orientationchange', handleOrientationChange);

        console.log('🔄 Orientation handling configured');
    }

    /**
     * Update current orientation
     */
    updateOrientation() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        if (width > height) {
            this.orientation = 'landscape';
        } else {
            this.orientation = 'portrait';
        }

        // Update body class
        document.body.classList.remove('orientation-portrait', 'orientation-landscape');
        document.body.classList.add(`orientation-${this.orientation}`);
    }

    /**
     * Handle orientation change
     */
    handleOrientationChange(oldOrientation, newOrientation) {
        console.log(`📱 Orientation changed: ${oldOrientation} → ${newOrientation}`);

        // Update viewport meta if needed
        this.createDynamicViewportMeta();

        // Recalculate safe areas
        this.updateSafeAreaInsets();

        // Notify callbacks
        this.orientationChangeCallbacks.forEach(callback => {
            try {
                callback(newOrientation, oldOrientation);
            } catch (error) {
                console.error('Orientation change callback error:', error);
            }
        });

        // Dispatch orientation change event
        window.dispatchEvent(new CustomEvent('orientationChanged', {
            detail: { oldOrientation, newOrientation }
        }));
    }

    /**
     * Set up safe area handling for devices with notches/rounded corners
     */
    setupSafeAreaHandling() {
        // Update safe area insets
        this.updateSafeAreaInsets();

        // Apply safe area CSS custom properties
        this.applySafeAreaCSS();

        console.log('🛡️ Safe area handling configured');
    }

    /**
     * Update safe area insets
     */
    updateSafeAreaInsets() {
        // Get safe area insets from CSS environment variables
        const computedStyle = getComputedStyle(document.documentElement);

        this.safeAreaInsets = {
            top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top')) || 0,
            right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right')) || 0,
            bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom')) || 0,
            left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left')) || 0
        };

        // Apply safe area classes
        document.body.classList.toggle('has-safe-area-top', this.safeAreaInsets.top > 0);
        document.body.classList.toggle('has-safe-area-bottom', this.safeAreaInsets.bottom > 0);
    }

    /**
     * Apply safe area CSS custom properties
     */
    applySafeAreaCSS() {
        const style = document.createElement('style');
        style.id = 'safe-area-styles';
        style.textContent = `
            :root {
                --safe-area-inset-top: env(safe-area-inset-top, 0px);
                --safe-area-inset-right: env(safe-area-inset-right, 0px);
                --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
                --safe-area-inset-left: env(safe-area-inset-left, 0px);
            }
            
            .safe-area-padding {
                padding-top: var(--safe-area-inset-top);
                padding-right: var(--safe-area-inset-right);
                padding-bottom: var(--safe-area-inset-bottom);
                padding-left: var(--safe-area-inset-left);
            }
            
            .safe-area-margin {
                margin-top: var(--safe-area-inset-top);
                margin-right: var(--safe-area-inset-right);
                margin-bottom: var(--safe-area-inset-bottom);
                margin-left: var(--safe-area-inset-left);
            }
            
            .safe-area-top {
                padding-top: var(--safe-area-inset-top);
            }
            
            .safe-area-bottom {
                padding-bottom: var(--safe-area-inset-bottom);
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Set up breakpoint management
     */
    setupBreakpointManagement() {
        // Set initial breakpoint
        this.currentBreakpoint = this.getCurrentBreakpoint();
        this.applyBreakpointClasses();

        console.log('📏 Breakpoint management configured, current:', this.currentBreakpoint);
    }

    /**
     * Get current breakpoint based on viewport width
     */
    getCurrentBreakpoint() {
        const width = this.viewportManager.width;

        for (const [name, range] of Object.entries(this.breakpoints)) {
            if (width >= range.min && width <= range.max) {
                return name;
            }
        }

        return 'xl'; // Default fallback
    }

    /**
     * Handle breakpoint change
     */
    handleBreakpointChange(oldBreakpoint, newBreakpoint) {
        console.log(`📏 Breakpoint changed: ${oldBreakpoint} → ${newBreakpoint}`);

        // Update classes
        this.applyBreakpointClasses();

        // Notify callbacks
        this.breakpointChangeCallbacks.forEach(callback => {
            try {
                callback(newBreakpoint, oldBreakpoint);
            } catch (error) {
                console.error('Breakpoint change callback error:', error);
            }
        });

        // Dispatch breakpoint change event
        window.dispatchEvent(new CustomEvent('breakpointChanged', {
            detail: { oldBreakpoint, newBreakpoint }
        }));
    }

    /**
     * Apply breakpoint classes to body
     */
    applyBreakpointClasses() {
        // Remove old breakpoint classes
        Object.keys(this.breakpoints).forEach(bp => {
            document.body.classList.remove(`bp-${bp}`);
        });

        // Add current breakpoint class
        document.body.classList.add(`bp-${this.currentBreakpoint}`);

        // Add responsive helper classes
        const width = this.viewportManager.width;
        document.body.classList.toggle('mobile-viewport', width < 768);
        document.body.classList.toggle('tablet-viewport', width >= 768 && width < 1024);
        document.body.classList.toggle('desktop-viewport', width >= 1024);
    }

    /**
     * Set up touch optimization
     */
    setupTouchOptimization() {
        if (!this.touchDevice) return;

        // Optimize touch targets
        this.optimizeTouchTargets();

        // Set up touch feedback
        this.setupTouchFeedback();

        // Handle iOS specific touch issues
        if (this.isIOS) {
            this.handleIOSTouchIssues();
        }

        console.log('👆 Touch optimization configured');
    }

    /**
     * Optimize touch targets for better accessibility
     */
    optimizeTouchTargets() {
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');

        interactiveElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const minSize = this.touchSettings.minTouchTarget;

            // Add touch target class if element is too small
            if (rect.width < minSize || rect.height < minSize) {
                element.classList.add('touch-target-small');
            }
        });

        // Add CSS for touch target optimization
        this.addTouchTargetCSS();
    }

    /**
     * Add CSS for touch target optimization
     */
    addTouchTargetCSS() {
        if (document.querySelector('#touch-target-styles')) return;

        const style = document.createElement('style');
        style.id = 'touch-target-styles';
        style.textContent = `
            .touch-device .touch-target-small {
                position: relative;
                min-width: ${this.touchSettings.minTouchTarget}px;
                min-height: ${this.touchSettings.minTouchTarget}px;
            }
            
            .touch-device .touch-target-small::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                min-width: ${this.touchSettings.minTouchTarget}px;
                min-height: ${this.touchSettings.minTouchTarget}px;
                z-index: -1;
            }
            
            .touch-device button,
            .touch-device a,
            .touch-device [role="button"] {
                touch-action: manipulation;
            }
            
            .touch-device input,
            .touch-device textarea,
            .touch-device select {
                touch-action: manipulation;
            }
            
            .touch-feedback {
                transition: transform 0.1s ease, opacity 0.1s ease;
            }
            
            .touch-feedback:active {
                transform: scale(0.95);
                opacity: 0.8;
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Set up touch feedback for interactive elements
     */
    setupTouchFeedback() {
        document.addEventListener('touchstart', (event) => {
            const target = event.target.closest('button, a, [role="button"]');
            if (target && !target.disabled) {
                target.classList.add('touch-feedback');
            }
        }, { passive: true });

        document.addEventListener('touchend', (event) => {
            const target = event.target.closest('button, a, [role="button"]');
            if (target) {
                setTimeout(() => {
                    target.classList.remove('touch-feedback');
                }, 150);
            }
        }, { passive: true });
    }

    /**
     * Handle iOS specific touch issues
     */
    handleIOSTouchIssues() {
        // Fix iOS double-tap zoom on buttons
        document.addEventListener('touchend', (event) => {
            const target = event.target.closest('button, [role="button"]');
            if (target) {
                event.preventDefault();
                target.click();
            }
        });

        // Fix iOS scroll momentum
        document.body.style.webkitOverflowScrolling = 'touch';

        // Fix iOS input zoom
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                // Temporarily disable zoom
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) {
                    const originalContent = viewport.content;
                    viewport.content = originalContent + ', maximum-scale=1.0';

                    input.addEventListener('blur', () => {
                        viewport.content = originalContent;
                    }, { once: true });
                }
            });
        });
    }

    /**
     * Set up gesture recognition
     */
    setupGestureRecognition() {
        if (!this.touchDevice) return;

        // Set up swipe detection
        this.setupSwipeDetection();

        // Set up pinch detection
        this.setupPinchDetection();

        console.log('👋 Gesture recognition configured');
    }

    /**
     * Set up swipe detection
     */
    setupSwipeDetection() {
        let startX, startY, startTime;

        document.addEventListener('touchstart', (event) => {
            if (event.touches.length === 1) {
                const touch = event.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
                startTime = Date.now();
            }
        }, { passive: true });

        document.addEventListener('touchend', (event) => {
            if (event.changedTouches.length === 1) {
                const touch = event.changedTouches[0];
                const endX = touch.clientX;
                const endY = touch.clientY;
                const endTime = Date.now();

                const deltaX = endX - startX;
                const deltaY = endY - startY;
                const deltaTime = endTime - startTime;

                // Check if it's a swipe
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                if (distance > this.touchSettings.swipeThreshold && deltaTime < 500) {
                    const direction = this.getSwipeDirection(deltaX, deltaY);

                    // Dispatch swipe event
                    event.target.dispatchEvent(new CustomEvent('swipe', {
                        detail: {
                            direction,
                            distance,
                            deltaX,
                            deltaY,
                            duration: deltaTime
                        }
                    }));
                }
            }
        }, { passive: true });
    }

    /**
     * Get swipe direction
     */
    getSwipeDirection(deltaX, deltaY) {
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        if (absDeltaX > absDeltaY) {
            return deltaX > 0 ? 'right' : 'left';
        } else {
            return deltaY > 0 ? 'down' : 'up';
        }
    }

    /**
     * Set up pinch detection
     */
    setupPinchDetection() {
        let initialDistance = 0;

        document.addEventListener('touchstart', (event) => {
            if (event.touches.length === 2) {
                initialDistance = this.getTouchDistance(event.touches[0], event.touches[1]);
            }
        }, { passive: true });

        document.addEventListener('touchmove', (event) => {
            if (event.touches.length === 2) {
                const currentDistance = this.getTouchDistance(event.touches[0], event.touches[1]);
                const scale = currentDistance / initialDistance;

                // Dispatch pinch event
                event.target.dispatchEvent(new CustomEvent('pinch', {
                    detail: {
                        scale,
                        distance: currentDistance,
                        initialDistance
                    }
                }));
            }
        }, { passive: true });
    }

    /**
     * Get distance between two touch points
     */
    getTouchDistance(touch1, touch2) {
        const deltaX = touch2.clientX - touch1.clientX;
        const deltaY = touch2.clientY - touch1.clientY;
        return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    }

    /**
     * Apply responsive styles
     */
    applyResponsiveStyles() {
        if (document.querySelector('#responsive-styles')) return;

        const style = document.createElement('style');
        style.id = 'responsive-styles';
        style.textContent = `
            /* Responsive utility classes */
            .mobile-only { display: none; }
            .tablet-only { display: none; }
            .desktop-only { display: none; }
            
            @media (max-width: 767px) {
                .mobile-only { display: block; }
                .mobile-hidden { display: none !important; }
            }
            
            @media (min-width: 768px) and (max-width: 1023px) {
                .tablet-only { display: block; }
                .tablet-hidden { display: none !important; }
            }
            
            @media (min-width: 1024px) {
                .desktop-only { display: block; }
                .desktop-hidden { display: none !important; }
            }
            
            /* Responsive text sizes */
            .text-responsive {
                font-size: clamp(0.875rem, 2.5vw, 1.125rem);
            }
            
            .heading-responsive {
                font-size: clamp(1.5rem, 4vw, 3rem);
            }
            
            /* Responsive spacing */
            .spacing-responsive {
                padding: clamp(1rem, 3vw, 2rem);
            }
            
            /* Responsive containers */
            .container-responsive {
                width: 100%;
                max-width: min(90vw, 1200px);
                margin: 0 auto;
                padding: 0 clamp(1rem, 3vw, 2rem);
            }
            
            /* Touch-friendly elements */
            .touch-device .btn,
            .touch-device .nav-link {
                min-height: 44px;
                padding: 0.75rem 1rem;
            }
            
            /* Orientation specific styles */
            .orientation-landscape .landscape-only { display: block; }
            .orientation-portrait .portrait-only { display: block; }
            .orientation-landscape .portrait-only { display: none; }
            .orientation-portrait .landscape-only { display: none; }
        `;

        document.head.appendChild(style);
    }

    /**
     * Register orientation change callback
     */
    onOrientationChange(callback) {
        this.orientationChangeCallbacks.push(callback);
    }

    /**
     * Register breakpoint change callback
     */
    onBreakpointChange(callback) {
        this.breakpointChangeCallbacks.push(callback);
    }

    /**
     * Dispatch viewport change event
     */
    dispatchViewportChangeEvent(details) {
        window.dispatchEvent(new CustomEvent('viewportChanged', { detail: details }));
    }

    /**
     * Get current responsive state
     */
    getResponsiveState() {
        return {
            breakpoint: this.currentBreakpoint,
            orientation: this.orientation,
            viewport: this.viewportManager,
            touchDevice: this.touchDevice,
            isMobile: this.isMobile,
            isIOS: this.isIOS,
            isAndroid: this.isAndroid,
            safeAreaInsets: this.safeAreaInsets
        };
    }

    /**
     * Check if current viewport matches breakpoint
     */
    matchesBreakpoint(breakpoint) {
        return this.currentBreakpoint === breakpoint;
    }

    /**
     * Check if current viewport is at least the specified breakpoint
     */
    isBreakpointUp(breakpoint) {
        const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
        const currentIndex = breakpointOrder.indexOf(this.currentBreakpoint);
        const targetIndex = breakpointOrder.indexOf(breakpoint);
        return currentIndex >= targetIndex;
    }

    /**
     * Check if current viewport is below the specified breakpoint
     */
    isBreakpointDown(breakpoint) {
        const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
        const currentIndex = breakpointOrder.indexOf(this.currentBreakpoint);
        const targetIndex = breakpointOrder.indexOf(breakpoint);
        return currentIndex < targetIndex;
    }

    /**
     * Clean up responsive design manager
     */
    cleanup() {
        // Remove event listeners
        this.eventListeners.forEach((listener, event) => {
            window.removeEventListener(event, listener);
        });
        this.eventListeners.clear();

        // Disconnect resize observer
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        // Clear callbacks
        this.orientationChangeCallbacks = [];
        this.breakpointChangeCallbacks = [];

        this.isInitialized = false;
        console.log('📱 Responsive Design Manager cleaned up');
    }
}

// Export singleton instance
export const responsiveDesignManager = new ResponsiveDesignManager();