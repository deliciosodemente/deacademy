/**
 * Payment Form Component for Digital English Academy
 * Handles Stripe payment processing with enhanced UX
 */

export class PaymentForm {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            amount: 0,
            currency: 'usd',
            description: '',
            successUrl: '/payment-success',
            cancelUrl: '/payment-cancel',
            showSaveCard: true,
            showBillingAddress: true,
            theme: 'stripe',
            ...options
        };

        this.stripe = null;
        this.elements = null;
        this.paymentElement = null;
        this.clientSecret = null;
        this.isProcessing = false;
        this.paymentIntent = null;
    }

    /**
     * Initialize payment form
     */
    async initialize() {
        try {
            console.log('💳 Initializing payment form...');

            // Get Stripe manager
            const { stripeManager } = await import('../lib/stripe-manager.js');

            if (!stripeManager.isReady()) {
                throw new Error('Stripe not initialized');
            }

            this.stripe = stripeManager.stripe;

            // Create payment intent
            await this.createPaymentIntent();

            // Render form
            this.render();

            // Initialize Stripe Elements
            await this.initializeElements();

            console.log('✅ Payment form initialized');

        } catch (error) {
            console.error('❌ Payment form initialization failed:', error);
            this.showError('Error al inicializar el formulario de pago');
            throw error;
        }
    }

    /**
     * Create payment intent
     */
    async createPaymentIntent() {
        try {
            const { stripeManager } = await import('../lib/stripe-manager.js');

            this.paymentIntent = await stripeManager.createPaymentIntent(
                this.options.amount,
                this.options.currency,
                {
                    description: this.options.description,
                    return_url: this.options.successUrl
                }
            );

            this.clientSecret = this.paymentIntent.client_secret;

        } catch (error) {
            console.error('❌ Payment intent creation failed:', error);
            throw error;
        }
    }

    /**
     * Render payment form HTML
     */
    render() {
        const formHTML = `
            <div class="payment-form">
                <div class="payment-header">
                    <h2>Información de Pago</h2>
                    <div class="payment-amount">
                        <span class="amount">${this.formatAmount(this.options.amount, this.options.currency)}</span>
                        <span class="description">${this.options.description}</span>
                    </div>
                </div>

                <form id="payment-form" class="payment-form-content">
                    <!-- Payment Element will be mounted here -->
                    <div id="payment-element" class="payment-element">
                        <div class="payment-loading">
                            <div class="loading-spinner"></div>
                            <span>Cargando formulario de pago...</span>
                        </div>
                    </div>

                    ${this.options.showBillingAddress ? this.renderBillingAddress() : ''}

                    <div class="payment-options">
                        ${this.options.showSaveCard ? `
                            <label class="checkbox-label">
                                <input type="checkbox" id="save-card" name="save-card">
                                <span class="checkmark"></span>
                                Guardar información de pago para futuras compras
                            </label>
                        ` : ''}
                    </div>

                    <div class="payment-actions">
                        <button type="submit" id="submit-payment" class="btn btn-primary btn-large" disabled>
                            <span class="btn-text">Procesar Pago</span>
                            <div class="btn-loading" style="display: none;">
                                <div class="loading-spinner"></div>
                                <span>Procesando...</span>
                            </div>
                        </button>
                        
                        <button type="button" id="cancel-payment" class="btn btn-ghost btn-large">
                            Cancelar
                        </button>
                    </div>

                    <div class="payment-security">
                        <div class="security-badges">
                            <img src="/images/stripe-badge.png" alt="Powered by Stripe" class="stripe-badge">
                            <div class="security-text">
                                <i class="ph ph-lock" aria-hidden="true"></i>
                                <span>Pago seguro y encriptado</span>
                            </div>
                        </div>
                    </div>
                </form>

                <div id="payment-messages" class="payment-messages" role="alert" aria-live="polite"></div>
            </div>
        `;

        this.container.innerHTML = formHTML;
        this.setupEventListeners();
    }

    /**
     * Render billing address section
     */
    renderBillingAddress() {
        return `
            <div class="billing-address">
                <h3>Dirección de Facturación</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label for="billing-name">Nombre Completo</label>
                        <input type="text" id="billing-name" name="billing-name" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="billing-email">Email</label>
                        <input type="email" id="billing-email" name="billing-email" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="billing-address">Dirección</label>
                        <input type="text" id="billing-address" name="billing-address" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group half">
                        <label for="billing-city">Ciudad</label>
                        <input type="text" id="billing-city" name="billing-city" required>
                    </div>
                    <div class="form-group half">
                        <label for="billing-postal">Código Postal</label>
                        <input type="text" id="billing-postal" name="billing-postal" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="billing-country">País</label>
                        <select id="billing-country" name="billing-country" required>
                            <option value="">Seleccionar país</option>
                            <option value="US">Estados Unidos</option>
                            <option value="ES">España</option>
                            <option value="MX">México</option>
                            <option value="AR">Argentina</option>
                            <option value="CO">Colombia</option>
                            <option value="PE">Perú</option>
                            <option value="CL">Chile</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Initialize Stripe Elements
     */
    async initializeElements() {
        try {
            const { stripeManager } = await import('../lib/stripe-manager.js');

            // Create elements instance
            this.elements = stripeManager.createElements({
                clientSecret: this.clientSecret,
                appearance: {
                    theme: this.options.theme,
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
            });

            // Create payment element
            this.paymentElement = this.elements.create('payment', {
                layout: 'tabs'
            });

            // Mount payment element
            this.paymentElement.mount('#payment-element');

            // Listen for changes
            this.paymentElement.on('change', (event) => {
                this.handleElementChange(event);
            });

            // Enable submit button
            const submitButton = document.getElementById('submit-payment');
            if (submitButton) {
                submitButton.disabled = false;
            }

            // Hide loading state
            const loadingElement = document.querySelector('.payment-loading');
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }

        } catch (error) {
            console.error('❌ Elements initialization failed:', error);
            this.showError('Error al cargar el formulario de pago');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const form = document.getElementById('payment-form');
        const cancelButton = document.getElementById('cancel-payment');

        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        if (cancelButton) {
            cancelButton.addEventListener('click', () => this.handleCancel());
        }

        // Auto-fill billing details if user is logged in
        this.autoFillBillingDetails();
    }

    /**
     * Handle element changes
     */
    handleElementChange(event) {
        if (event.error) {
            this.showError(event.error.message);
        } else {
            this.clearMessages();
        }

        // Update submit button state
        const submitButton = document.getElementById('submit-payment');
        if (submitButton) {
            submitButton.disabled = !event.complete || this.isProcessing;
        }
    }

    /**
     * Handle form submission
     */
    async handleSubmit(event) {
        event.preventDefault();

        if (this.isProcessing) return;

        try {
            this.isProcessing = true;
            this.showProcessing(true);
            this.clearMessages();

            // Get billing details
            const billingDetails = this.getBillingDetails();

            // Confirm payment
            const { stripeManager } = await import('../lib/stripe-manager.js');

            const result = await stripeManager.confirmPayment(
                this.clientSecret,
                this.paymentElement,
                {
                    returnUrl: this.options.successUrl,
                    billingDetails,
                    redirect: 'if_required'
                }
            );

            if (result.error) {
                this.showError(this.getErrorMessage(result.error));
            } else {
                // Payment succeeded
                this.handlePaymentSuccess(result.paymentIntent);
            }

        } catch (error) {
            console.error('❌ Payment submission failed:', error);
            this.showError('Error al procesar el pago. Por favor, intenta nuevamente.');
        } finally {
            this.isProcessing = false;
            this.showProcessing(false);
        }
    }

    /**
     * Handle payment success
     */
    handlePaymentSuccess(paymentIntent) {
        console.log('✅ Payment succeeded:', paymentIntent.id);

        // Show success message
        this.showSuccess('¡Pago procesado exitosamente!');

        // Redirect after delay
        setTimeout(() => {
            window.location.href = this.options.successUrl;
        }, 2000);

        // Dispatch success event
        this.container.dispatchEvent(new CustomEvent('paymentSuccess', {
            detail: { paymentIntent }
        }));
    }

    /**
     * Handle cancel
     */
    handleCancel() {
        if (this.isProcessing) return;

        // Dispatch cancel event
        this.container.dispatchEvent(new CustomEvent('paymentCancel'));

        // Redirect to cancel URL
        if (this.options.cancelUrl) {
            window.location.href = this.options.cancelUrl;
        }
    }

    /**
     * Get billing details from form
     */
    getBillingDetails() {
        const billingDetails = {};

        if (this.options.showBillingAddress) {
            const name = document.getElementById('billing-name')?.value;
            const email = document.getElementById('billing-email')?.value;
            const address = document.getElementById('billing-address')?.value;
            const city = document.getElementById('billing-city')?.value;
            const postal = document.getElementById('billing-postal')?.value;
            const country = document.getElementById('billing-country')?.value;

            if (name || email) {
                billingDetails.name = name;
                billingDetails.email = email;
            }

            if (address || city || postal || country) {
                billingDetails.address = {
                    line1: address,
                    city: city,
                    postal_code: postal,
                    country: country
                };
            }
        }

        return billingDetails;
    }

    /**
     * Auto-fill billing details for logged-in users
     */
    async autoFillBillingDetails() {
        try {
            if (!window.deaAuth?.manager) return;

            const user = await window.deaAuth.manager.getUser();
            if (!user) return;

            // Fill in user details
            const nameField = document.getElementById('billing-name');
            const emailField = document.getElementById('billing-email');

            if (nameField && user.name) {
                nameField.value = user.name;
            }

            if (emailField && user.email) {
                emailField.value = user.email;
            }

        } catch (error) {
            console.error('❌ Auto-fill billing details failed:', error);
        }
    }

    /**
     * Show processing state
     */
    showProcessing(processing) {
        const submitButton = document.getElementById('submit-payment');
        const btnText = submitButton?.querySelector('.btn-text');
        const btnLoading = submitButton?.querySelector('.btn-loading');

        if (submitButton) {
            submitButton.disabled = processing;
        }

        if (btnText) {
            btnText.style.display = processing ? 'none' : 'inline';
        }

        if (btnLoading) {
            btnLoading.style.display = processing ? 'flex' : 'none';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const messagesContainer = document.getElementById('payment-messages');
        if (!messagesContainer) return;

        messagesContainer.innerHTML = `
            <div class="payment-message payment-error">
                <i class="ph ph-warning-circle" aria-hidden="true"></i>
                <span>${message}</span>
            </div>
        `;

        messagesContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Announce to screen readers
        if (window.deaAccessibility?.announce) {
            window.deaAccessibility.announce(message, 'assertive');
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        const messagesContainer = document.getElementById('payment-messages');
        if (!messagesContainer) return;

        messagesContainer.innerHTML = `
            <div class="payment-message payment-success">
                <i class="ph ph-check-circle" aria-hidden="true"></i>
                <span>${message}</span>
            </div>
        `;

        // Announce to screen readers
        if (window.deaAccessibility?.announce) {
            window.deaAccessibility.announce(message, 'polite');
        }
    }

    /**
     * Clear messages
     */
    clearMessages() {
        const messagesContainer = document.getElementById('payment-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
    }

    /**
     * Get user-friendly error message
     */
    getErrorMessage(error) {
        const errorMessages = {
            'card_declined': 'Tu tarjeta fue rechazada. Por favor, intenta con otra tarjeta.',
            'expired_card': 'Tu tarjeta ha expirado. Por favor, verifica la fecha de vencimiento.',
            'incorrect_cvc': 'El código de seguridad es incorrecto.',
            'insufficient_funds': 'Fondos insuficientes en tu tarjeta.',
            'invalid_expiry_month': 'El mes de vencimiento es inválido.',
            'invalid_expiry_year': 'El año de vencimiento es inválido.',
            'invalid_number': 'El número de tarjeta es inválido.',
            'processing_error': 'Error al procesar el pago. Por favor, intenta nuevamente.',
            'authentication_required': 'Se requiere autenticación adicional para completar el pago.'
        };

        return errorMessages[error.code] || error.message || 'Error desconocido al procesar el pago.';
    }

    /**
     * Format amount for display
     */
    formatAmount(amount, currency) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: currency.toUpperCase(),
            minimumFractionDigits: 2
        }).format(amount);
    }

    /**
     * Update payment amount
     */
    async updateAmount(newAmount, newDescription = '') {
        try {
            this.options.amount = newAmount;
            this.options.description = newDescription;

            // Create new payment intent
            await this.createPaymentIntent();

            // Update display
            const amountElement = document.querySelector('.payment-amount .amount');
            const descriptionElement = document.querySelector('.payment-amount .description');

            if (amountElement) {
                amountElement.textContent = this.formatAmount(newAmount, this.options.currency);
            }

            if (descriptionElement) {
                descriptionElement.textContent = newDescription;
            }

            // Reinitialize elements with new client secret
            if (this.paymentElement) {
                this.paymentElement.unmount();
                await this.initializeElements();
            }

        } catch (error) {
            console.error('❌ Amount update failed:', error);
            this.showError('Error al actualizar el monto del pago');
        }
    }

    /**
     * Destroy payment form
     */
    destroy() {
        if (this.paymentElement) {
            this.paymentElement.unmount();
        }

        if (this.container) {
            this.container.innerHTML = '';
        }

        // Clear references
        this.stripe = null;
        this.elements = null;
        this.paymentElement = null;
        this.clientSecret = null;
        this.paymentIntent = null;
    }
}

// Export for use in other components
export default PaymentForm;