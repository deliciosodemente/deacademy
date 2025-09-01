/**
 * Resource Optimization System for Digital English Academy
 * Handles critical resource preloading, lazy loading, and fallback mechanisms
 */

export class ResourceOptimizer {
    constructor() {
        this.isInitialized = false;
        this.criticalResources = new Set();
        this.lazyResources = new Set();
        this.resourceCache = new Map();
        this.fallbackResources = new Map();
        this.loadingQueue = [];
        this.maxConcurrentLoads = 6;
        this.currentLoads = 0;

        // Resource priorities
        this.resourcePriorities = {
            critical: ['css', 'font', 'script'],
            high: ['image', 'video'],
            low: ['audio', 'document']
        };

        // Optimization settings
        this.settings = {
            enablePreloading: true,
            enableLazyLoading: true,
            enableResourceHints: true,
            criticalResourceTimeout: 5000,
            lazyLoadThreshold: 100, // pixels
            enableWebP: true,
            enableBrotli: true
        };

        // Performance tracking
        this.metrics = {
            preloadedResources: 0,
            lazyLoadedResources: 0,
            failedResources: 0,
            cachedResources: 0,
            totalSavedBytes: 0
        };

        // Intersection Observer for lazy loading
        this.lazyObserver = null;
        this.setupLazyObserver();
    }

    /**
     * Initialize the resource optimization system
     */
    initialize(config = {}) {
        if (this.isInitialized) return;

        this.settings = { ...this.settings, ...config };

        // Set up resource hints
        if (this.settings.enableResourceHints) {
            this.setupResourceHints();
        }

        // Preload critical resources
        if (this.settings.enablePreloading) {
            this.preloadCriticalResources();
        }

        // Set up lazy loading
        if (this.settings.enableLazyLoading) {
            this.setupLazyLoading();
        }

        // Set up resource fallbacks
        this.setupResourceFallbacks();

        // Monitor resource loading
        this.monitorResourceLoading();

        this.isInitialized = true;
        console.log('🚀 Resource Optimizer initialized');
    }

    /**
     * Set up resource hints for better loading performance
     */
    setupResourceHints() {
        // DNS prefetch for external domains
        const externalDomains = [
            'fonts.googleapis.com',
            'fonts.gstatic.com',
            'cdn.jsdelivr.net',
            'unpkg.com'
        ];

        externalDomains.forEach(domain => {
            this.addResourceHint('dns-prefetch', `//${domain}`);
        });

        // Preconnect to critical origins
        const criticalOrigins = [
            'https://fonts.googleapis.com',
            'https://api.stripe.com'
        ];

        criticalOrigins.forEach(origin => {
            this.addResourceHint('preconnect', origin);
        });

        console.log('🔗 Resource hints configured');
    }

    /**
     * Add resource hint to document head
     */
    addResourceHint(rel, href, crossorigin = false) {
        const link = document.createElement('link');
        link.rel = rel;
        link.href = href;

        if (crossorigin) {
            link.crossOrigin = 'anonymous';
        }

        document.head.appendChild(link);
    }

    /**
     * Preload critical resources
     */
    preloadCriticalResources() {
        // Critical CSS
        const criticalCSS = [
            '/styles.css',
            'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
        ];

        criticalCSS.forEach(href => {
            this.preloadResource(href, 'style');
        });

        // Critical JavaScript
        const criticalJS = [
            '/app.js',
            '/router.js'
        ];

        criticalJS.forEach(href => {
            this.preloadResource(href, 'script');
        });

        // Critical fonts
        const criticalFonts = [
            'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
        ];

        criticalFonts.forEach(href => {
            this.preloadResource(href, 'font', true);
        });

        console.log('⚡ Critical resources preloaded');
    }

    /**
     * Preload a specific resource
     */
    preloadResource(href, as, crossorigin = false) {
        // Check if already preloaded
        if (this.criticalResources.has(href)) return;

        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;

        if (crossorigin) {
            link.crossOrigin = 'anonymous';
        }

        // Add error handling
        link.onerror = () => {
            console.warn(`Failed to preload resource: ${href}`);
            this.metrics.failedResources++;
            this.handleResourceFailure(href, as);
        };

        link.onload = () => {
            console.log(`✅ Preloaded: ${href}`);
            this.metrics.preloadedResources++;
            this.criticalResources.add(href);
        };

        document.head.appendChild(link);

        // Set timeout for critical resources
        setTimeout(() => {
            if (!this.criticalResources.has(href)) {
                console.warn(`Preload timeout for: ${href}`);
                this.handleResourceTimeout(href, as);
            }
        }, this.settings.criticalResourceTimeout);
    }

