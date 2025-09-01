/**
 * Complete SaaS Setup - Digital English Academy
 * Auth0 + Stripe + AI Integration
 * Ready for revenue generation
 */

export class CompleteSaaSSetup {
    constructor() {
        this.config = {
            auth0: null,
            stripe: null,
            products: [],
            isInitialized: false
        };
    }

    /**
     * Initialize complete SaaS system
     */
    async initialize(config = {}) {
        try {
            console.log('💰 Setting up complete SaaS system...');

            // Setup Auth0 first
            await this.setupAuth0(config.auth0 || {});

            // Setup Stripe integration
            await this.setupStripe(config.stripe || {});

            // Create subscription products
            await this.createSubscriptionProducts();

            // Setup payment flows
            await this.setupPaymentFlows();

            // Setup user subscription management
            await this.setupSubscriptionManagement();

            // Setup webhooks handling
            await this.setupWebhooks();

            this.isInitialized = true;
            console.log('✅ Complete SaaS system initialized successfully');

            return this;

        } catch (error) {
            console.error('❌ SaaS setup failed:', error);
            throw error;
        }
    }

    /**
     * Setup Auth0 with subscription metadata
     */
    async setupAuth0(auth0Config) {
        console.log('🔐 Setting up Auth0 with subscription support...');

        // Import Auth0 GenAI setup
        const { auth0GenAI } = await import('./setup-auth0-genai.js');

        // Enhanced config for subscriptions
        const enhancedConfig = {
            ...auth0Config,
            scope: 'openid profile email read:user_metadata update:user_metadata offline_access',

            // Subscription-specific settings
            subscriptionSettings: {
                enableTrialPeriod: true,
                trialDays: 7,
                enableUsageTracking: true,
                enableBillingAlerts: true
            }
        };

        await auth0GenAI.initialize(enhancedConfig);

        // Setup subscription metadata in Auth0
        this.setupAuth0SubscriptionMetadata();

        this.config.auth0 = enhancedConfig;
        console.log('✅ Auth0 setup with subscription support completed');
    }

    /**
     * Setup Stripe integration
     */
    async setupStripe(stripeConfig) {
        console.log('💳 Setting up Stripe integration...');

        // Load Stripe SDK
        if (!window.Stripe) {
            await this.loadStripeSDK();
        }

        // Initialize Stripe
        const publishableKey = stripeConfig.publishableKey ||
            window.deaConfig?.stripePublishableKey ||
            process.env.STRIPE_PUBLISHABLE_KEY;

        if (!publishableKey) {
            throw new Error('Stripe publishable key not configured');
        }

        window.stripe = Stripe(publishableKey);

        // Setup Stripe configuration
        this.config.stripe = {
            publishableKey,
            currency: 'usd',
            country: 'US',
            ...stripeConfig
        };

        console.log('✅ Stripe integration completed');
    }

    /**
     * Create subscription products and pricing
     */
    async createSubscriptionProducts() {
        console.log('📦 Creating subscription products...');

        // Define subscription tiers
        this.config.products = [
            {
                id: 'free',
                name: 'Free Plan',
                description: 'Perfect for getting started',
                price: 0,
                currency: 'usd',
                interval: 'month',
                features: [
                    '5 AI conversations per day',
                    'Basic English lessons',
                    'Community access',
                    'Mobile app access'
                ],
                limits: {
                    aiConversations: 5,
                    lessonsPerDay: 3,
                    downloadableContent: false,
                    prioritySupport: false
                },
                stripePriceId: null, // Free plan doesn't need Stripe
                popular: false
            },
            {
                id: 'basic',
                name: 'Basic Plan',
                description: 'Great for regular learners',
                price: 9.99,
                currency: 'usd',
                interval: 'month',
                features: [
                    'Unlimited AI conversations',
                    'All English lessons',
                    'Downloadable content',
                    'Progress tracking',
                    'Email support'
                ],
                limits: {
                    aiConversations: -1, // Unlimited
                    lessonsPerDay: -1,
                    downloadableContent: true,
                    prioritySupport: false
                },
                stripePriceId: 'price_basic_monthly', // Will be created
                popular: true
            },
            {
                id: 'premium',
                name: 'Premium Plan',
                description: 'For serious English learners',
                price: 19.99,
                currency: 'usd',
                interval: 'month',
                features: [
                    'Everything in Basic',
                    'Personal AI tutor',
                    'Custom lesson plans',
                    'Live conversation practice',
                    'Priority support',
                    'Certificates'
                ],
                limits: {
                    aiConversations: -1,
                    lessonsPerDay: -1,
                    downloadableContent: true,
                    prioritySupport: true,
                    personalTutor: true,
                    certificates: true
                },
                stripePriceId: 'price_premium_monthly',
                popular: false
            },
            {
                id: 'pro',
                name: 'Pro Plan',
                description: 'For professionals and businesses',
                price: 39.99,
                currency: 'usd',
                interval: 'month',
                features: [
                    'Everything in Premium',
                    'Business English focus',
                    'Team management (up to 10 users)',
                    'Advanced analytics',
                    'API access',
                    'White-label options'
                ],
                limits: {
                    aiConversations: -1,
                    lessonsPerDay: -1,
                    downloadableContent: true,
                    prioritySupport: true,
                    personalTutor: true,
                    certificates: true,
                    teamManagement: true,
                    apiAccess: true
                },
                stripePriceId: 'price_pro_monthly',
                popular: false
            }
        ];

        // Create annual plans (20% discount)
        const annualPlans = this.config.products
            .filter(p => p.price > 0)
            .map(p => ({
                ...p,
                id: p.id + '_annual',
                name: p.name + ' (Annual)',
                price: Math.round(p.price * 12 * 0.8 * 100) / 100, // 20% discount
                interval: 'year',
                stripePriceId: p.stripePriceId.replace('monthly', 'annual'),
                savings: Math.round(p.price * 12 * 0.2 * 100) / 100
            }));

        this.config.products.push(...annualPlans);

        console.log('✅ Subscription products created');
    }

