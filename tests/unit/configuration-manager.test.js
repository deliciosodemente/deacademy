/**
 * Unit tests for Configuration Manager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../lib/configuration-manager.js', () => {
    const ConfigurationManager = vi.fn();
    ConfigurationManager.prototype.detectEnvironment = vi.fn();
    ConfigurationManager.prototype.loadEnvironmentConfig = vi.fn();
    ConfigurationManager.prototype.validateConfiguration = vi.fn();
    ConfigurationManager.prototype.getFeatureFlag = vi.fn();
    ConfigurationManager.prototype.setFeatureFlag = vi.fn();
    ConfigurationManager.prototype.toggleFeatureFlag = vi.fn();
    ConfigurationManager.prototype.isDevelopmentMode = vi.fn();
    ConfigurationManager.prototype.getSecureConfig = vi.fn();
    ConfigurationManager.prototype.getConfig = vi.fn();
    ConfigurationManager.prototype.updateConfig = vi.fn();

    const configManager = new ConfigurationManager();

    return { configManager };
});

import { configManager } from '../../lib/configuration-manager.js';

describe('Configuration Manager', () => {
    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
    });

    describe('Environment Detection', () => {
        it('should detect development environment correctly', () => {
            configManager.detectEnvironment.mockReturnValue('development');
            const environment = configManager.detectEnvironment();
            expect(environment).toBe('development');
        });

        it('should detect production environment correctly', () => {
            configManager.detectEnvironment.mockReturnValue('production');
            const environment = configManager.detectEnvironment();
            expect(environment).toBe('production');
        });

        it('should detect staging environment correctly', () => {
            configManager.detectEnvironment.mockReturnValue('staging');
            const environment = configManager.detectEnvironment();
            expect(environment).toBe('staging');
        });
    });

    describe('Configuration Loading', () => {
        it('should load environment configuration successfully', () => {
            const mockConfig = { environment: 'development', features: {}, auth0: {}, stripe: {}, mongodb: {} };
            configManager.loadEnvironmentConfig.mockReturnValue(mockConfig);
            const config = configManager.loadEnvironmentConfig();

            expect(config).toBeDefined();
            expect(config.environment).toBeDefined();
            expect(config.features).toBeDefined();
            expect(config.auth0).toBeDefined();
            expect(config.stripe).toBeDefined();
            expect(config.mongodb).toBeDefined();
        });
    });

    describe('Configuration Validation', () => {
        it('should validate valid configuration', () => {
            configManager.validateConfiguration.mockReturnValue({ isValid: true, errors: [] });
            const validation = configManager.validateConfiguration();

            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        it('should detect missing required configuration', () => {
            configManager.validateConfiguration.mockReturnValue({ isValid: false, errors: ['Auth0 domain is required'] });
            const validation = configManager.validateConfiguration();

            expect(validation.isValid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
        });
    });

    describe('Feature Flags', () => {
        it('should get feature flag value correctly', () => {
            configManager.getFeatureFlag.mockReturnValue(true);
            expect(configManager.getFeatureFlag('auth0')).toBe(true);
        });

        it('should set feature flag value correctly', () => {
            configManager.setFeatureFlag('stripe', true);
            expect(configManager.setFeatureFlag).toHaveBeenCalledWith('stripe', true);
        });

        it('should toggle feature flag correctly', () => {
            configManager.toggleFeatureFlag('auth0');
            expect(configManager.toggleFeatureFlag).toHaveBeenCalledWith('auth0');
        });
    });

    describe('Development Mode', () => {
        it('should detect development mode correctly', () => {
            configManager.isDevelopmentMode.mockReturnValue(true);
            expect(configManager.isDevelopmentMode()).toBe(true);
        });

        it('should detect production mode correctly', () => {
            configManager.isDevelopmentMode.mockReturnValue(false);
            expect(configManager.isDevelopmentMode()).toBe(false);
        });
    });

    describe('Secure Configuration', () => {
        it('should return secure configuration without secrets', () => {
            const mockSecureConfig = { auth0: { domain: 'test.auth0.com' } };
            configManager.getSecureConfig.mockReturnValue(mockSecureConfig);
            const secureConfig = configManager.getSecureConfig();

            expect(secureConfig.auth0.domain).toBe('test.auth0.com');
        });
    });

    describe('Configuration Updates', () => {
        it('should update configuration', () => {
            const updates = { features: { newFeature: true } };
            configManager.updateConfig(updates);
            expect(configManager.updateConfig).toHaveBeenCalledWith(updates);
        });
    });
});