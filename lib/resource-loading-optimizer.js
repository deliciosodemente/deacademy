/**
 * Resource Loading Optimizer
 * Handles critical CSS inlining, resource preloading, and font optimization
 */

export class ResourceLoadingOptimizer {
    constructor() {
        this.criticalCSS = '';
        this.nonCriticalCSS = [];
        this.preloadedResources = new Set();
        this.fontLoadingStrategy = 'swap';
        this.isInitialized = false;
    }

    /**
     * Initialize resource loading optimization
     */
    initialize() {
        if (this.isInitialized) return;

        // Optimize font loading
        this.optimizeFontLoading();

        // Handle critical CSS
        this.handleCriticalCSS();

        // Set up resource preloading
        this.setupResourcePreloading();

        // Optimize images
        this.optimizeImageLoading();

        // Set up lazy loading for non-critical resources
        this.setupLazyLoading();

        this.isInitialized = true;
        console.log('🚀 Resource Loading Optimizer initialized');
    }

    /**
     * Optimize font loading with font-display strategies
     */
    optimizeFontLoading() {
        // Add font-display: swap to existing font links
        const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
        fontLinks.forEach(link => {
            const href = link.href;
            if (!href.includes('display=')) {
                link.href = href + (href.includes('?') ? '&' : '?') + 'display=swap';
            }
        });

        // Preload critical fonts
        this.preloadCriticalFonts();

        console.log('🔤 Font loading optimized');
    }

    /**
     * Preload critical fonts
     */
    preloadCriticalFonts() {
        const criticalFonts = [
            'https://fonts.gstatic.com/s/notosans/v36/o-0IIpQlx3QUlC5A4PNr5TRASf6M7Q.woff2',
            'https://fonts.gstatic.com/s/notosans/v36/o-0NIpQlx3QUlC5A4PNjXhFVZNyB.woff2'
        ];

        criticalFonts.forEach(fontUrl => {
            if (!this.preloadedResources.has(fontUrl)) {
                this.preloadResource(fontUrl, 'font', true);
            }
        });
    }

    /**
     * Handle critical CSS inlining and loading
     */
    handleCriticalCSS() {
        // Extract critical CSS (this would typically be done at build time)
        this.extractCriticalCSS();

        // Inline critical CSS
        this.inlineCriticalCSS();

        // Load non-critical CSS asynchronously
        this.loadNonCriticalCSS();

        console.log('🎨 Critical CSS handling complete');
    }

    /**
     * Extract critical CSS (placeholder for build-time process)
     */
    extractCriticalCSS() {
        // In a real implementation, this would be done at build time
        // using tools like Critical, Penthouse, or custom extraction
        this.criticalCSS = `
            /* Critical CSS - Above the fold styles */
            body {
                font-family: 'Noto Sans', system-ui, -apple-system, sans-serif;
                margin: 0;
                padding: 0;
                line-height: 1.6;
                color: #333;
            }
            
            .site-header {
                position: sticky;
                top: 0;
                z-index: 100;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 1rem;
            }
            
            .header-inner {
                display: flex;
                align-items: center;
                justify-content: space-between;
                height: 64px;
            }
            
            .brand {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                text-decoration: none;
                color: inherit;
            }
            
            .brand-mark {
                width: 32px;
                height: 32px;
                background: #0a66ff;
                color: white;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 14px;
            }
            
            .brand-name {
                font-weight: 600;
                font-size: 1.1rem;
            }
            
            .primary-nav {
                display: none;
            }
            
            @media (min-width: 768px) {
                .primary-nav {
                    display: block;
                }
                
                .nav-list {
                    display: flex;
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    gap: 1rem;
                }
                
                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    text-decoration: none;
                    color: inherit;
                    border-radius: 6px;
                    transition: background-color 0.2s;
                }
                
                .nav-link:hover {
                    background-color: rgba(0, 0, 0, 0.05);
                }
            }
            
            .cta-group {
                display: flex;
                gap: 0.5rem;
            }
            
            .btn {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 6px;
                font-size: 0.9rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }
            
            .btn-ghost {
                background: transparent;
                color: inherit;
                border: 1px solid rgba(0, 0, 0, 0.2);
            }
            
            .btn-ghost:hover {
                background: rgba(0, 0, 0, 0.05);
            }
            
            .btn-primary {
                background: #0a66ff;
                color: white;
            }
            
            .btn-primary:hover {
                background: #0052cc;
            }
            
            .nav-toggle {
                display: block;
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.5rem;
            }
            
            @media (min-width: 768px) {
                .nav-toggle {
                    display: none;
                }
            }
            
            .skip-link {
                position: absolute;
                top: -40px;
                left: 6px;
                background: #000;
                color: #fff;
                padding: 8px;
                text-decoration: none;
                border-radius: 4px;
                z-index: 10000;
                transition: top 0.3s;
            }
            
            .skip-link:focus {
                top: 6px;
            }
            
            .sr-only {
                position: absolute !important;
                width: 1px !important;
                height: 1px !important;
                padding: 0 !important;
                margin: -1px !important;
                overflow: hidden !important;
                clip: rect(0, 0, 0, 0) !important;
                white-space: nowrap !important;
                border: 0 !important;
            }
            
            .loading-indicator {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 2rem;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                z-index: 9999;
                text-align: center;
            }
            
            .loading-spinner {
                width: 32px;
                height: 32px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #0a66ff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .loading-text {
                color: #666;
                font-size: 0.9rem;
            }
        `;
    }