    /**
     * Set up lazy loading for images and other resources
     */
    setupLazyLoading() {
        // Find all lazy-loadable elements
        this.findLazyElements();

        // Set up mutation observer for dynamically added elements
        this.setupMutationObserver();

        console.log('👁️ Lazy loading configured');
    }

    /**
     * Set up intersection observer for lazy loading
     */
    setupLazyObserver() {
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver not supported, falling back to immediate loading');
            return;
        }

        this.lazyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadLazyElement(entry.target);
                    this.lazyObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: `${this.settings.lazyLoadThreshold}px`
        });
    }

    /**
     * Find and configure lazy-loadable elements
     */
    findLazyElements() {
        // Images with data-src
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => this.configureLazyImage(img));

        // Background images with data-bg
        const lazyBgs = document.querySelectorAll('[data-bg]');
        lazyBgs.forEach(el => this.configureLazyBackground(el));

        // Iframes with data-src
        const lazyIframes = document.querySelectorAll('iframe[data-src]');
        lazyIframes.forEach(iframe => this.configureLazyIframe(iframe));

        // Videos with data-src
        const lazyVideos = document.querySelectorAll('video[data-src]');
        lazyVideos.forEach(video => this.configureLazyVideo(video));
    }

    /**
     * Configure lazy loading for an image
     */
    configureLazyImage(img) {
        // Add placeholder if not present
        if (!img.src) {
            img.src = this.generatePlaceholder(img.dataset.width || 300, img.dataset.height || 200);
        }

        // Add loading class
        img.classList.add('lazy-loading');

        // Observe for intersection
        if (this.lazyObserver) {
            this.lazyObserver.observe(img);
        } else {
            // Fallback: load immediately
            this.loadLazyElement(img);
        }
    }

    /**
     * Configure lazy loading for background images
     */
    configureLazyBackground(element) {
        element.classList.add('lazy-bg-loading');

        if (this.lazyObserver) {
            this.lazyObserver.observe(element);
        } else {
            this.loadLazyElement(element);
        }
    }

    /**
     * Configure lazy loading for iframes
     */
    configureLazyIframe(iframe) {
        iframe.classList.add('lazy-iframe-loading');

        if (this.lazyObserver) {
            this.lazyObserver.observe(iframe);
        } else {
            this.loadLazyElement(iframe);
        }
    }

    /**
     * Configure lazy loading for videos
     */
    configureLazyVideo(video) {
        video.classList.add('lazy-video-loading');

        if (this.lazyObserver) {
            this.lazyObserver.observe(video);
        } else {
            this.loadLazyElement(video);
        }
    }

    /**
     * Load a lazy element
     */
    loadLazyElement(element) {
        const tagName = element.tagName.toLowerCase();

        switch (tagName) {
            case 'img':
                this.loadLazyImage(element);
                break;
            case 'iframe':
                this.loadLazyIframe(element);
                break;
            case 'video':
                this.loadLazyVideo(element);
                break;
            default:
                if (element.dataset.bg) {
                    this.loadLazyBackground(element);
                }
        }
    }

    /**
     * Load lazy image
     */
    loadLazyImage(img) {
        const src = img.dataset.src;
        if (!src) return;

        // Create new image to preload
        const newImg = new Image();

        newImg.onload = () => {
            // Check for WebP support and use WebP version if available
            const finalSrc = this.getOptimizedImageSrc(src);
            img.src = finalSrc;
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-loaded');

            this.metrics.lazyLoadedResources++;
            console.log(`🖼️ Lazy loaded image: ${finalSrc}`);
        };

        newImg.onerror = () => {
            // Fallback to original src
            img.src = src;
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-error');

            this.metrics.failedResources++;
            console.warn(`Failed to lazy load image: ${src}`);
        };

        newImg.src = src;
    }

    /**
     * Load lazy background image
     */
    loadLazyBackground(element) {
        const bgSrc = element.dataset.bg;
        if (!bgSrc) return;

        const img = new Image();

        img.onload = () => {
            const optimizedSrc = this.getOptimizedImageSrc(bgSrc);
            element.style.backgroundImage = `url(${optimizedSrc})`;
            element.classList.remove('lazy-bg-loading');
            element.classList.add('lazy-bg-loaded');

            this.metrics.lazyLoadedResources++;
            console.log(`🎨 Lazy loaded background: ${optimizedSrc}`);
        };

        img.onerror = () => {
            element.style.backgroundImage = `url(${bgSrc})`;
            element.classList.remove('lazy-bg-loading');
            element.classList.add('lazy-bg-error');

            this.metrics.failedResources++;
            console.warn(`Failed to lazy load background: ${bgSrc}`);
        };

        img.src = bgSrc;
    }

    /**
     * Load lazy iframe
     */
    loadLazyIframe(iframe) {
        const src = iframe.dataset.src;
        if (!src) return;

        iframe.src = src;
        iframe.classList.remove('lazy-iframe-loading');
        iframe.classList.add('lazy-iframe-loaded');

        this.metrics.lazyLoadedResources++;
        console.log(`📺 Lazy loaded iframe: ${src}`);
    }

    /**
     * Load lazy video
     */
    loadLazyVideo(video) {
        const src = video.dataset.src;
        if (!src) return;

        video.src = src;
        video.classList.remove('lazy-video-loading');
        video.classList.add('lazy-video-loaded');

        this.metrics.lazyLoadedResources++;
        console.log(`🎥 Lazy loaded video: ${src}`);
    }

    /**
     * Get optimized image source (WebP if supported)
     */
    getOptimizedImageSrc(originalSrc) {
        if (!this.settings.enableWebP || !this.supportsWebP()) {
            return originalSrc;
        }

        // Convert to WebP if possible
        const webpSrc = originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');

        // Check if WebP version exists (this would typically be done server-side)
        return webpSrc;
    }

    /**
     * Check WebP support
     */
    supportsWebP() {
        if (this._webpSupport !== undefined) return this._webpSupport;

        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;

        this._webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        return this._webpSupport;
    }

    /**
     * Generate placeholder image
     */
    generatePlaceholder(width, height, color = '#f0f0f0') {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);

        // Add loading indicator
        ctx.fillStyle = '#ccc';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Loading...', width / 2, height / 2);

        return canvas.toDataURL();
    }

    /**
     * Set up mutation observer for dynamic content
     */
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check for lazy-loadable elements in added content
                        this.findLazyElementsInNode(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Find lazy elements in a specific node
     */
    findLazyElementsInNode(node) {
        // Images
        const lazyImages = node.querySelectorAll ? node.querySelectorAll('img[data-src]') : [];
        lazyImages.forEach(img => this.configureLazyImage(img));

        // Background images
        const lazyBgs = node.querySelectorAll ? node.querySelectorAll('[data-bg]') : [];
        lazyBgs.forEach(el => this.configureLazyBackground(el));

        // Check if the node itself is lazy-loadable
        if (node.dataset) {
            if (node.dataset.src && node.tagName === 'IMG') {
                this.configureLazyImage(node);
            } else if (node.dataset.bg) {
                this.configureLazyBackground(node);
            }
        }
    }

    /**
     * Set up resource fallbacks
     */
    setupResourceFallbacks() {
        // CSS fallbacks
        this.fallbackResources.set('/styles.css', [
            'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
            '/fallback.css'
        ]);

        // JavaScript fallbacks
        this.fallbackResources.set('/app.js', [
            '/app.min.js',
            '/app.fallback.js'
        ]);

        // Font fallbacks
        this.fallbackResources.set('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap', [
            '/fonts/inter.css',
            'system-ui, -apple-system, sans-serif'
        ]);

        console.log('🛡️ Resource fallbacks configured');
    }

    /**
     * Handle resource loading failure
     */
    handleResourceFailure(href, resourceType) {
        console.warn(`Resource failed to load: ${href}`);

        const fallbacks = this.fallbackResources.get(href);
        if (fallbacks && fallbacks.length > 0) {
            this.loadFallbackResource(href, resourceType, fallbacks);
        } else {
            this.handleNoFallback(href, resourceType);
        }
    }

    /**
     * Load fallback resource
     */
    loadFallbackResource(originalHref, resourceType, fallbacks) {
        const fallbackHref = fallbacks[0];
        const remainingFallbacks = fallbacks.slice(1);

        console.log(`🔄 Trying fallback for ${originalHref}: ${fallbackHref}`);

        if (resourceType === 'style') {
            this.loadFallbackCSS(fallbackHref, originalHref, remainingFallbacks);
        } else if (resourceType === 'script') {
            this.loadFallbackJS(fallbackHref, originalHref, remainingFallbacks);
        } else if (resourceType === 'font') {
            this.loadFallbackFont(fallbackHref, originalHref, remainingFallbacks);
        }
    }

    /**
     * Load fallback CSS
     */
    loadFallbackCSS(fallbackHref, originalHref, remainingFallbacks) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = fallbackHref;

        link.onload = () => {
            console.log(`✅ Fallback CSS loaded: ${fallbackHref}`);
        };

        link.onerror = () => {
            if (remainingFallbacks.length > 0) {
                this.loadFallbackResource(originalHref, 'style', remainingFallbacks);
            } else {
                console.error(`All CSS fallbacks failed for: ${originalHref}`);
                this.handleCriticalResourceFailure(originalHref, 'style');
            }
        };

        document.head.appendChild(link);
    }

    /**
     * Load fallback JavaScript
     */
    loadFallbackJS(fallbackHref, originalHref, remainingFallbacks) {
        const script = document.createElement('script');
        script.src = fallbackHref;

        script.onload = () => {
            console.log(`✅ Fallback JS loaded: ${fallbackHref}`);
        };

        script.onerror = () => {
            if (remainingFallbacks.length > 0) {
                this.loadFallbackResource(originalHref, 'script', remainingFallbacks);
            } else {
                console.error(`All JS fallbacks failed for: ${originalHref}`);
                this.handleCriticalResourceFailure(originalHref, 'script');
            }
        };

        document.head.appendChild(script);
    }

    /**
     * Load fallback font
     */
    loadFallbackFont(fallbackHref, originalHref, remainingFallbacks) {
        if (fallbackHref.startsWith('http')) {
            // External font fallback
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = fallbackHref;

            link.onload = () => {
                console.log(`✅ Fallback font loaded: ${fallbackHref}`);
            };

            link.onerror = () => {
                if (remainingFallbacks.length > 0) {
                    this.loadFallbackResource(originalHref, 'font', remainingFallbacks);
                } else {
                    this.useFallbackFontStack(remainingFallbacks[0] || 'system-ui, sans-serif');
                }
            };

            document.head.appendChild(link);
        } else {
            // System font fallback
            this.useFallbackFontStack(fallbackHref);
        }
    }

    /**
     * Use fallback font stack
     */
    useFallbackFontStack(fontStack) {
        const style = document.createElement('style');
        style.textContent = `
            body, * {
                font-family: ${fontStack} !important;
            }
        `;
        document.head.appendChild(style);
        console.log(`📝 Using fallback font stack: ${fontStack}`);
    }

    /**
     * Handle resource timeout
     */
    handleResourceTimeout(href, resourceType) {
        console.warn(`Resource timeout: ${href}`);
        this.handleResourceFailure(href, resourceType);
    }

    /**
     * Handle case where no fallback is available
     */
    handleNoFallback(href, resourceType) {
        console.error(`No fallback available for: ${href} (${resourceType})`);

        // Dispatch event for error boundary to handle
        window.dispatchEvent(new CustomEvent('resourceLoadFailure', {
            detail: {
                href,
                resourceType,
                error: 'No fallback available'
            }
        }));
    }

    /**
     * Handle critical resource failure
     */
    handleCriticalResourceFailure(href, resourceType) {
        console.error(`Critical resource failure: ${href} (${resourceType})`);

        // Show user notification
        this.showResourceFailureNotification(href, resourceType);

        // Dispatch critical error event
        window.dispatchEvent(new CustomEvent('criticalResourceFailure', {
            detail: {
                href,
                resourceType,
                error: 'All fallbacks failed'
            }
        }));
    }

    /**
     * Show resource failure notification
     */
    showResourceFailureNotification(href, resourceType) {
        const notification = document.createElement('div');
        notification.className = 'resource-failure-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">⚠️</div>
                <div class="notification-message">
                    Algunos recursos no se pudieron cargar. La funcionalidad puede estar limitada.
                </div>
                <button class="notification-retry" onclick="location.reload()">
                    Reintentar
                </button>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    ×
                </button>
            </div>
        `;

        // Add styles
        this.addResourceFailureStyles();

        document.body.appendChild(notification);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }

    /**
     * Add styles for resource failure notifications
     */
    addResourceFailureStyles() {
        if (document.querySelector('#resource-failure-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'resource-failure-styles';
        styles.textContent = `
            .resource-failure-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                max-width: 350px;
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-family: system-ui;
            }
            
            .notification-content {
                padding: 16px;
                display: flex;
                align-items: flex-start;
                gap: 12px;
                position: relative;
            }
            
            .notification-icon {
                font-size: 20px;
                flex-shrink: 0;
            }
            
            .notification-message {
                flex: 1;
                font-size: 14px;
                color: #856404;
                line-height: 1.4;
                margin-bottom: 8px;
            }
            
            .notification-retry {
                background: #856404;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                margin-right: 8px;
            }
            
            .notification-close {
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
            }
            
            .notification-close:hover {
                opacity: 1;
            }
        `;

        document.head.appendChild(styles);
    }

    /**
     * Monitor resource loading performance
     */
    monitorResourceLoading() {
        // Monitor all resource loading
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                if (entry.entryType === 'resource') {
                    this.analyzeResourcePerformance(entry);
                }
            });
        });

        try {
            observer.observe({ entryTypes: ['resource'] });
        } catch (error) {
            console.warn('Resource performance monitoring not supported:', error);
        }
    }

    /**
     * Analyze resource performance
     */
    analyzeResourcePerformance(entry) {
        const duration = entry.duration;
        const size = entry.transferSize || 0;

        // Track metrics
        if (entry.transferSize === 0 && entry.decodedBodySize > 0) {
            this.metrics.cachedResources++;
            this.metrics.totalSavedBytes += entry.decodedBodySize;
        }

        // Check for slow resources
        if (duration > 3000) {
            console.warn(`Slow resource detected: ${entry.name} (${duration.toFixed(2)}ms)`);
        }

        // Check for large resources
        if (size > 1024 * 1024) { // 1MB
            console.warn(`Large resource detected: ${entry.name} (${(size / 1024 / 1024).toFixed(2)}MB)`);
        }
    }

    /**
     * Get optimization metrics
     */
    getOptimizationMetrics() {
        return {
            ...this.metrics,
            lazyElementsConfigured: this.lazyResources.size,
            criticalResourcesPreloaded: this.criticalResources.size,
            fallbacksConfigured: this.fallbackResources.size
        };
    }

    /**
     * Optimize existing images on the page
     */
    optimizeExistingImages() {
        const images = document.querySelectorAll('img:not([data-optimized])');

        images.forEach(img => {
            // Add loading="lazy" for modern browsers
            if ('loading' in HTMLImageElement.prototype) {
                img.loading = 'lazy';
            }

            // Add optimization marker
            img.dataset.optimized = 'true';

            // Convert to WebP if supported and not already WebP
            if (this.settings.enableWebP && this.supportsWebP() && !img.src.includes('.webp')) {
                const webpSrc = this.getOptimizedImageSrc(img.src);
                if (webpSrc !== img.src) {
                    const webpImg = new Image();
                    webpImg.onload = () => {
                        img.src = webpSrc;
                        console.log(`🔄 Converted to WebP: ${webpSrc}`);
                    };
                    webpImg.src = webpSrc;
                }
            }
        });

        console.log(`🖼️ Optimized ${images.length} existing images`);
    }

    /**
     * Prefetch resources for next page
     */
    prefetchNextPageResources(nextPageUrl) {
        // This would typically analyze the next page and prefetch its resources
        console.log(`🔮 Prefetching resources for: ${nextPageUrl}`);

        // Add prefetch link
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = nextPageUrl;
        document.head.appendChild(link);
    }

    /**
     * Clean up resource optimizer
     */
    cleanup() {
        if (this.lazyObserver) {
            this.lazyObserver.disconnect();
        }

        this.criticalResources.clear();
        this.lazyResources.clear();
        this.resourceCache.clear();
        this.fallbackResources.clear();

        this.isInitialized = false;
        console.log('🧹 Resource Optimizer cleaned up');
    }
}

// Export singleton instance
export const resourceOptimizer = new ResourceOptimizer();