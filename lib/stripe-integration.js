/**
 * Stripe Integration for Digital English Academy
 * Secure payment processing with subscription management
 */

export class StripeIntegration {
    constructor() {
        this.stripe = null;
        this.isInitialized = false;
        this.config = null;
    }

    /**
     * Initialize Stripe with configuration
     */
    async initialize(config = {}) {
        try {
            console.log('💳 Initializing Stripe integration...');

            this.config = {
                publishableKey: config.publishableKey || window.deaConfig?.stripePublishableKey,
                paymentLinks: config.paymentLinks || window.deaConfig?.stripePaymentLinks || {},
                currency: config.currency || 'usd',
                locale: config.locale || 'es',
                ...config
            };

            if (!this.config.publishableKey) {
                console.warn('⚠️ Stripe publishable key not configured');
                return;
            }

            // Load Stripe.js if not already loaded
            if (!window.Stripe) {
                await this.loadStripeJS();
            }

            // Initialize Stripe instance
            this.stripe = window.Stripe(this.config.publishableKey, {
                locale: this.config.locale
            });

            this.isInitialized = true;
            console.log('✅ Stripe integration initialized successfully');

            // Setup payment UI
            this.setupPaymentUI();

            return this;

        } catch (error) {
            console.error('❌ Stripe initialization failed:', error);
            throw error;
        }
    }

