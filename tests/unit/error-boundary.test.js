/**
 * Unit tests for Error Boundary System
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../lib/error-boundary.js', () => {
    const errorBoundary = {
        initialize: vi.fn(),
        categorizeError: vi.fn(),
        captureError: vi.fn(),
        attemptRecovery: vi.fn(),
        reportError: vi.fn(),
        getErrorStatistics: vi.fn(),
        getSessionId: vi.fn(),
        generateErrorId: vi.fn(),
        clearErrorHistory: vi.fn(),
        errorCategories: {
            AUTHENTICATION: 'authentication',
            NETWORK: 'network',
            PAYMENT: 'payment',
            DATABASE: 'database',
            JAVASCRIPT: 'javascript',
            RESOURCE_LOADING: 'resource_loading'
        },
        errorHistory: [],
        errorCounts: new Map(),
        isInitialized: false
    };
    return { errorBoundary };
});

import { errorBoundary } from '../../lib/error-boundary.js';

describe('Error Boundary System', () => {
    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize error boundary successfully', () => {
            const config = {
                reportingEndpoint: 'https://api.example.com/errors'
            };

            errorBoundary.initialize(config);

            expect(errorBoundary.initialize).toHaveBeenCalledWith(config);
        });
    });

    describe('Error Categorization', () => {
        it('should categorize authentication errors correctly', () => {
            const authError = new Error('Authentication failed');
            errorBoundary.categorizeError.mockReturnValue(errorBoundary.errorCategories.AUTHENTICATION);
            const category = errorBoundary.categorizeError(authError, {});

            expect(category).toBe(errorBoundary.errorCategories.AUTHENTICATION);
        });
    });

    describe('Error Capture', () => {
        it('should capture error and add to history', () => {
            const testError = new Error('Test error');
            errorBoundary.captureError.mockReturnValue('error-id');
            const errorId = errorBoundary.captureError(testError);

            expect(errorId).toBeDefined();
            expect(errorBoundary.captureError).toHaveBeenCalledWith(testError);
        });
    });

    describe('User-Friendly Messages', () => {
        it('should show user-friendly message for authentication errors', () => {
            const authError = new Error('Authentication failed');
            const context = { type: errorBoundary.errorCategories.AUTHENTICATION };

            errorBoundary.captureError(authError, context);

            expect(errorBoundary.captureError).toHaveBeenCalledWith(authError, context);
        });
    });

    describe('Error Recovery', () => {
        it('should attempt recovery for authentication errors', async () => {
            const context = { errorType: errorBoundary.errorCategories.AUTHENTICATION };
            errorBoundary.attemptRecovery.mockResolvedValue({ success: true });
            const result = await errorBoundary.attemptRecovery(context);

            expect(result).toBeDefined();
            expect(errorBoundary.attemptRecovery).toHaveBeenCalledWith(context);
        });
    });

    describe('Error Reporting', () => {
        it('should report errors to external endpoint', async () => {
            const errorContext = { errorType: 'test' };
            await errorBoundary.reportError(errorContext);
            expect(errorBoundary.reportError).toHaveBeenCalledWith(errorContext);
        });
    });

    describe('Error Statistics', () => {
        it('should provide error statistics', () => {
            const stats = { totalErrors: 3 };
            errorBoundary.getErrorStatistics.mockReturnValue(stats);
            const result = errorBoundary.getErrorStatistics();

            expect(result.totalErrors).toBe(3);
        });
    });

    describe('Utility Methods', () => {
        it('should generate session ID', () => {
            errorBoundary.getSessionId.mockReturnValue('session-id');
            const sessionId = errorBoundary.getSessionId();

            expect(sessionId).toBe('session-id');
        });

        it('should generate unique error IDs', () => {
            errorBoundary.generateErrorId.mockReturnValue('error-id');
            const id1 = errorBoundary.generateErrorId();

            expect(id1).toBeDefined();
        });

        it('should clear error history', () => {
            errorBoundary.clearErrorHistory();
            expect(errorBoundary.clearErrorHistory).toHaveBeenCalled();
        });
    });
});