    /**
     * Inline critical CSS
     */
    inlineCriticalCSS() {
        const criticalStyleElement = document.getElementById('critical-css');
        if (criticalStyleElement && this.criticalCSS) {
            criticalStyleElement.textContent = this.criticalCSS;
        }
    }

    /**
     * Load non-critical CSS asynchronously
     */
    loadNonCriticalCSS() {
        // Load main stylesheet asynchronously if not already loaded
        const mainStylesheet = document.querySelector('link[href="./styles.css"]');
        if (!mainStylesheet) {
            this.loadStylesheetAsync('./styles.css');
        }

        // Load other non-critical stylesheets
        const nonCriticalStylesheets = [
            // Add other non-critical stylesheets here
        ];

        nonCriticalStylesheets.forEach(href => {
            this.loadStylesheetAsync(href);
        });
    }

    /**
     * Load stylesheet asynchronously
     */
    loadStylesheetAsync(href) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = href;
        link.onload = function () {
            this.onload = null;
            this.rel = 'stylesheet';
        };

        // Fallback for browsers that don't support preload
        const noscript = document.createElement('noscript');
        const fallbackLink = document.createElement('link');
        fallbackLink.rel = 'stylesheet';
        fallbackLink.href = href;
        noscript.appendChild(fallbackLink);

