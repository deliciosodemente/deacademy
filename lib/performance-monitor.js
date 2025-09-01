/**
 * Performance Monitor System for Digital English Academy
 * Tracks Core Web Vitals, resource timing, and memory usage
 */

export class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.observers = new Map();
        this.isInitialized = false;
        this.reportingEndpoint = null;
        this.reportingInterval = 30000; // 30 seconds
        this.maxMetricsHistory = 100;

        // Core Web Vitals thresholds
        this.thresholds = {
            FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
            LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
            FID: { good: 100, poor: 300 },   // First Input Delay
            CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
            TTFB: { good: 800, poor: 1800 }  // Time to First Byte
        };

        // Performance data storage
        this.performanceData = {
            coreWebVitals: [],
            resourceTiming: [],
            memoryUsage: [],
            navigationTiming: [],
            customMetrics: []
        };

        // Resource optimization settings
        this.optimizationSettings = {
            enablePreloading: true,
            enableLazyLoading: true,
            enableResourceHints: true,
            criticalResourceTimeout: 5000
        };
    }

    /**
     * Initialize the performance monitoring system
     */
    initialize(config = {}) {
        if (this.isInitialized) return;

        this.reportingEndpoint = config.reportingEndpoint;
        this.reportingInterval = config.reportingInterval || this.reportingInterval;
        this.optimizationSettings = { ...this.optimizationSettings, ...config.optimization };

        // Set up performance observers
        this.setupPerformanceObservers();

        // Track page load performance
        this.trackPageLoad();

        // Monitor memory usage
        this.startMemoryMonitoring();

        // Set up resource timing monitoring
        this.setupResourceTimingMonitoring();

        // Start periodic reporting
        this.startPeriodicReporting();

        // Set up navigation timing
        this.trackNavigationTiming();

        this.isInitialized = true;
        console.log('📊 Performance Monitor initialized');
    }

    /**
     * Set up performance observers for Core Web Vitals
     */
    setupPerformanceObservers() {
        // First Contentful Paint (FCP)
        this.observePerformanceEntry('paint', (entries) => {
            entries.forEach(entry => {
                if (entry.name === 'first-contentful-paint') {
                    this.recordMetric('FCP', entry.startTime, {
                        timestamp: Date.now(),
                        url: window.location.href,
                        rating: this.getRating('FCP', entry.startTime)
                    });
                }
            });
        });

        // Largest Contentful Paint (LCP)
        this.observePerformanceEntry('largest-contentful-paint', (entries) => {
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
                this.recordMetric('LCP', lastEntry.startTime, {
                    timestamp: Date.now(),
                    url: window.location.href,
                    element: lastEntry.element?.tagName || 'unknown',
                    rating: this.getRating('LCP', lastEntry.startTime)
                });
            }
        });

        // First Input Delay (FID)
        this.observePerformanceEntry('first-input', (entries) => {
            entries.forEach(entry => {
                this.recordMetric('FID', entry.processingStart - entry.startTime, {
                    timestamp: Date.now(),
                    url: window.location.href,
                    eventType: entry.name,
                    rating: this.getRating('FID', entry.processingStart - entry.startTime)
                });
            });
        });

        // Cumulative Layout Shift (CLS)
        this.observePerformanceEntry('layout-shift', (entries) => {
            let clsValue = 0;
            entries.forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });

            if (clsValue > 0) {
                this.recordMetric('CLS', clsValue, {
                    timestamp: Date.now(),
                    url: window.location.href,
                    rating: this.getRating('CLS', clsValue)
                });
            }
        });

        // Long Tasks
        this.observePerformanceEntry('longtask', (entries) => {
            entries.forEach(entry => {
                this.recordMetric('LongTask', entry.duration, {
                    timestamp: Date.now(),
                    url: window.location.href,
                    startTime: entry.startTime,
                    attribution: entry.attribution?.[0]?.name || 'unknown'
                });
            });
        });
    }

    /**
     * Generic performance observer setup
     */
    observePerformanceEntry(type, callback) {
        try {
            const observer = new PerformanceObserver((list) => {
                callback(list.getEntries());
            });

            observer.observe({ type, buffered: true });
            this.observers.set(type, observer);

        } catch (error) {
            console.warn(`Performance observer for ${type} not supported:`, error);
        }
    }

    /**
     * Track page load performance
     */
    trackPageLoad() {
        // Wait for page load to complete
        if (document.readyState === 'complete') {
            this.measurePageLoadMetrics();
        } else {
            window.addEventListener('load', () => {
                setTimeout(() => this.measurePageLoadMetrics(), 0);
            });
        }
    }

    /**
     * Measure page load metrics
     */
    measurePageLoadMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (!navigation) return;

        // Time to First Byte (TTFB)
        const ttfb = navigation.responseStart - navigation.requestStart;
        this.recordMetric('TTFB', ttfb, {
            timestamp: Date.now(),
            url: window.location.href,
            rating: this.getRating('TTFB', ttfb)
        });

        // DOM Content Loaded
        const dcl = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
        this.recordMetric('DCL', dcl, {
            timestamp: Date.now(),
            url: window.location.href
        });

        // Load Event
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        this.recordMetric('LoadTime', loadTime, {
            timestamp: Date.now(),
            url: window.location.href
        });

        // Store navigation timing
        this.performanceData.navigationTiming.push({
            timestamp: Date.now(),
            url: window.location.href,
            metrics: {
                ttfb,
                dcl,
                loadTime,
                domInteractive: navigation.domInteractive - navigation.navigationStart,
                domComplete: navigation.domComplete - navigation.navigationStart
            }
        });
    }

    /**
     * Start memory usage monitoring
     */
    startMemoryMonitoring() {
        if (!('memory' in performance)) {
            console.warn('Memory API not supported');
            return;
        }

        const measureMemory = () => {
            const memory = performance.memory;
            const memoryData = {
                timestamp: Date.now(),
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize,
                limit: memory.jsHeapSizeLimit,
                usage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
            };

            this.performanceData.memoryUsage.push(memoryData);

            // Keep only recent memory data
            if (this.performanceData.memoryUsage.length > this.maxMetricsHistory) {
                this.performanceData.memoryUsage = this.performanceData.memoryUsage.slice(-this.maxMetricsHistory);
            }

            // Check for memory leaks
            this.checkMemoryLeaks(memoryData);
        };

        // Measure immediately and then every 10 seconds
        measureMemory();
        setInterval(measureMemory, 10000);
    }

    /**
     * Check for potential memory leaks
     */
    checkMemoryLeaks(currentMemory) {
        const recentMemory = this.performanceData.memoryUsage.slice(-10);
        if (recentMemory.length < 10) return;

        // Check if memory usage is consistently increasing
        const trend = this.calculateMemoryTrend(recentMemory);
        if (trend > 0.1) { // 10% increase trend
            console.warn('🚨 Potential memory leak detected', {
                trend,
                currentUsage: currentMemory.usage,
                recentMemory: recentMemory.map(m => m.usage)
            });

            // Trigger memory leak event
            window.dispatchEvent(new CustomEvent('memoryLeakDetected', {
                detail: { trend, currentMemory, recentMemory }
            }));
        }
    }

    /**
     * Calculate memory usage trend
     */
    calculateMemoryTrend(memoryData) {
        if (memoryData.length < 2) return 0;

        const first = memoryData[0].usage;
        const last = memoryData[memoryData.length - 1].usage;
        return (last - first) / first;
    }

    /**
     * Set up resource timing monitoring
     */
    setupResourceTimingMonitoring() {
        // Monitor resource loading
        this.observePerformanceEntry('resource', (entries) => {
            entries.forEach(entry => {
                const resourceData = {
                    timestamp: Date.now(),
                    name: entry.name,
                    type: this.getResourceType(entry),
                    duration: entry.duration,
                    size: entry.transferSize || 0,
                    cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
                    timing: {
                        dns: entry.domainLookupEnd - entry.domainLookupStart,
                        tcp: entry.connectEnd - entry.connectStart,
                        request: entry.responseStart - entry.requestStart,
                        response: entry.responseEnd - entry.responseStart
                    }
                };

                this.performanceData.resourceTiming.push(resourceData);

                // Check for slow resources
                this.checkSlowResource(resourceData);
            });

            // Keep only recent resource data
            if (this.performanceData.resourceTiming.length > this.maxMetricsHistory * 2) {
                this.performanceData.resourceTiming = this.performanceData.resourceTiming.slice(-this.maxMetricsHistory * 2);
            }
        });
    }

    /**
     * Get resource type from performance entry
     */
    getResourceType(entry) {
        if (entry.initiatorType) return entry.initiatorType;

        const url = entry.name.toLowerCase();
        if (url.includes('.css')) return 'css';
        if (url.includes('.js')) return 'script';
        if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
        if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
        return 'other';
    }

    /**
     * Check for slow loading resources
     */
    checkSlowResource(resourceData) {
        const slowThresholds = {
            css: 2000,
            script: 3000,
            image: 4000,
            font: 2000,
            other: 5000
        };

        const threshold = slowThresholds[resourceData.type] || slowThresholds.other;

        if (resourceData.duration > threshold) {
            console.warn('🐌 Slow resource detected:', {
                name: resourceData.name,
                type: resourceData.type,
                duration: resourceData.duration,
                threshold
            });

            // Trigger slow resource event
            window.dispatchEvent(new CustomEvent('slowResourceDetected', {
                detail: resourceData
            }));
        }
    }

    /**
     * Record a performance metric
     */
    recordMetric(name, value, metadata = {}) {
        const metric = {
            name,
            value,
            timestamp: Date.now(),
            url: window.location.href,
            ...metadata
        };

        // Store in appropriate category
        if (['FCP', 'LCP', 'FID', 'CLS', 'TTFB'].includes(name)) {
            this.performanceData.coreWebVitals.push(metric);
        } else {
            this.performanceData.customMetrics.push(metric);
        }

        // Keep history size manageable
        this.trimMetricsHistory();

        // Log significant metrics
        if (['FCP', 'LCP', 'FID', 'CLS', 'TTFB'].includes(name)) {
            console.log(`📊 ${name}: ${value.toFixed(2)}ms (${metadata.rating || 'unknown'})`);
        }

        // Store in metrics map for quick access
        this.metrics.set(name, metric);
    }

    /**
     * Trim metrics history to prevent memory bloat
     */
    trimMetricsHistory() {
        Object.keys(this.performanceData).forEach(key => {
            const data = this.performanceData[key];
            if (Array.isArray(data) && data.length > this.maxMetricsHistory) {
                this.performanceData[key] = data.slice(-this.maxMetricsHistory);
            }
        });
    }

    /**
     * Get performance rating based on thresholds
     */
    getRating(metricName, value) {
        const threshold = this.thresholds[metricName];
        if (!threshold) return 'unknown';

        if (value <= threshold.good) return 'good';
        if (value <= threshold.poor) return 'needs-improvement';
        return 'poor';
    }

    /**
     * Track navigation timing
     */
    trackNavigationTiming() {
        // Track route changes for SPA
        let currentUrl = window.location.href;

        const trackNavigation = () => {
            const newUrl = window.location.href;
            if (newUrl !== currentUrl) {
                const navigationStart = performance.now();
                currentUrl = newUrl;

                // Record navigation
                this.recordMetric('Navigation', 0, {
                    from: currentUrl,
                    to: newUrl,
                    timestamp: Date.now(),
                    startTime: navigationStart
                });

                // Track when navigation completes
                requestAnimationFrame(() => {
                    const navigationEnd = performance.now();
                    this.recordMetric('NavigationDuration', navigationEnd - navigationStart, {
                        url: newUrl,
                        timestamp: Date.now()
                    });
                });
            }
        };

        // Listen for history changes
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function (...args) {
            originalPushState.apply(history, args);
            setTimeout(trackNavigation, 0);
        };

        history.replaceState = function (...args) {
            originalReplaceState.apply(history, args);
            setTimeout(trackNavigation, 0);
        };

        window.addEventListener('popstate', trackNavigation);
    }

    /**
     * Start periodic performance reporting
     */
    startPeriodicReporting() {
        if (!this.reportingEndpoint) return;

        setInterval(() => {
            this.generatePerformanceReport();
        }, this.reportingInterval);
    }

    /**
     * Generate comprehensive performance report
     */
    generatePerformanceReport() {
        const report = {
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            connection: this.getConnectionInfo(),
            coreWebVitals: this.getCoreWebVitalsReport(),
            resourcePerformance: this.getResourcePerformanceReport(),
            memoryUsage: this.getMemoryReport(),
            customMetrics: this.getCustomMetricsReport(),
            recommendations: this.generateRecommendations()
        };

        console.log('📊 Performance Report Generated:', report);

        // Send to reporting endpoint if configured
        if (this.reportingEndpoint) {
            this.sendReport(report);
        }

        return report;
    }

    /**
     * Get connection information
     */
    getConnectionInfo() {
        if ('connection' in navigator) {
            const conn = navigator.connection;
            return {
                effectiveType: conn.effectiveType,
                downlink: conn.downlink,
                rtt: conn.rtt,
                saveData: conn.saveData
            };
        }
        return null;
    }

    /**
     * Get Core Web Vitals report
     */
    getCoreWebVitalsReport() {
        const vitals = {};
        ['FCP', 'LCP', 'FID', 'CLS', 'TTFB'].forEach(metric => {
            const data = this.performanceData.coreWebVitals.filter(m => m.name === metric);
            if (data.length > 0) {
                const latest = data[data.length - 1];
                vitals[metric] = {
                    value: latest.value,
                    rating: latest.rating,
                    timestamp: latest.timestamp
                };
            }
        });
        return vitals;
    }

    /**
     * Get resource performance report
     */
    getResourcePerformanceReport() {
        const resources = this.performanceData.resourceTiming.slice(-20); // Last 20 resources
        const summary = {
            totalResources: resources.length,
            averageLoadTime: resources.reduce((sum, r) => sum + r.duration, 0) / resources.length || 0,
            slowResources: resources.filter(r => r.duration > 2000).length,
            cachedResources: resources.filter(r => r.cached).length,
            byType: {}
        };

        // Group by resource type
        resources.forEach(resource => {
            if (!summary.byType[resource.type]) {
                summary.byType[resource.type] = {
                    count: 0,
                    totalSize: 0,
                    averageDuration: 0
                };
            }
            summary.byType[resource.type].count++;
            summary.byType[resource.type].totalSize += resource.size;
        });

        // Calculate averages
        Object.keys(summary.byType).forEach(type => {
            const typeData = summary.byType[type];
            const typeResources = resources.filter(r => r.type === type);
            typeData.averageDuration = typeResources.reduce((sum, r) => sum + r.duration, 0) / typeResources.length;
        });

        return summary;
    }

    /**
     * Get memory usage report
     */
    getMemoryReport() {
        const recentMemory = this.performanceData.memoryUsage.slice(-10);
        if (recentMemory.length === 0) return null;

        const latest = recentMemory[recentMemory.length - 1];
        const trend = this.calculateMemoryTrend(recentMemory);

        return {
            current: {
                used: latest.used,
                total: latest.total,
                usage: latest.usage
            },
            trend,
            isIncreasing: trend > 0.05 // 5% increase
        };
    }

    /**
     * Get custom metrics report
     */
    getCustomMetricsReport() {
        return this.performanceData.customMetrics.slice(-10);
    }

    /**
     * Generate performance recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        const vitals = this.getCoreWebVitalsReport();

        // FCP recommendations
        if (vitals.FCP && vitals.FCP.rating === 'poor') {
            recommendations.push({
                metric: 'FCP',
                issue: 'Slow First Contentful Paint',
                suggestion: 'Consider inlining critical CSS and optimizing server response time'
            });
        }

        // LCP recommendations
        if (vitals.LCP && vitals.LCP.rating === 'poor') {
            recommendations.push({
                metric: 'LCP',
                issue: 'Slow Largest Contentful Paint',
                suggestion: 'Optimize largest content element, consider image optimization and preloading'
            });
        }

        // CLS recommendations
        if (vitals.CLS && vitals.CLS.rating === 'poor') {
            recommendations.push({
                metric: 'CLS',
                issue: 'High Cumulative Layout Shift',
                suggestion: 'Add size attributes to images and reserve space for dynamic content'
            });
        }

        // Memory recommendations
        const memoryReport = this.getMemoryReport();
        if (memoryReport && memoryReport.isIncreasing) {
            recommendations.push({
                metric: 'Memory',
                issue: 'Increasing memory usage detected',
                suggestion: 'Check for memory leaks and optimize object cleanup'
            });
        }

        return recommendations;
    }

    /**
     * Send performance report to endpoint
     */
    async sendReport(report) {
        try {
            await fetch(this.reportingEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(report)
            });
        } catch (error) {
            console.warn('Failed to send performance report:', error);
        }
    }

    /**
     * Get current performance metrics
     */
    getCurrentMetrics() {
        return {
            coreWebVitals: this.getCoreWebVitalsReport(),
            memory: this.getMemoryReport(),
            resources: this.getResourcePerformanceReport()
        };
    }

    /**
     * Measure custom performance metric
     */
    measureCustomMetric(name, startTime = performance.now()) {
        return {
            end: () => {
                const duration = performance.now() - startTime;
                this.recordMetric(name, duration, {
                    timestamp: Date.now(),
                    custom: true
                });
                return duration;
            }
        };
    }

    /**
     * Mark performance milestone
     */
    markMilestone(name) {
        const timestamp = performance.now();
        performance.mark(name);

        this.recordMetric(`Milestone_${name}`, timestamp, {
            timestamp: Date.now(),
            milestone: true
        });

        return timestamp;
    }

    /**
     * Measure time between milestones
     */
    measureBetweenMilestones(startMark, endMark, metricName) {
        try {
            performance.measure(metricName, startMark, endMark);
            const measure = performance.getEntriesByName(metricName, 'measure')[0];

            if (measure) {
                this.recordMetric(metricName, measure.duration, {
                    timestamp: Date.now(),
                    startMark,
                    endMark
                });
                return measure.duration;
            }
        } catch (error) {
            console.warn(`Failed to measure between ${startMark} and ${endMark}:`, error);
        }
        return null;
    }

    /**
     * Clean up performance monitoring
     */
    cleanup() {
        // Disconnect all observers
        this.observers.forEach(observer => {
            try {
                observer.disconnect();
            } catch (error) {
                console.warn('Error disconnecting observer:', error);
            }
        });

        this.observers.clear();
        this.isInitialized = false;
        console.log('📊 Performance Monitor cleaned up');
    }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();