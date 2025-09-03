// Vercel Edge Config Middleware
// This middleware demonstrates how to use Edge Config in a Vite application

import { get } from '@vercel/edge-config';

/**
 * Edge Config middleware for handling dynamic configuration
 * This can be used to manage feature flags, A/B testing, or dynamic content
 */
export class EdgeConfigMiddleware {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get a value from Edge Config with caching
   * @param {string} key - The configuration key
   * @returns {Promise<any>} The configuration value
   */
  async getConfig(key) {
    const cacheKey = `edge_config_${key}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.value;
    }

    try {
      const value = await get(key);
      this.cache.set(cacheKey, {
        value,
        timestamp: Date.now()
      });
      return value;
    } catch (error) {
      console.warn('Edge Config error:', error);
      return null;
    }
  }

  /**
   * Get greeting message from Edge Config
   * @returns {Promise<string>} Greeting message
   */
  async getGreeting() {
    const greeting = await this.getConfig('greeting');
    return greeting || 'Welcome to Digital English Academy!';
  }

  /**
   * Get feature flags from Edge Config
   * @returns {Promise<object>} Feature flags object
   */
  async getFeatureFlags() {
    const flags = await this.getConfig('feature_flags');
    return flags || {
      enableAdvancedAnalytics: false,
      enableBetaFeatures: false,
      enableMaintenanceMode: false
    };
  }

  /**
   * Get A/B test configuration
   * @returns {Promise<object>} A/B test configuration
   */
  async getABTestConfig() {
    const config = await this.getConfig('ab_test_config');
    return config || {
      enabled: false,
      variants: ['control', 'variant_a'],
      traffic_split: 50
    };
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Create a singleton instance
export const edgeConfig = new EdgeConfigMiddleware();

// Export utility functions for easy use
export const getGreeting = () => edgeConfig.getGreeting();
export const getFeatureFlags = () => edgeConfig.getFeatureFlags();
export const getABTestConfig = () => edgeConfig.getABTestConfig();

// Initialize Edge Config when module loads
if (typeof window !== 'undefined') {
  window.edgeConfig = edgeConfig;
  
  // Add a global function to handle welcome endpoint
  window.handleWelcomeRequest = async () => {
    try {
      const greeting = await getGreeting();
      return {
        success: true,
        message: greeting,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  };
}