        document.head.appendChild(link);
        document.head.appendChild(noscript);
    }

    /**
     * Set up resource preloading
     */
    setupResourcePreloading() {
        // Preload critical scripts
        const criticalScripts = [
            './app.js',
            './router.js',
            './lib/app-bootstrap.js'
        ];

        criticalScripts.forEach(src => {
            this.preloadResource(src, 'script');
        });

        // Preload critical images
        const criticalImages = [
            '/logo.png',
            '/hero-image.jpg'
        ];

        criticalImages.forEach(src => {
            this.preloadResource(src, 'image');
        });

        console.log('📦 Resource preloading configured');
    }

    /**
     * Preload a resource
     */
    preloadResource(href, as, crossorigin = false) {
        if (this.preloadedResources.has(href)) return;

        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;

        if (crossorigin) {
            link.crossOrigin = 'anonymous';
        }

        link.onerror = () => {
            console.warn(`Failed to preload resource: ${href}`);
        };

        document.head.appendChild(link);
        this.preloadedResources.add(href);
    }

    /**
     * Optimize image loading
     */
    optimizeImageLoading() {
        // Add loading="lazy" to images below the fold
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach((img, index) => {
            // First few images should load eagerly (above the fold)
            if (index < 3) {
                img.loading = 'eager';
            } else {
                img.loading = 'lazy';
            }
        });

        // Set up responsive image loading
        this.setupResponsiveImages();

        console.log('🖼️ Image loading optimized');
    }

    /**
     * Set up responsive image loading
     */
    setupResponsiveImages() {
        // Add srcset for responsive images
        const images = document.querySelectorAll('img[data-responsive]');
        images.forEach(img => {
            const baseSrc = img.src;
            const extension = baseSrc.split('.').pop();
            const baseName = baseSrc.replace(`.${extension}`, '');

            // Generate srcset for different screen sizes
            const srcset = [
                `${baseName}-320w.${extension} 320w`,
                `${baseName}-640w.${extension} 640w`,
                `${baseName}-960w.${extension} 960w`,
                `${baseName}-1280w.${extension} 1280w`
            ].join(', ');

            img.srcset = srcset;
            img.sizes = '(max-width: 320px) 280px, (max-width: 640px) 600px, (max-width: 960px) 920px, 1240px';
        });
    }

    /**
     * Set up lazy loading for non-critical resources
     */
    setupLazyLoading() {
        // Lazy load non-critical scripts
        this.lazyLoadScripts();

        // Lazy load non-critical stylesheets
        this.lazyLoadStylesheets();

        console.log('⏳ Lazy loading configured');
    }

    /**
     * Lazy load non-critical scripts
     */
    lazyLoadScripts() {
        const nonCriticalScripts = [
            {
                src: 'https://unpkg.com/@phosphor-icons/web',
                condition: () => document.querySelector('.ph')
            }
        ];

        nonCriticalScripts.forEach(({ src, condition }) => {
            if (condition && condition()) {
                this.loadScriptAsync(src);
            } else {
                // Load on user interaction
                const loadOnInteraction = () => {
                    this.loadScriptAsync(src);
                    document.removeEventListener('click', loadOnInteraction);
                    document.removeEventListener('scroll', loadOnInteraction);
                    document.removeEventListener('keydown', loadOnInteraction);
                };

                document.addEventListener('click', loadOnInteraction, { once: true });
                document.addEventListener('scroll', loadOnInteraction, { once: true });
                document.addEventListener('keydown', loadOnInteraction, { once: true });
            }
        });
    }

    /**
     * Load script asynchronously
     */
    loadScriptAsync(src) {
        if (document.querySelector(`script[src="${src}"]`)) return;

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.defer = true;

        script.onerror = () => {
            console.warn(`Failed to load script: ${src}`);
        };

        document.head.appendChild(script);
    }

    /**
     * Lazy load non-critical stylesheets
     */
    lazyLoadStylesheets() {
        const nonCriticalStylesheets = [
            // Add non-critical stylesheets here
        ];

        nonCriticalStylesheets.forEach(href => {
            // Load after a delay
            setTimeout(() => {
                this.loadStylesheetAsync(href);
            }, 1000);
        });
    }

    /**
     * Optimize resource hints
     */
    optimizeResourceHints() {
        // Add DNS prefetch for external domains
        const externalDomains = [
            '//fonts.googleapis.com',
            '//fonts.gstatic.com',
            '//cdn.auth0.com',
            '//js.stripe.com',
            '//unpkg.com'
        ];

        externalDomains.forEach(domain => {
            if (!document.querySelector(`link[href="${domain}"]`)) {
                const link = document.createElement('link');
                link.rel = 'dns-prefetch';
                link.href = domain;
                document.head.appendChild(link);
            }
        });

        // Add preconnect for critical origins
        const criticalOrigins = [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com'
        ];

        criticalOrigins.forEach(origin => {
            if (!document.querySelector(`link[href="${origin}"]`)) {
                const link = document.createElement('link');
                link.rel = 'preconnect';
                link.href = origin;
                if (origin.includes('gstatic')) {
                    link.crossOrigin = 'anonymous';
                }
                document.head.appendChild(link);
            }
        });

        console.log('🔗 Resource hints optimized');
    }

    /**
     * Monitor resource loading performance
     */
    monitorResourcePerformance() {
        // Monitor font loading
        if ('fonts' in document) {
            document.fonts.ready.then(() => {
                console.log('🔤 All fonts loaded');
                performance.mark('fonts-loaded');
            });
        }

        // Monitor critical resource loading
        window.addEventListener('load', () => {
            performance.mark('resources-loaded');

            // Measure resource loading times
            const resourceEntries = performance.getEntriesByType('resource');
            const slowResources = resourceEntries.filter(entry => entry.duration > 1000);

            if (slowResources.length > 0) {
                console.warn('🐌 Slow resources detected:', slowResources);
            }
        });
    }

    /**
     * Get optimization metrics
     */
    getOptimizationMetrics() {
        return {
            preloadedResources: this.preloadedResources.size,
            criticalCSSInlined: this.criticalCSS.length > 0,
            fontLoadingOptimized: true,
            lazyLoadingEnabled: true
        };
    }
}

// Auto-initialize if running in browser
if (typeof window !== 'undefined') {
    const optimizer = new ResourceLoadingOptimizer();

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => optimizer.initialize());
    } else {
        optimizer.initialize();
    }

    // Expose for debugging
    window.resourceOptimizer = optimizer;
}

export const resourceLoadingOptimizer = new ResourceLoadingOptimizer();