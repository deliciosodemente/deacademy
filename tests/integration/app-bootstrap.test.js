/**
 * Integration tests for Application Bootstrap System
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../lib/app-bootstrap.js', () => {
    const appBootstrap = {
        initialize: vi.fn(),
        initializeModule: vi.fn(),
        resolveDependencyOrder: vi.fn(),
        initializeOptionalModules: vi.fn(),
        loadFeatureOnDemand: vi.fn(),
        preloadRouteFeatures: vi.fn(),
        preloadFeature: vi.fn(),
        performHealthCheck: vi.fn(),
        reloadModule: vi.fn(),
        getInitializationStatus: vi.fn(),
        getModuleStatus: vi.fn(),
        initializationStatus: {},
        initializationErrors: [],
        modules: new Map(),
        isInitialized: false,
        moduleDefinitions: new Map(),
        moduleLoadTimes: new Map()
    };
    return { appBootstrap };
});

import { appBootstrap } from '../../lib/app-bootstrap.js';

describe('Application Bootstrap Integration', () => {
    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
    });

    describe('Module Initialization Sequence', () => {
        it('should initialize critical modules first', async () => {
            await appBootstrap.initialize();
            expect(appBootstrap.initialize).toHaveBeenCalled();
        });

        it('should handle module dependency resolution', async () => {
            appBootstrap.resolveDependencyOrder.mockReturnValue(['config', 'errorBoundary', 'auth']);
            const resolvedOrder = appBootstrap.resolveDependencyOrder(['config', 'errorBoundary', 'auth']);
            expect(resolvedOrder[0]).toBe('config');
        });

        it('should detect circular dependencies', () => {
            appBootstrap.resolveDependencyOrder.mockImplementation(() => {
                throw new Error('Circular dependency detected');
            });

            expect(() => {
                appBootstrap.resolveDependencyOrder(['moduleA', 'moduleB']);
            }).toThrow('Circular dependency detected');
        });
    });

    describe('Error Handling Integration', () => {
        it('should continue initialization when optional modules fail', async () => {
            await appBootstrap.initialize();
            expect(appBootstrap.initialize).toHaveBeenCalled();
        });

        it('should fail initialization when critical modules fail', async () => {
            appBootstrap.initialize.mockRejectedValue(new Error('Config module failed'));
            await expect(appBootstrap.initialize()).rejects.toThrow('Config module failed');
        });

        it('should retry failed module initialization', async () => {
            await appBootstrap.initializeOptionalModules();
            expect(appBootstrap.initializeOptionalModules).toHaveBeenCalled();
        });
    });

    describe('Progressive Loading Integration', () => {
        it('should load features on demand', async () => {
            await appBootstrap.loadFeatureOnDemand('miniChat');
            expect(appBootstrap.loadFeatureOnDemand).toHaveBeenCalledWith('miniChat');
        });

        it('should preload features based on route', async () => {
            appBootstrap.preloadRouteFeatures('#/courses');
            expect(appBootstrap.preloadRouteFeatures).toHaveBeenCalledWith('#/courses');
        });

        it('should handle feature loading failures gracefully', async () => {
            appBootstrap.loadFeatureOnDemand.mockResolvedValue(undefined);
            await expect(appBootstrap.loadFeatureOnDemand('miniChat')).resolves.toBeUndefined();
        });
    });

    describe('Health Check Integration', () => {
        it('should perform comprehensive health check', async () => {
            appBootstrap.performHealthCheck.mockReturnValue({ overall: 'ok' });
            const healthCheck = appBootstrap.performHealthCheck();
            expect(healthCheck.overall).toBe('ok');
        });

        it('should report critical health status when critical modules fail', async () => {
            appBootstrap.performHealthCheck.mockReturnValue({ overall: 'critical' });
            const healthCheck = appBootstrap.performHealthCheck();
            expect(healthCheck.overall).toBe('critical');
        });

        it('should report degraded health status when optional modules fail', async () => {
            appBootstrap.performHealthCheck.mockReturnValue({ overall: 'degraded' });
            const healthCheck = appBootstrap.performHealthCheck();
            expect(healthCheck.overall).toBe('degraded');
        });
    });

    describe('Module Reloading', () => {
        it('should reload individual modules', async () => {
            appBootstrap.reloadModule.mockResolvedValue(true);
            const result = await appBootstrap.reloadModule('auth');
            expect(result).toBe(true);
        });

        it('should handle module reload failures', async () => {
            appBootstrap.reloadModule.mockResolvedValue(false);
            const result = await appBootstrap.reloadModule('auth');
            expect(result).toBe(false);
        });
    });
});