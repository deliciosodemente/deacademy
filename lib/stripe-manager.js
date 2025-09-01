/**
 * Stripe Manager for Digital English Academy
 * Handles payment processing, subscriptions, and customer management
 */

export class StripeManager {
    constructor() {
        this.stripe = null;
        this.elements = null;
        this.config = null;
        this.isInitialized = false;
        this.paymentIntents = new Map();
        this.subscriptions = new Map();
        this.customers = new Map();
    }

    /**
     * Initialize Stripe with configuration
     */
    async initialize(config) {
        try {
            console.log('💳 Initializing Stripe...');

            if (!window.Stripe) {
                throw new Error('Stripe.js not loaded. Make sure to include the Stripe SDK.');
            }

            this.config = {
                publishableKey: config.publishableKey,
                apiVersion: config.apiVersion || '2023-10-16',
                locale: config.locale || 'es',
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
                },
                ...config
            };

            // Initialize Stripe instance
            this.stripe = window.Stripe(this.config.publishableKey, {
                apiVersion: this.config.apiVersion,
                locale: this.config.locale
            });

            this.isInitialized = true;
            console.log('✅ Stripe initialized successfully');

            return this.stripe;

        } catch (error) {
            console.error('❌ Stripe initialization failed:', error);
            throw error;
        }
    }

    /**
     * Create payment intent for one-time payments
     */
    async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
        try {
            if (!this.isInitialized) {
                throw new Error('Stripe not initialized');
            }

            console.log('💰 Creating payment intent...', { amount, currency });

            // Get authenticated user
            const user = await this.getCurrentUser();
            if (!user) {
                throw new Error('User authentication required');
            }

            // Create payment intent via API
            const response = await this.makeAuthenticatedRequest('/api/stripe/create-payment', {
                method: 'POST',
                body: JSON.stringify({
                    amount: Math.round(amount * 100), // Convert to cents
                    currency,
                    customer_id: user.stripeCustomerId,
                    metadata: {
                        userId: user.auth0Id,
                        userEmail: user.email,
                        ...metadata
                    }
                })
            });

            const paymentIntent = await response.json();

            // Cache payment intent
            this.paymentIntents.set(paymentIntent.id, paymentIntent);

            console.log('✅ Payment intent created:', paymentIntent.id);
            return paymentIntent;

        } catch (error) {
            console.error('❌ Payment intent creation failed:', error);
            throw error;
        }
    }

    /**
     * Create subscription
     */
    async createSubscription(priceId, options = {}) {
        try {
            if (!this.isInitialized) {
                throw new Error('Stripe not initialized');
            }

            console.log('📋 Creating subscription...', { priceId });

            // Get authenticated user
            const user = await this.getCurrentUser();
            if (!user) {
                throw new Error('User authentication required');
            }

            // Create subscription via API
            const response = await this.makeAuthenticatedRequest('/api/stripe/create-subscription', {
                method: 'POST',
                body: JSON.stringify({
                    price_id: priceId,
                    customer_id: user.stripeCustomerId,
                    trial_period_days: options.trialDays,
                    metadata: {
                        userId: user.auth0Id,
                        userEmail: user.email,
                        ...options.metadata
                    }
                })
            });

            const subscription = await response.json();

            // Cache subscription
            this.subscriptions.set(subscription.id, subscription);

            // Update user subscription status in database
            await this.updateUserSubscription(user.auth0Id, subscription);

            console.log('✅ Subscription created:', subscription.id);
            return subscription;

        } catch (error) {
            console.error('❌ Subscription creation failed:', error);
            throw error;
        }
    }

    /**
     * Create Stripe Elements for payment forms
     */
    createElements(options = {}) {
        try {
            if (!this.isInitialized) {
                throw new Error('Stripe not initialized');
            }

            const elementsOptions = {
                appearance: this.config.appearance,
                locale: this.config.locale,
                ...options
            };

            this.elements = this.stripe.elements(elementsOptions);
            return this.elements;

        } catch (error) {
            console.error('❌ Elements creation failed:', error);
            throw error;
        }
    }

    /**
     * Create payment element
     */
    createPaymentElement(clientSecret, options = {}) {
        try {
            if (!this.elements) {
                this.createElements();
            }

            const paymentElement = this.elements.create('payment', {
                ...options
            });

            return paymentElement;

        } catch (error) {
            console.error('❌ Payment element creation failed:', error);
            throw error;
        }
    }

    /**
     * Confirm payment
     */
    async confirmPayment(clientSecret, paymentElement, options = {}) {
        try {
            console.log('🔄 Confirming payment...');

            const user = await this.getCurrentUser();

            const result = await this.stripe.confirmPayment({
                elements: this.elements,
                clientSecret,
                confirmParams: {
                    return_url: options.returnUrl || `${window.location.origin}/payment-success`,
                    payment_method_data: {
                        billing_details: {
                            name: user?.name || options.billingDetails?.name,
                            email: user?.email || options.billingDetails?.email
                        }
                    }
                },
                redirect: options.redirect || 'if_required'
            });

            if (result.error) {
                console.error('❌ Payment confirmation failed:', result.error);
                throw result.error;
            }

            console.log('✅ Payment confirmed successfully');
            return result;

        } catch (error) {
            console.error('❌ Payment confirmation error:', error);
            throw error;
        }
    }

    /**
     * Get customer information
     */
    async getCustomer(customerId) {
        try {
            // Check cache first
            if (this.customers.has(customerId)) {
                return this.customers.get(customerId);
            }

            // Fetch from API
            const response = await this.makeAuthenticatedRequest(`/api/customers/${customerId}`);
            const customer = await response.json();

            // Cache customer data
            this.customers.set(customerId, customer);

            return customer;

        } catch (error) {
            console.error('❌ Failed to get customer:', error);
            throw error;
        }
    }

    /**
     * Create or update customer
     */
    async createOrUpdateCustomer(customerData) {
        try {
            console.log('👤 Creating/updating customer...');

            const response = await this.makeAuthenticatedRequest('/api/customers/create-or-update', {
                method: 'POST',
                body: JSON.stringify(customerData)
            });

            const customer = await response.json();

            // Cache customer data
            this.customers.set(customer.id, customer);

            console.log('✅ Customer created/updated:', customer.id);
            return customer;

        } catch (error) {
            console.error('❌ Customer creation/update failed:', error);
            throw error;
        }
    }

    /**
     * Get subscription details
     */
    async getSubscription(subscriptionId) {
        try {
            // Check cache first
            if (this.subscriptions.has(subscriptionId)) {
                return this.subscriptions.get(subscriptionId);
            }

            // Fetch from API
            const response = await this.makeAuthenticatedRequest(`/api/subscriptions/${subscriptionId}`);
            const subscription = await response.json();

            // Cache subscription data
            this.subscriptions.set(subscriptionId, subscription);

            return subscription;

        } catch (error) {
            console.error('❌ Failed to get subscription:', error);
            throw error;
        }
    }

    /**
     * Update subscription
     */
    async updateSubscription(subscriptionId, updates) {
        try {
            console.log('🔄 Updating subscription...', subscriptionId);

            const response = await this.makeAuthenticatedRequest(`/api/subscriptions/${subscriptionId}`, {
                method: 'PATCH',
                body: JSON.stringify(updates)
            });

            const subscription = await response.json();

            // Update cache
            this.subscriptions.set(subscriptionId, subscription);

            // Update user subscription status
            const user = await this.getCurrentUser();
            if (user) {
                await this.updateUserSubscription(user.auth0Id, subscription);
            }

            console.log('✅ Subscription updated:', subscriptionId);
            return subscription;

        } catch (error) {
            console.error('❌ Subscription update failed:', error);
            throw error;
        }
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription(subscriptionId, options = {}) {
        try {
            console.log('❌ Canceling subscription...', subscriptionId);

            const response = await this.makeAuthenticatedRequest(`/api/subscriptions/${subscriptionId}/cancel`, {
                method: 'POST',
                body: JSON.stringify({
                    at_period_end: options.atPeriodEnd !== false,
                    cancellation_reason: options.reason
                })
            });

            const subscription = await response.json();

            // Update cache
            this.subscriptions.set(subscriptionId, subscription);

            // Update user subscription status
            const user = await this.getCurrentUser();
            if (user) {
                await this.updateUserSubscription(user.auth0Id, subscription);
            }

            console.log('✅ Subscription canceled:', subscriptionId);
            return subscription;

        } catch (error) {
            console.error('❌ Subscription cancellation failed:', error);
            throw error;
        }
    }

    /**
     * Create customer portal session
     */
    async createPortalSession(returnUrl) {
        try {
            console.log('🏪 Creating customer portal session...');

            const user = await this.getCurrentUser();
            if (!user) {
                throw new Error('User authentication required');
            }

            const response = await this.makeAuthenticatedRequest('/api/billing/create-portal-session', {
                method: 'POST',
                body: JSON.stringify({
                    customer_id: user.stripeCustomerId,
                    return_url: returnUrl || window.location.origin
                })
            });

            const session = await response.json();

            console.log('✅ Portal session created');
            return session;

        } catch (error) {
            console.error('❌ Portal session creation failed:', error);
            throw error;
        }
    }

    /**
     * Get available pricing plans
     */
    async getPricingPlans() {
        try {
            const response = await fetch('/api/pricing/plans');
            const plans = await response.json();

            return plans;

        } catch (error) {
            console.error('❌ Failed to get pricing plans:', error);
            throw error;
        }
    }

    /**
     * Get user's payment methods
     */
    async getPaymentMethods() {
        try {
            const user = await this.getCurrentUser();
            if (!user) {
                throw new Error('User authentication required');
            }

            const response = await this.makeAuthenticatedRequest(`/api/customers/${user.stripeCustomerId}/payment-methods`);
            const paymentMethods = await response.json();

            return paymentMethods;

        } catch (error) {
            console.error('❌ Failed to get payment methods:', error);
            throw error;
        }
    }

    /**
     * Get billing history
     */
    async getBillingHistory(limit = 10) {
        try {
            const user = await this.getCurrentUser();
            if (!user) {
                throw new Error('User authentication required');
            }

            const response = await this.makeAuthenticatedRequest(`/api/billing/history?limit=${limit}`);
            const invoices = await response.json();

            return invoices;

        } catch (error) {
            console.error('❌ Failed to get billing history:', error);
            throw error;
        }
    }

    /**
     * Handle webhook events
     */
    async handleWebhookEvent(event) {
        try {
            console.log('🔔 Processing Stripe webhook:', event.type);

            switch (event.type) {
                case 'payment_intent.succeeded':
                    await this.handlePaymentSuccess(event.data.object);
                    break;

                case 'payment_intent.payment_failed':
                    await this.handlePaymentFailure(event.data.object);
                    break;

                case 'customer.subscription.created':
                case 'customer.subscription.updated':
                    await this.handleSubscriptionChange(event.data.object);
                    break;

                case 'customer.subscription.deleted':
                    await this.handleSubscriptionCancellation(event.data.object);
                    break;

                case 'invoice.payment_succeeded':
                    await this.handleInvoicePaymentSuccess(event.data.object);
                    break;

                case 'invoice.payment_failed':
                    await this.handleInvoicePaymentFailure(event.data.object);
                    break;

                default:
                    console.log('ℹ️ Unhandled webhook event:', event.type);
            }

            console.log('✅ Webhook event processed:', event.type);

        } catch (error) {
            console.error('❌ Webhook processing failed:', error);
            throw error;
        }
    }

    /**
     * Handle successful payment
     */
    async handlePaymentSuccess(paymentIntent) {
        try {
            const userId = paymentIntent.metadata?.userId;
            if (!userId) return;

            // Update user payment status in database
            const { postgresManager } = await import('./postgresql-manager.js');
            if (postgresManager && postgresManager.isConnected) {
                await postgresManager.insertDocument('payment_history', {
                    userId,
                    paymentIntentId: paymentIntent.id,
                    amount: paymentIntent.amount,
                    currency: paymentIntent.currency,
                    status: 'succeeded',
                    createdAt: new Date(paymentIntent.created * 1000),
                    metadata: paymentIntent.metadata
                });

                // Log activity
                await this.logPaymentActivity(userId, 'payment_succeeded', {
                    paymentIntentId: paymentIntent.id,
                    amount: paymentIntent.amount,
                    currency: paymentIntent.currency
                });
            }

            console.log('✅ Payment success handled:', paymentIntent.id);

        } catch (error) {
            console.error('❌ Payment success handling failed:', error);
        }
    }

    /**
     * Handle failed payment
     */
    async handlePaymentFailure(paymentIntent) {
        try {
            const userId = paymentIntent.metadata?.userId;
            if (!userId) return;

            // Log payment failure
            const { postgresManager } = await import('./postgresql-manager.js');
            if (postgresManager && postgresManager.isConnected) {
                await postgresManager.insertDocument('payment_history', {
                    userId,
                    paymentIntentId: paymentIntent.id,
                    amount: paymentIntent.amount,
                    currency: paymentIntent.currency,
                    status: 'failed',
                    failureReason: paymentIntent.last_payment_error?.message,
                    createdAt: new Date(paymentIntent.created * 1000),
                    metadata: paymentIntent.metadata
                });

                // Log activity
                await this.logPaymentActivity(userId, 'payment_failed', {
                    paymentIntentId: paymentIntent.id,
                    failureReason: paymentIntent.last_payment_error?.message
                });
            }

            console.log('❌ Payment failure handled:', paymentIntent.id);

        } catch (error) {
            console.error('❌ Payment failure handling failed:', error);
        }
    }

    /**
     * Handle subscription changes
     */
    async handleSubscriptionChange(subscription) {
        try {
            const customerId = subscription.customer;
            const userId = subscription.metadata?.userId;

            if (!userId) return;

            // Update user subscription in database
            await this.updateUserSubscription(userId, subscription);

            // Update cache
            this.subscriptions.set(subscription.id, subscription);

            console.log('✅ Subscription change handled:', subscription.id);

        } catch (error) {
            console.error('❌ Subscription change handling failed:', error);
        }
    }

    /**
     * Handle subscription cancellation
     */
    async handleSubscriptionCancellation(subscription) {
        try {
            const userId = subscription.metadata?.userId;
            if (!userId) return;

            // Update user subscription status
            const { postgresManager } = await import('./postgresql-manager.js');
            if (postgresManager && postgresManager.isConnected) {
                await postgresManager.updateDocument('users',
                    { auth0Id: userId },
                    {
                        'subscription.status': 'canceled',
                        'subscription.canceledAt': new Date(),
                        'subscription.endDate': new Date(subscription.canceled_at * 1000)
                    }
                );

                // Log activity
                await this.logPaymentActivity(userId, 'subscription_canceled', {
                    subscriptionId: subscription.id,
                    canceledAt: new Date(subscription.canceled_at * 1000)
                });
            }

            console.log('✅ Subscription cancellation handled:', subscription.id);

        } catch (error) {
            console.error('❌ Subscription cancellation handling failed:', error);
        }
    }

    /**
     * Handle invoice payment success
     */
    async handleInvoicePaymentSuccess(invoice) {
        try {
            const subscriptionId = invoice.subscription;
            const userId = invoice.metadata?.userId;

            if (!userId) return;

            // Log successful payment
            const { postgresManager } = await import('./postgresql-manager.js');
            if (postgresManager && postgresManager.isConnected) {
                await postgresManager.insertDocument('payment_history', {
                    userId,
                    invoiceId: invoice.id,
                    subscriptionId,
                    amount: invoice.amount_paid,
                    currency: invoice.currency,
                    status: 'succeeded',
                    paidAt: new Date(invoice.status_transitions.paid_at * 1000),
                    metadata: invoice.metadata
                });

                // Update subscription status
                await postgresManager.updateDocument('users',
                    { auth0Id: userId },
                    {
                        'subscription.status': 'active',
                        'subscription.lastPayment': new Date(invoice.status_transitions.paid_at * 1000)
                    }
                );
            }

            console.log('✅ Invoice payment success handled:', invoice.id);

        } catch (error) {
            console.error('❌ Invoice payment success handling failed:', error);
        }
    }

    /**
     * Handle invoice payment failure
     */
    async handleInvoicePaymentFailure(invoice) {
        try {
            const userId = invoice.metadata?.userId;
            if (!userId) return;

            // Log payment failure and update subscription status
            const { postgresManager } = await import('./postgresql-manager.js');
            if (postgresManager && postgresManager.isConnected) {
                await postgresManager.insertDocument('payment_history', {
                    userId,
                    invoiceId: invoice.id,
                    subscriptionId: invoice.subscription,
                    amount: invoice.amount_due,
                    currency: invoice.currency,
                    status: 'failed',
                    failureReason: 'Invoice payment failed',
                    createdAt: new Date(),
                    metadata: invoice.metadata
                });

                // Update subscription status to past_due
                await postgresManager.updateDocument('users',
                    { auth0Id: userId },
                    {
                        'subscription.status': 'past_due',
                        'subscription.lastFailedPayment': new Date()
                    }
                );

                // Log activity
                await this.logPaymentActivity(userId, 'invoice_payment_failed', {
                    invoiceId: invoice.id,
                    subscriptionId: invoice.subscription
                });
            }

            console.log('❌ Invoice payment failure handled:', invoice.id);

        } catch (error) {
            console.error('❌ Invoice payment failure handling failed:', error);
        }
    }

    /**
     * Update user subscription in database
     */
    async updateUserSubscription(userId, subscription) {
        try {
            const { postgresManager } = await import('./postgresql-manager.js');
            if (!postgresManager || !postgresManager.isConnected) return;

            const subscriptionData = {
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer,
                status: subscription.status,
                plan: this.getPlanFromSubscription(subscription),
                startDate: new Date(subscription.created * 1000),
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
                trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
            };

            await postgresManager.updateDocument('users',
                { auth0Id: userId },
                { subscription: subscriptionData }
            );

            console.log('✅ User subscription updated in database');

        } catch (error) {
            console.error('❌ User subscription update failed:', error);
        }
    }

    /**
     * Get plan name from subscription
     */
    getPlanFromSubscription(subscription) {
        const priceId = subscription.items?.data?.[0]?.price?.id;

        // Map price IDs to plan names
        const planMapping = {
            'price_premium_monthly': 'premium',
            'price_premium_yearly': 'premium',
            'price_enterprise_monthly': 'enterprise',
            'price_enterprise_yearly': 'enterprise'
        };

        return planMapping[priceId] || 'premium';
    }

    /**
     * Log payment activity
     */
    async logPaymentActivity(userId, action, metadata = {}) {
        try {
            const { postgresManager } = await import('./postgresql-manager.js');
            if (postgresManager && postgresManager.isConnected) {
                await postgresManager.insertDocument('user_activities', {
                    userId,
                    action,
                    category: 'payment',
                    metadata,
                    timestamp: new Date(),
                    source: 'stripe'
                });
            }
        } catch (error) {
            console.error('❌ Payment activity logging failed:', error);
        }
    }

    /**
     * Make authenticated request to API
     */
    async makeAuthenticatedRequest(url, options = {}) {
        try {
            // Get auth headers from Auth0 manager
            let headers = { 'Content-Type': 'application/json' };

            if (window.deaAuth?.manager) {
                const authHeaders = await window.deaAuth.manager.getAuthHeaders();
                headers = { ...headers, ...authHeaders };
            }

            const response = await fetch(url, {
                ...options,
                headers: {
                    ...headers,
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response;

        } catch (error) {
            console.error('❌ Authenticated request failed:', error);
            throw error;
        }
    }

    /**
     * Get current user from Auth0 manager
     */
    async getCurrentUser() {
        try {
            if (window.deaAuth?.manager) {
                return await window.deaAuth.manager.getUserProfile();
            }

            return window.deaAuth?.user || null;

        } catch (error) {
            console.error('❌ Failed to get current user:', error);
            return null;
        }
    }

    /**
     * Format currency amount
     */
    formatCurrency(amount, currency = 'usd') {
        const formatter = new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: currency.toUpperCase(),
            minimumFractionDigits: 2
        });

        return formatter.format(amount / 100); // Convert from cents
    }

    /**
     * Validate payment data
     */
    validatePaymentData(data) {
        const required = ['amount', 'currency'];
        const missing = required.filter(field => !data[field]);

        if (missing.length > 0) {
            throw new Error(`Missing required payment data: ${missing.join(', ')}`);
        }

        if (data.amount <= 0) {
            throw new Error('Payment amount must be greater than 0');
        }

        if (typeof data.amount !== 'number') {
            throw new Error('Payment amount must be a number');
        }

        return true;
    }

    /**
     * Get Stripe configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Check if Stripe is initialized
     */
    isReady() {
        return this.isInitialized && this.stripe !== null;
    }
}

// Export singleton instance
export const stripeManager = new StripeManager();