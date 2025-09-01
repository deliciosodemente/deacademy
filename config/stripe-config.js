/**
 * Stripe Configuration for Digital English Academy
 * Environment-specific settings for payment processing
 */

// Stripe configuration by environment
export const stripeConfig = {
    development: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        apiVersion: '2023-10-16',
        locale: 'es',
        currency: 'usd',
        appearance: {
            theme: 'stripe',
            variables: {
                colorPrimary: '#0066cc',
                colorBackground: '#ffffff',
                colorText: '#30313d',
                colorDanger: '#df1b41',
                fontFamily: 'Inter, system-ui, sans-serif',
                spacingUnit: '4px',
                borderRadius: '8px'
            }
        }
    },

    staging: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        apiVersion: '2023-10-16',
        locale: 'es',
        currency: 'usd',
        appearance: {
            theme: 'stripe',
            variables: {
                colorPrimary: '#0066cc',
                colorBackground: '#ffffff',
                colorText: '#30313d',
                colorDanger: '#df1b41',
                fontFamily: 'Inter, system-ui, sans-serif',
                spacingUnit: '4px',
                borderRadius: '8px'
            }
        }
    },

    production: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        apiVersion: '2023-10-16',
        locale: 'es',
        currency: 'usd',
        appearance: {
            theme: 'stripe',
            variables: {
                colorPrimary: '#0066cc',
                colorBackground: '#ffffff',
                colorText: '#30313d',
                colorDanger: '#df1b41',
                fontFamily: 'Inter, system-ui, sans-serif',
                spacingUnit: '4px',
                borderRadius: '8px'
            }
        }
    }
};

// Pricing plans configuration
export const pricingPlans = {
    free: {
        id: 'free',
        name: 'Gratis',
        description: 'Perfecto para comenzar tu aprendizaje',
        price: 0,
        currency: 'usd',
        interval: null,
        features: [
            'Acceso a lecciones básicas',
            'Participación en comunidad',
            'Progreso básico',
            'Soporte por email'
        ],
        limitations: [
            'Contenido limitado',
            'Sin descargas',
            'Sin certificados'
        ],
        popular: false,
        stripeProductId: null,
        stripePriceId: null
    },

    premium_monthly: {
        id: 'premium_monthly',
        name: 'Premium Mensual',
        description: 'Acceso completo con facturación mensual',
        price: 19.99,
        currency: 'usd',
        interval: 'month',
        features: [
            'Acceso a todas las lecciones',
            'Contenido descargable',
            'Certificados de finalización',
            'Soporte prioritario',
            'Seguimiento avanzado',
            'Lecciones personalizadas'
        ],
        popular: true,
        stripeProductId: 'prod_premium',
        stripePriceId: 'price_premium_monthly',
        trialDays: 7
    },

    premium_yearly: {
        id: 'premium_yearly',
        name: 'Premium Anual',
        description: 'Acceso completo con descuento anual',
        price: 199.99,
        currency: 'usd',
        interval: 'year',
        originalPrice: 239.88, // Monthly price * 12
        savings: 39.89,
        features: [
            'Acceso a todas las lecciones',
            'Contenido descargable',
            'Certificados de finalización',
            'Soporte prioritario',
            'Seguimiento avanzado',
            'Lecciones personalizadas',
            '2 meses gratis'
        ],
        popular: false,
        stripeProductId: 'prod_premium',
        stripePriceId: 'price_premium_yearly',
        trialDays: 14
    },

    enterprise: {
        id: 'enterprise',
        name: 'Empresarial',
        description: 'Solución completa para organizaciones',
        price: 99.99,
        currency: 'usd',
        interval: 'month',
        features: [
            'Todo lo de Premium',
            'Gestión de equipos',
            'Reportes avanzados',
            'Integración SSO',
            'Soporte dedicado',
            'Personalización de marca',
            'API access'
        ],
        popular: false,
        stripeProductId: 'prod_enterprise',
        stripePriceId: 'price_enterprise_monthly',
        contactSales: true
    }
};

// Payment method types
export const paymentMethods = {
    card: {
        enabled: true,
        types: ['visa', 'mastercard', 'amex', 'discover']
    },
    paypal: {
        enabled: true
    },
    apple_pay: {
        enabled: true
    },
    google_pay: {
        enabled: true
    },
    sepa_debit: {
        enabled: false // Enable for European customers
    },
    bancontact: {
        enabled: false // Enable for Belgian customers
    }
};

