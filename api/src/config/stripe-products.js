/**
 * Subscription Products Configuration
 * This file contains the configuration for the subscription products.
 */

const SUBSCRIPTION_PRODUCTS = {
    basic: {
        name: 'Basic Plan',
        description: 'Great for regular learners',
        prices: {
            monthly: 'price_1234567890_basic_monthly', // Replace with actual Stripe price IDs
            annual: 'price_1234567890_basic_annual'
        }
    },
    premium: {
        name: 'Premium Plan',
        description: 'For serious English learners',
        prices: {
            monthly: 'price_1234567890_premium_monthly',
            annual: 'price_1234567890_premium_annual'
        }
    },
    pro: {
        name: 'Pro Plan',
        description: 'For professionals and businesses',
        prices: {
            monthly: 'price_1234567890_pro_monthly',
            annual: 'price_1234567890_pro_annual'
        }
    }
};

export default SUBSCRIPTION_PRODUCTS;