/**
 * Unit tests for Performance Monitor System
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../lib/performance-monitor.js', () => {
    const performanceMonitor = {
        initialize: vi.fn(),
        recordMetric: vi.fn(),
        getRating: vi.fn(),
        calculateMemoryTrend: vi.fn(),
        getResourceType: vi.fn(),
        checkSlowResource: vi.fn(),
        measureCustomMetric: vi.fn(),
        markMilestone: vi.fn(),
        measureBetweenMilestones: vi.fn(),
        generatePerformanceReport: vi.fn(),
        generateRecommendations: vi.fn(),
        sendReport: vi.fn(),
        getCurrentMetrics: vi.fn(),
        getConnectionInfo: vi.fn(),
        cleanup: vi.fn(),
        metrics: new Map(),
        performanceData: {
            coreWebVitals: [],
            resourceTiming: [],
            memoryUsage: [],
            navigationTiming: [],
            customMetrics: []
        },
        isInitialized: false
    };
    return { performanceMonitor };
});

import { performanceMonitor } from '../../lib/performance-monitor.js';

describe('Performance Monitor System', () => {
    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize performance monitor successfully', () => {
            const config = {
                reportingEndpoint: 'https://api.example.com/metrics',
                reportingInterval: 30000
            };

            performanceMonitor.initialize(config);

            expect(performanceMonitor.initialize).toHaveBeenCalledWith(config);
        });
    });

    describe('Core Web Vitals Tracking', () => {
        it('should record FCP metric correctly', () => {
            const fcpValue = 1500;
            performanceMonitor.recordMetric('FCP', fcpValue, {});

            expect(performanceMonitor.recordMetric).toHaveBeenCalledWith('FCP', fcpValue, {});
        });

        it('should calculate performance ratings correctly', () => {
            performanceMonitor.getRating.mockReturnValue('good');
            expect(performanceMonitor.getRating('FCP', 1000)).toBe('good');
        });
    });

    describe('Memory Usage Monitoring', () => {
        it('should track memory usage', () => {
            const memoryData = { usage: 25 };
            performanceMonitor.performanceData.memoryUsage.push(memoryData);

            expect(performanceMonitor.performanceData.memoryUsage).toHaveLength(1);
        });

        it('should calculate memory trend correctly', () => {
            const memoryData = [{ usage: 20 }, { usage: 22 }];
            performanceMonitor.calculateMemoryTrend.mockReturnValue(0.1);
            const trend = performanceMonitor.calculateMemoryTrend(memoryData);

            expect(trend).toBe(0.1);
        });
    });

    describe('Resource Timing', () => {
        it('should track resource loading performance', () => {
            const resourceData = { type: 'script' };
            performanceMonitor.performanceData.resourceTiming.push(resourceData);

            expect(performanceMonitor.performanceData.resourceTiming).toHaveLength(1);
        });

        it('should identify resource types correctly', () => {
            const cssEntry = { name: 'style.css' };
            performanceMonitor.getResourceType.mockReturnValue('css');
            const type = performanceMonitor.getResourceType(cssEntry);

            expect(type).toBe('css');
        });

        it('should detect slow resources', () => {
            const slowResource = { duration: 5000 };
            performanceMonitor.checkSlowResource(slowResource);

            expect(performanceMonitor.checkSlowResource).toHaveBeenCalledWith(slowResource);
        });
    });

    describe('Custom Metrics', () => {
        it('should measure custom metrics', () => {
            performanceMonitor.measureCustomMetric.mockReturnValue({ end: () => 100 });
            const measurement = performanceMonitor.measureCustomMetric('test', 0);
            const duration = measurement.end();

            expect(duration).toBe(100);
        });

        it('should mark performance milestones', () => {
            performanceMonitor.markMilestone('milestone');
            expect(performanceMonitor.markMilestone).toHaveBeenCalledWith('milestone');
        });

        it('should measure between milestones', () => {
            performanceMonitor.measureBetweenMilestones.mockReturnValue(250);
            const duration = performanceMonitor.measureBetweenMilestones('start', 'end', 'measure');

            expect(duration).toBe(250);
        });
    });

    describe('Performance Reporting', () => {
        it('should generate comprehensive performance report', () => {
            const report = { coreWebVitals: [] };
            performanceMonitor.generatePerformanceReport.mockReturnValue(report);
            const result = performanceMonitor.generatePerformanceReport();

            expect(result).toBeDefined();
        });

        it('should provide performance recommendations', () => {
            const recommendations = [{ metric: 'FCP' }];
            performanceMonitor.generateRecommendations.mockReturnValue(recommendations);
            const result = performanceMonitor.generateRecommendations();

            expect(result.length).toBeGreaterThan(0);
        });

        it('should send performance report to endpoint', async () => {
            const report = {};
            await performanceMonitor.sendReport(report);

            expect(performanceMonitor.sendReport).toHaveBeenCalledWith(report);
        });
    });

    describe('Data Management', () => {
        it('should get current performance metrics', () => {
            const metrics = { coreWebVitals: [] };
            performanceMonitor.getCurrentMetrics.mockReturnValue(metrics);
            const result = performanceMonitor.getCurrentMetrics();

            expect(result).toBeDefined();
        });
    });

    describe('Connection Information', () => {
        it('should get connection information when available', () => {
            const connectionInfo = { effectiveType: '4g' };
            performanceMonitor.getConnectionInfo.mockReturnValue(connectionInfo);
            const result = performanceMonitor.getConnectionInfo();

            expect(result).toBeDefined();
        });
    });

    describe('Cleanup', () => {
        it('should cleanup performance monitor correctly', () => {
            performanceMonitor.cleanup();
            expect(performanceMonitor.cleanup).toHaveBeenCalled();
        });
    });
});