    /**
     * Load Stripe.js dynamically
     */
    async loadStripeJS() {
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
     * Setup payment UI components
     */
    setupPaymentUI() {
        // Add payment buttons to pricing cards
        this.addPaymentButtons();

        // Setup subscription management
        this.setupSubscriptionManagement();

        // Listen for auth state changes
        window.addEventListener('authStateChanged', (event) => {
            this.updatePaymentUI(event.detail);
        });
    }

    /**
     * Add payment buttons to pricing cards
     */
    addPaymentButtons() {
        const pricingCards = document.querySelectorAll('.pricing-card, .plan-card');

        pricingCards.forEach(card => {
            const planType = card.dataset.plan || 'premium';
            const existingButton = card.querySelector('.payment-button');

            if (existingButton) return; // Already has payment button

            const button = document.createElement('button');
            button.className = 'payment-button btn-primary';
            button.innerHTML = `
                <i class="ph ph-credit-card"></i>
                <span>Suscribirse Ahora</span>
            `;

            button.onclick = () => this.handlePayment(planType);

            // Insert button
            const ctaContainer = card.querySelector('.card-footer, .pricing-footer') || card;
            ctaContainer.appendChild(button);
        });
    }

    /**
     * Handle payment process
     */
    async handlePayment(planType = 'premium') {
        try {
            if (!this.isInitialized) {
                throw new Error('Stripe not initialized');
            }

            // Check if user is authenticated
            const isAuthenticated = window.deaAuth?.manager?.isUserAuthenticated();

            if (!isAuthenticated) {
                // Prompt user to login first
                const shouldLogin = confirm('Necesitas iniciar sesión para suscribirte. ¿Quieres iniciar sesión ahora?');
                if (shouldLogin) {
                    await window.deaAuth?.manager?.loginWithRedirect();
                }
                return;
            }

            // Show loading state
            this.showPaymentLoading(true);

            // Get payment link for plan
            const paymentLink = this.getPaymentLink(planType);

            if (paymentLink) {
                // Redirect to Stripe Payment Link
                window.location.href = paymentLink;
            } else {
                // Fallback: Create checkout session
                await this.createCheckoutSession(planType);
            }

        } catch (error) {
            console.error('❌ Payment failed:', error);
            this.showPaymentError(error.message);
        } finally {
            this.showPaymentLoading(false);
        }
    }

    /**
     * Get payment link for plan type
     */
    getPaymentLink(planType) {
        const links = {
            basic: this.config.paymentLinks?.basic,
            premium: this.config.paymentLinks?.premium,
            pro: this.config.paymentLinks?.pro
        };

        return links[planType];
    }

    /**
     * Create checkout session (fallback method)
     */
    async createCheckoutSession(planType) {
        try {
            const user = await window.deaAuth.manager.getUser();

            const response = await fetch('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await window.deaAuth.manager.getAccessToken()}`
                },
                body: JSON.stringify({
                    planType,
                    customerEmail: user.email,
                    userId: user.sub,
                    successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
                    cancelUrl: `${window.location.origin}/pricing`
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }

            const { sessionId } = await response.json();

            // Redirect to Stripe Checkout
            const { error } = await this.stripe.redirectToCheckout({
                sessionId
            });

            if (error) {
                throw error;
            }

        } catch (error) {
            console.error('Checkout session creation failed:', error);
            throw error;
        }
    }

    /**
     * Setup subscription management
     */
    setupSubscriptionManagement() {
        // Add subscription status to user profile
        window.addEventListener('authStateChanged', async (event) => {
            if (event.detail.isAuthenticated) {
                await this.updateSubscriptionStatus();
            }
        });

        // Create subscription management UI
        this.createSubscriptionUI();
    }

    /**
     * Update subscription status
     */
    async updateSubscriptionStatus() {
        try {
            if (!window.deaAuth?.manager?.isUserAuthenticated()) return;

            const subscription = await window.deaAuth.manager.getSubscriptionStatus();

            // Update UI based on subscription
            this.updateSubscriptionUI(subscription);

        } catch (error) {
            console.error('Failed to update subscription status:', error);
        }
    }

    /**
     * Update subscription UI
     */
    updateSubscriptionUI(subscription) {
        const subscriptionElements = document.querySelectorAll('[data-subscription-status]');

        subscriptionElements.forEach(element => {
            const requiredPlan = element.dataset.subscriptionStatus;
            const hasAccess = this.hasSubscriptionAccess(subscription.plan, requiredPlan);

            element.classList.toggle('subscription-locked', !hasAccess);

            if (!hasAccess) {
                element.innerHTML += `
                    <div class="subscription-overlay">
                        <i class="ph ph-lock"></i>
                        <span>Requiere suscripción ${requiredPlan}</span>
                        <button onclick="stripeIntegration.handlePayment('${requiredPlan}')" class="btn-upgrade">
                            Actualizar Plan
                        </button>
                    </div>
                `;
            }
        });
    }

    /**
     * Check subscription access
     */
    hasSubscriptionAccess(userPlan, requiredPlan) {
        const planHierarchy = {
            free: 0,
            basic: 1,
            premium: 2,
            pro: 3
        };

        return planHierarchy[userPlan] >= planHierarchy[requiredPlan];
    }

    /**
     * Create subscription management UI
     */
    createSubscriptionUI() {
        // Add to user menu if it exists
        const userMenu = document.querySelector('.user-menu-content');
        if (userMenu) {
            const subscriptionItem = document.createElement('a');
            subscriptionItem.href = '#/subscription';
            subscriptionItem.className = 'user-menu-item';
            subscriptionItem.innerHTML = `
                <i class="ph ph-credit-card" aria-hidden="true"></i>
                <span>Mi Suscripción</span>
            `;

            userMenu.insertBefore(subscriptionItem, userMenu.querySelector('hr'));
        }
    }

    /**
     * Handle successful payment
     */
    async handlePaymentSuccess(sessionId) {
        try {
            console.log('✅ Payment successful:', sessionId);

            // Verify payment on backend
            const response = await fetch('/api/stripe/verify-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await window.deaAuth.manager.getAccessToken()}`
                },
                body: JSON.stringify({ sessionId })
            });

            if (response.ok) {
                const result = await response.json();

                // Update user subscription status
                await this.updateSubscriptionStatus();

                // Show success message
                this.showPaymentSuccess(result.subscription);

                // Redirect to dashboard or courses
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 3000);
            }

        } catch (error) {
            console.error('Payment verification failed:', error);
        }
    }

    /**
     * Show payment loading state
     */
    showPaymentLoading(isLoading) {
        const buttons = document.querySelectorAll('.payment-button');

        buttons.forEach(button => {
            if (isLoading) {
                button.disabled = true;
                button.innerHTML = `
                    <i class="ph ph-spinner ph-spin"></i>
                    <span>Procesando...</span>
                `;
            } else {
                button.disabled = false;
                button.innerHTML = `
                    <i class="ph ph-credit-card"></i>
                    <span>Suscribirse Ahora</span>
                `;
            }
        });
    }

    /**
     * Show payment success message
     */
    showPaymentSuccess(subscription) {
        const message = `
            <div class="payment-success-modal">
                <div class="modal-content">
                    <i class="ph ph-check-circle success-icon"></i>
                    <h3>¡Suscripción Activada!</h3>
                    <p>Tu plan ${subscription.plan} está ahora activo.</p>
                    <p>Disfruta de todas las funciones premium.</p>
                    <button onclick="this.parentElement.parentElement.remove()" class="btn-primary">
                        Continuar
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', message);
    }

    /**
     * Show payment error message
     */
    showPaymentError(errorMessage) {
        const message = `
            <div class="payment-error-modal">
                <div class="modal-content">
                    <i class="ph ph-x-circle error-icon"></i>
                    <h3>Error en el Pago</h3>
                    <p>${errorMessage}</p>
                    <p>Por favor, intenta nuevamente o contacta soporte.</p>
                    <button onclick="this.parentElement.parentElement.remove()" class="btn-secondary">
                        Cerrar
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', message);
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription() {
        try {
            const confirmed = confirm('¿Estás seguro de que quieres cancelar tu suscripción?');
            if (!confirmed) return;

            const response = await fetch('/api/stripe/cancel-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await window.deaAuth.manager.getAccessToken()}`
                }
            });

            if (response.ok) {
                alert('Suscripción cancelada exitosamente');
                await this.updateSubscriptionStatus();
            } else {
                throw new Error('Failed to cancel subscription');
            }

        } catch (error) {
            console.error('Subscription cancellation failed:', error);
            alert('Error al cancelar la suscripción. Contacta soporte.');
        }
    }

    /**
     * Update payment method
     */
    async updatePaymentMethod() {
        try {
            const response = await fetch('/api/stripe/create-portal-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await window.deaAuth.manager.getAccessToken()}`
                }
            });

            if (response.ok) {
                const { url } = await response.json();
                window.location.href = url;
            } else {
                throw new Error('Failed to create portal session');
            }

        } catch (error) {
            console.error('Payment method update failed:', error);
            alert('Error al acceder al portal de pagos. Contacta soporte.');
        }
    }
}

// Export singleton instance
export const stripeIntegration = new StripeIntegration();

// Global access
if (typeof window !== 'undefined') {
    window.stripeIntegration = stripeIntegration;

    // Auto-initialize if config is available
    window.addEventListener('DOMContentLoaded', async () => {
        try {
            if (window.deaConfig?.stripePublishableKey) {
                await stripeIntegration.initialize(window.deaConfig);
            }
        } catch (error) {
            console.warn('Stripe auto-initialization failed:', error);
        }
    });
}