    /**
     * Setup payment flows
     */
    async setupPaymentFlows() {
        console.log('💰 Setting up payment flows...');

        // Create subscription function
        window.createSubscription = async (priceId, customerId = null) => {
            try {
                const response = await fetch('/api/stripe/create-subscription', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(await this.getAuthHeaders())
                    },
                    body: JSON.stringify({
                        priceId,
                        customerId,
                        trialDays: 7 // 7-day free trial
                    })
                });

                const { clientSecret, subscriptionId } = await response.json();

                // Redirect to Stripe Checkout or use Payment Element
                return await this.handlePaymentFlow(clientSecret, subscriptionId);

            } catch (error) {
                console.error('Subscription creation failed:', error);
                throw error;
            }
        };

        // Create one-time payment function
        window.createOneTimePayment = async (amount, description) => {
            try {
                const response = await fetch('/api/stripe/create-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(await this.getAuthHeaders())
                    },
                    body: JSON.stringify({
                        amount: amount * 100, // Convert to cents
                        currency: 'usd',
                        description
                    })
                });

                const { clientSecret } = await response.json();
                return await this.handlePaymentFlow(clientSecret);

            } catch (error) {
                console.error('Payment creation failed:', error);
                throw error;
            }
        };

        // Setup upgrade/downgrade functions
        window.changeSubscription = async (newPriceId) => {
            try {
                const response = await fetch('/api/stripe/change-subscription', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(await this.getAuthHeaders())
                    },
                    body: JSON.stringify({ newPriceId })
                });

                const result = await response.json();

                // Update user subscription in Auth0
                await this.updateUserSubscription(result.subscription);

                return result;

            } catch (error) {
                console.error('Subscription change failed:', error);
                throw error;
            }
        };

        // Setup cancellation function
        window.cancelSubscription = async (reason = '') => {
            try {
                const response = await fetch('/api/stripe/cancel-subscription', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(await this.getAuthHeaders())
                    },
                    body: JSON.stringify({ reason })
                });

                const result = await response.json();

                // Update user subscription status
                await this.updateUserSubscription(result.subscription);

                return result;

            } catch (error) {
                console.error('Subscription cancellation failed:', error);
                throw error;
            }
        };

        console.log('✅ Payment flows setup completed');
    }

    /**
     * Handle payment flow with Stripe Elements
     */
    async handlePaymentFlow(clientSecret, subscriptionId = null) {
        // Create payment modal
        const modal = this.createPaymentModal();
        document.body.appendChild(modal);

        // Setup Stripe Elements
        const elements = window.stripe.elements({
            clientSecret,
            appearance: {
                theme: 'stripe',
                variables: {
                    colorPrimary: '#0a66ff',
                    colorBackground: '#ffffff',
                    colorText: '#1a1a1a',
                    colorDanger: '#df1b41',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    spacingUnit: '4px',
                    borderRadius: '8px'
                }
            }
        });

        const paymentElement = elements.create('payment');
        paymentElement.mount('#payment-element');

        // Handle form submission
        return new Promise((resolve, reject) => {
            const form = modal.querySelector('#payment-form');

            form.addEventListener('submit', async (event) => {
                event.preventDefault();

                const { error, paymentIntent } = await window.stripe.confirmPayment({
                    elements,
                    confirmParams: {
                        return_url: `${window.location.origin}/payment-success`
                    },
                    redirect: 'if_required'
                });

                if (error) {
                    this.showPaymentError(error.message);
                    reject(error);
                } else {
                    // Payment successful
                    modal.remove();

                    // Update user subscription
                    if (subscriptionId) {
                        await this.updateUserSubscription({ id: subscriptionId, status: 'active' });
                    }

                    this.showPaymentSuccess();
                    resolve(paymentIntent);
                }
            });

            // Handle modal close
            modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.remove();
                reject(new Error('Payment cancelled by user'));
            });
        });
    }

    /**
     * Create payment modal
     */
    createPaymentModal() {
        const modal = document.createElement('div');
        modal.className = 'payment-modal';
        modal.innerHTML = `
            <div class="payment-modal-overlay">
                <div class="payment-modal-content">
                    <div class="payment-modal-header">
                        <h3>Complete Your Subscription</h3>
                        <button class="close-modal" aria-label="Close">&times;</button>
                    </div>
                    
                    <form id="payment-form">
                        <div id="payment-element">
                            <!-- Stripe Elements will create form elements here -->
                        </div>
                        
                        <div class="payment-actions">
                            <button type="submit" class="pay-button">
                                <span class="pay-button-text">Subscribe Now</span>
                                <div class="pay-button-spinner" style="display: none;"></div>
                            </button>
                        </div>
                        
                        <div class="payment-security">
                            <p>🔒 Secure payment powered by Stripe</p>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .payment-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
            }
            
            .payment-modal-overlay {
                background: rgba(0, 0, 0, 0.5);
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .payment-modal-content {
                background: white;
                border-radius: 12px;
                max-width: 500px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            }
            
            .payment-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 24px 24px 0;
                border-bottom: 1px solid #e5e7eb;
                margin-bottom: 24px;
            }
            
            .payment-modal-header h3 {
                margin: 0;
                font-size: 1.25rem;
                font-weight: 600;
                color: #1a1a1a;
            }
            
            .close-modal {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #6b7280;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 6px;
            }
            
            .close-modal:hover {
                background: #f3f4f6;
                color: #1a1a1a;
            }
            
            #payment-form {
                padding: 0 24px 24px;
            }
            
            #payment-element {
                margin-bottom: 24px;
            }
            
            .pay-button {
                width: 100%;
                background: #0a66ff;
                color: white;
                border: none;
                padding: 16px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                transition: background-color 0.2s;
            }
            
            .pay-button:hover {
                background: #0a5be6;
            }
            
            .pay-button:disabled {
                background: #9ca3af;
                cursor: not-allowed;
            }
            
            .pay-button-spinner {
                width: 20px;
                height: 20px;
                border: 2px solid transparent;
                border-top: 2px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .payment-security {
                text-align: center;
                margin-top: 16px;
            }
            
            .payment-security p {
                margin: 0;
                font-size: 14px;
                color: #6b7280;
            }
        `;

        document.head.appendChild(style);
        return modal;
    }

    /**
     * Setup subscription management
     */
    async setupSubscriptionManagement() {
        console.log('📊 Setting up subscription management...');

        // Get user subscription status
        window.getUserSubscription = async () => {
            try {
                if (!window.deaAuth?.manager?.isUserAuthenticated()) {
                    return { plan: 'free', status: 'active' };
                }

                const response = await fetch('/api/stripe/subscription-status', {
                    headers: await this.getAuthHeaders()
                });

                return await response.json();

            } catch (error) {
                console.error('Failed to get subscription status:', error);
                return { plan: 'free', status: 'active' };
            }
        };

        // Check feature access
        window.hasFeatureAccess = async (feature) => {
            const subscription = await window.getUserSubscription();
            const plan = this.config.products.find(p => p.id === subscription.plan);

            if (!plan) return false;

            return plan.limits[feature] === true || plan.limits[feature] === -1;
        };

        // Track usage
        window.trackUsage = async (feature, amount = 1) => {
            try {
                await fetch('/api/usage/track', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(await this.getAuthHeaders())
                    },
                    body: JSON.stringify({ feature, amount })
                });
            } catch (error) {
                console.warn('Usage tracking failed:', error);
            }
        };

        // Get usage stats
        window.getUsageStats = async () => {
            try {
                const response = await fetch('/api/usage/stats', {
                    headers: await this.getAuthHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Failed to get usage stats:', error);
                return {};
            }
        };

        console.log('✅ Subscription management setup completed');
    }

    /**
     * Setup webhooks handling
     */
    async setupWebhooks() {
        console.log('🔗 Setting up webhook handlers...');

        // Listen for subscription events
        window.addEventListener('stripe-subscription-updated', async (event) => {
            const { subscription } = event.detail;
            await this.updateUserSubscription(subscription);
        });

        window.addEventListener('stripe-subscription-cancelled', async (event) => {
            const { subscription } = event.detail;
            await this.updateUserSubscription(subscription);
        });

        window.addEventListener('stripe-payment-succeeded', async (event) => {
            const { paymentIntent } = event.detail;
            // Handle successful payment
            this.showPaymentSuccess();
        });

        window.addEventListener('stripe-payment-failed', async (event) => {
            const { paymentIntent } = event.detail;
            // Handle failed payment
            this.showPaymentError('Payment failed. Please try again.');
        });

        console.log('✅ Webhook handlers setup completed');
    }

    /**
     * Update user subscription in Auth0
     */
    async updateUserSubscription(subscription) {
        try {
            if (!window.deaAuth?.manager?.isUserAuthenticated()) {
                return;
            }

            // Update user metadata in Auth0
            const metadata = {
                subscription: {
                    id: subscription.id,
                    status: subscription.status,
                    plan: subscription.plan || 'free',
                    currentPeriodEnd: subscription.current_period_end,
                    cancelAtPeriodEnd: subscription.cancel_at_period_end
                }
            };

            await window.deaAuth.manager.updateUserPreferences(metadata);

            // Dispatch event for UI updates
            window.dispatchEvent(new CustomEvent('subscriptionUpdated', {
                detail: subscription
            }));

        } catch (error) {
            console.error('Failed to update user subscription:', error);
        }
    }

    /**
     * Load Stripe SDK
     */
    async loadStripeSDK() {
        return new Promise((resolve, reject) => {
            if (window.Stripe) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Get authentication headers
     */
    async getAuthHeaders() {
        try {
            if (window.deaAuth?.manager) {
                const token = await window.deaAuth.manager.getAccessToken();
                return {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
            }
        } catch (error) {
            console.warn('Failed to get auth headers:', error);
        }

        return { 'Content-Type': 'application/json' };
    }

    /**
     * Show payment success message
     */
    showPaymentSuccess() {
        const toast = document.createElement('div');
        toast.className = 'payment-toast success';
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">✅</div>
                <div class="toast-message">
                    <h4>Payment Successful!</h4>
                    <p>Welcome to your new subscription. Enjoy all the premium features!</p>
                </div>
            </div>
        `;

        this.showToast(toast);
    }

    /**
     * Show payment error message
     */
    showPaymentError(message) {
        const toast = document.createElement('div');
        toast.className = 'payment-toast error';
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">❌</div>
                <div class="toast-message">
                    <h4>Payment Failed</h4>
                    <p>${message}</p>
                </div>
            </div>
        `;

        this.showToast(toast);
    }

    /**
     * Show toast notification
     */
    showToast(toast) {
        // Add toast styles if not already added
        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                .payment-toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    z-index: 10001;
                    max-width: 400px;
                    animation: slideIn 0.3s ease-out;
                }
                
                .payment-toast.success {
                    border-left: 4px solid #10b981;
                }
                
                .payment-toast.error {
                    border-left: 4px solid #ef4444;
                }
                
                .toast-content {
                    display: flex;
                    align-items: flex-start;
                    padding: 16px;
                    gap: 12px;
                }
                
                .toast-icon {
                    font-size: 20px;
                    flex-shrink: 0;
                }
                
                .toast-message h4 {
                    margin: 0 0 4px 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: #1a1a1a;
                }
                
                .toast-message p {
                    margin: 0;
                    font-size: 14px;
                    color: #6b7280;
                    line-height: 1.4;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    /**
     * Get subscription products for display
     */
    getSubscriptionProducts() {
        return this.config.products;
    }

    /**
     * Get product by ID
     */
    getProduct(productId) {
        return this.config.products.find(p => p.id === productId);
    }
}

// Export singleton instance
export const completeSaaS = new CompleteSaaSSetup();

// Auto-initialize if config is available
if (typeof window !== 'undefined') {
    window.completeSaaS = completeSaaS;

    window.addEventListener('DOMContentLoaded', async () => {
        try {
            if (window.deaConfig?.stripePublishableKey) {
                await completeSaaS.initialize({
                    stripe: {
                        publishableKey: window.deaConfig.stripePublishableKey
                    }
                });
            }
        } catch (error) {
            console.warn('SaaS auto-initialization failed:', error);
        }
    });
}