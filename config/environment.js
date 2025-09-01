/**
 * Environment Configuration for Digital English Academy
 * This file contains environment-specific settings
 */

// Development configuration
export const developmentConfig = {
    auth0: {
        domain: import.meta.env.VITE_AUTH0_DOMAIN || 'dev-fluentleap.us.auth0.com',
        clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || 'your-dev-client-id',
        audience: import.meta.env.VITE_AUTH0_AUDIENCE || 'https://api.fluentleap.com'
    },
    stripe: {
        publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_dev_key',
        paymentLinkUrl: import.meta.env.VITE_STRIPE_PAYMENT_LINK || 'https://buy.stripe.com/test_your_dev_link'
    },
    features: {
        auth0: false,
        stripe: false,
        mongodb: false,
        analytics: false,
        serviceWorker: false,
        realtime: false
    },
    debug: true
};

// Staging configuration
export const stagingConfig = {
    auth0: {
        domain: 'your-staging-domain.auth0.com',
        clientId: 'your-staging-client-id',
        audience: 'https://api.digitalenglishacademy.staging'
    },
    stripe: {
        publishableKey: 'pk_test_your_staging_key',
        paymentLinkUrl: 'https://buy.stripe.com/test_your_staging_link'
    },
    features: {
        auth0: true,
        stripe: true,
        mongodb: true,
        analytics: true,
        serviceWorker: true,
        realtime: true
    },
    debug: false
};

// Production configuration
export const productionConfig = {
    auth0: {
        domain: 'your-prod-domain.auth0.com',
        clientId: 'your-prod-client-id',
        audience: 'https://api.digitalenglishacademy.com'
    },
    stripe: {
        publishableKey: 'pk_live_your_prod_key',
        paymentLinkUrl: 'https://buy.stripe.com/your_prod_link'
    },
    features: {
        auth0: true,
        stripe: true,
        mongodb: true,
        analytics: true,
        serviceWorker: true,
        realtime: true
    },
    debug: false
};

/**
 * Get configuration for current environment
 */
export function getEnvironmentConfig(environment) {
    switch (environment) {
        case 'development':
            return developmentConfig;
        case 'staging':
            return stagingConfig;
        case 'production':
            return productionConfig;
        default:
            console.warn(`Unknown environment: ${environment}, using development config`);
            return developmentConfig;
    }
}

/**
 * Configuration validation rules
 */
export const configValidationRules = {
    auth0: {
        required: ['domain', 'clientId'],
        optional: ['audience', 'scope']
    },
    stripe: {
        required: ['publishableKey'],
        optional: ['paymentLinkUrl', 'successUrl', 'cancelUrl']
    },
    mongodb: {
        required: ['connectionString', 'databaseName'],
        optional: ['options']
    }
};

/**
 * Feature flag defaults by environment
 */
export const featureFlagDefaults = {
    development: {
        auth0: true,
        stripe: true,
        mongodb: true,
        analytics: false,
        serviceWorker: false,
        realtime: true,
        debug: true
    },
    staging: {
        auth0: true,
        stripe: true,
        mongodb: true,
        analytics: true,
        serviceWorker: true,
        realtime: true,
        debug: false
    },
    production: {
        auth0: true,
        stripe: true,
        mongodb: true,
        analytics: true,
        serviceWorker: true,
        realtime: true,
        debug: false
    }
};