// Webhook events to handle
export const webhookEvents = [
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'customer.subscription.trial_will_end',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'invoice.upcoming',
    'customer.created',
    'customer.updated',
    'customer.deleted'
];

// Tax configuration
export const taxConfig = {
    enabled: true,
    automatic: true,
    rates: {
        'US': 0.08, // 8% sales tax
        'ES': 0.21, // 21% VAT
        'MX': 0.16, // 16% IVA
        'default': 0.0
    }
};

// Currency configuration
export const currencyConfig = {
    supported: ['usd', 'eur', 'mxn'],
    default: 'usd',
    formatting: {
        usd: {
            symbol: '$',
            locale: 'en-US'
        },
        eur: {
            symbol: '€',
            locale: 'es-ES'
        },
        mxn: {
            symbol: '$',
            locale: 'es-MX'
        }
    }
};

/**
 * Get Stripe configuration for environment
 */
export function getStripeConfig(environment = 'development') {
    const config = stripeConfig[environment];

    if (!config) {
        console.warn(`No Stripe configuration found for environment: ${environment}`);
        return stripeConfig.development;
    }

    return config;
}

/**
 * Get pricing plan by ID
 */
export function getPricingPlan(planId) {
    return pricingPlans[planId] || null;
}

/**
 * Get all available pricing plans
 */
export function getAllPricingPlans() {
    return Object.values(pricingPlans);
}

/**
 * Get plans for display (excluding free plan)
 */
export function getPaidPlans() {
    return Object.values(pricingPlans).filter(plan => plan.id !== 'free');
}

/**
 * Calculate savings for yearly plans
 */
export function calculateYearlySavings(monthlyPrice, yearlyPrice) {
    const monthlyTotal = monthlyPrice * 12;
    return monthlyTotal - yearlyPrice;
}

/**
 * Format price for display
 */
export function formatPrice(amount, currency = 'usd') {
    const config = currencyConfig.formatting[currency] || currencyConfig.formatting.usd;

    return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 2
    }).format(amount);
}

/**
 * Get tax rate for country
 */
export function getTaxRate(countryCode) {
    return taxConfig.rates[countryCode] || taxConfig.rates.default;
}

/**
 * Calculate total with tax
 */
export function calculateTotalWithTax(amount, countryCode) {
    const taxRate = getTaxRate(countryCode);
    const tax = amount * taxRate;
    return {
        subtotal: amount,
        tax: tax,
        total: amount + tax,
        taxRate: taxRate
    };
}

/**
 * Validate Stripe configuration
 */
export function validateStripeConfig(config) {
    const required = ['publishableKey'];
    const missing = required.filter(field => !config[field]);

    if (missing.length > 0) {
        throw new Error(`Missing required Stripe configuration: ${missing.join(', ')}`);
    }

    if (!config.publishableKey.startsWith('pk_')) {
        throw new Error('Invalid Stripe publishable key format');
    }

    return true;
}

/**
 * Get webhook endpoint URL
 */
export function getWebhookEndpoint(environment = 'development') {
    const baseUrls = {
        development: 'http://localhost:3000',
        staging: 'https://staging.denglishacademy.com',
        production: 'https://denglishacademy.com'
    };

    const baseUrl = baseUrls[environment] || baseUrls.development;
    return `${baseUrl}/api/webhooks/stripe`;
}

/**
 * Get customer portal URL
 */
export function getCustomerPortalUrl(environment = 'development') {
    const baseUrls = {
        development: 'http://localhost:3000',
        staging: 'https://staging.denglishacademy.com',
        production: 'https://denglishacademy.com'
    };

    const baseUrl = baseUrls[environment] || baseUrls.development;
    return `${baseUrl}/billing`;
}

// Export default configuration
export default {
    stripeConfig,
    pricingPlans,
    paymentMethods,
    webhookEvents,
    taxConfig,
    currencyConfig,
    getStripeConfig,
    getPricingPlan,
    getAllPricingPlans,
    getPaidPlans,
    formatPrice,
    validateStripeConfig
};
