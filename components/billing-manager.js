/**
 * Billing Manager Component for Digital English Academy
 * Handles subscription management, billing history, and payment methods
 */

export class BillingManager {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            showPaymentMethods: true,
            showBillingHistory: true,
            showSubscriptionDetails: true,
            showUsageMetrics: false,
            allowPlanChanges: true,
            allowCancellation: true,
            ...options
        };

        this.subscription = null;
        this.paymentMethods = [];
        this.billingHistory = [];
        this.isLoading = false;
    }

    /**
     * Initialize billing manager
     */
    async initialize() {
        try {
            console.log('💼 Initializing billing manager...');

            // Check authentication
            if (!window.deaAuth?.manager?.isUserAuthenticated()) {
                throw new Error('User authentication required');
            }

            // Load billing data
            await this.loadBillingData();

            // Render component
            this.render();

            // Setup event listeners
            this.setupEventListeners();

            console.log('✅ Billing manager initialized');

        } catch (error) {
            console.error('❌ Billing manager initialization failed:', error);
            this.showError('Error al cargar la información de facturación');
        }
    }

    /**
     * Load billing data
     */
    async loadBillingData() {
        try {
            const { stripeManager } = await import('../lib/stripe-manager.js');

            // Load data in parallel
            const [subscription, paymentMethods, billingHistory] = await Promise.allSettled([
                this.loadSubscriptionData(),
                this.options.showPaymentMethods ? stripeManager.getPaymentMethods() : Promise.resolve([]),
                this.options.showBillingHistory ? stripeManager.getBillingHistory() : Promise.resolve([])
            ]);

            this.subscription = subscription.status === 'fulfilled' ? subscription.value : null;
            this.paymentMethods = paymentMethods.status === 'fulfilled' ? paymentMethods.value : [];
            this.billingHistory = billingHistory.status === 'fulfilled' ? billingHistory.value : [];

        } catch (error) {
            console.error('❌ Failed to load billing data:', error);
            throw error;
        }
    }

    /**
     * Load subscription data
     */
    async loadSubscriptionData() {
        try {
            const user = await window.deaAuth.manager.getUserProfile();
            if (!user || !user.subscription) {
                return null;
            }

            // Get detailed subscription info from Stripe if available
            if (user.subscription.stripeSubscriptionId) {
                const { stripeManager } = await import('../lib/stripe-manager.js');
                return await stripeManager.getSubscription(user.subscription.stripeSubscriptionId);
            }

            return user.subscription;

        } catch (error) {
            console.error('❌ Failed to load subscription data:', error);
            return null;
        }
    }

    /**
     * Render billing manager
     */
    render() {
        const managerHTML = `
            <div class="billing-manager">
                ${this.renderHeader()}
                ${this.options.showSubscriptionDetails ? this.renderSubscriptionDetails() : ''}
                ${this.options.showPaymentMethods ? this.renderPaymentMethods() : ''}
                ${this.options.showBillingHistory ? this.renderBillingHistory() : ''}
                ${this.options.showUsageMetrics ? this.renderUsageMetrics() : ''}
                ${this.renderActions()}
            </div>
        `;

        this.container.innerHTML = managerHTML;
    }

    /**
     * Render header
     */
    renderHeader() {
        return `
            <div class="billing-header">
                <h2>Gestión de Facturación</h2>
                <p>Administra tu suscripción, métodos de pago e historial de facturación</p>
            </div>
        `;
    }

    /**
     * Render subscription details
     */
    renderSubscriptionDetails() {
        if (!this.subscription) {
            return `
                <div class="subscription-section">
                    <h3>Suscripción</h3>
                    <div class="no-subscription">
                        <i class="ph ph-info" aria-hidden="true"></i>
                        <p>No tienes una suscripción activa</p>
                        <button class="btn btn-primary" data-action="browse-plans">
                            Ver Planes Disponibles
                        </button>
                    </div>
                </div>
            `;
        }

        const isActive = this.subscription.status === 'active';
        const isPastDue = this.subscription.status === 'past_due';
        const isCanceled = this.subscription.status === 'canceled';
        const isTrialing = this.subscription.status === 'trialing';

        return `
            <div class="subscription-section">
                <h3>Detalles de Suscripción</h3>
                <div class="subscription-card">
                    <div class="subscription-info">
                        <div class="plan-info">
                            <h4>${this.getPlanDisplayName(this.subscription.plan)}</h4>
                            <div class="plan-status ${this.subscription.status}">
                                <i class="ph ${this.getStatusIcon(this.subscription.status)}" aria-hidden="true"></i>
                                <span>${this.getStatusText(this.subscription.status)}</span>
                            </div>
                        </div>

                        <div class="subscription-details">
                            ${this.subscription.currentPeriodEnd ? `
                                <div class="detail-item">
                                    <span class="label">
                                        ${isCanceled ? 'Termina el:' : 'Próxima facturación:'}
                                    </span>
                                    <span class="value">
                                        ${this.formatDate(this.subscription.currentPeriodEnd)}
                                    </span>
                                </div>
                            ` : ''}

                            ${this.subscription.trialEnd && isTrialing ? `
                                <div class="detail-item">
                                    <span class="label">Prueba termina:</span>
                                    <span class="value">
                                        ${this.formatDate(this.subscription.trialEnd)}
                                    </span>
                                </div>
                            ` : ''}

                            ${this.subscription.cancelAtPeriodEnd ? `
                                <div class="detail-item warning">
                                    <i class="ph ph-warning" aria-hidden="true"></i>
                                    <span>Tu suscripción se cancelará al final del período actual</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="subscription-actions">
                        ${this.renderSubscriptionActions()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render subscription actions
     */
    renderSubscriptionActions() {
        if (!this.subscription) return '';

        const isActive = this.subscription.status === 'active';
        const isCanceled = this.subscription.status === 'canceled';
        const isPastDue = this.subscription.status === 'past_due';

        let actions = [];

        if (this.options.allowPlanChanges && (isActive || isPastDue)) {
            actions.push(`
                <button class="btn btn-outline" data-action="change-plan">
                    <i class="ph ph-swap" aria-hidden="true"></i>
                    Cambiar Plan
                </button>
            `);
        }

        if (isPastDue) {
            actions.push(`
                <button class="btn btn-primary" data-action="update-payment">
                    <i class="ph ph-credit-card" aria-hidden="true"></i>
                    Actualizar Pago
                </button>
            `);
        }

        if (isActive && !this.subscription.cancelAtPeriodEnd && this.options.allowCancellation) {
            actions.push(`
                <button class="btn btn-danger-outline" data-action="cancel-subscription">
                    <i class="ph ph-x-circle" aria-hidden="true"></i>
                    Cancelar Suscripción
                </button>
            `);
        }

        if (this.subscription.cancelAtPeriodEnd) {
            actions.push(`
                <button class="btn btn-primary" data-action="reactivate-subscription">
                    <i class="ph ph-arrow-clockwise" aria-hidden="true"></i>
                    Reactivar Suscripción
                </button>
            `);
        }

        actions.push(`
            <button class="btn btn-ghost" data-action="customer-portal">
                <i class="ph ph-gear" aria-hidden="true"></i>
                Portal de Cliente
            </button>
        `);

        return actions.join('');
    }

    /**
     * Render payment methods
     */
    renderPaymentMethods() {
        return `
            <div class="payment-methods-section">
                <div class="section-header">
                    <h3>Métodos de Pago</h3>
                    <button class="btn btn-outline btn-small" data-action="add-payment-method">
                        <i class="ph ph-plus" aria-hidden="true"></i>
                        Agregar Método
                    </button>
                </div>

                <div class="payment-methods-list">
                    ${this.paymentMethods.length > 0 ?
                this.paymentMethods.map(method => this.renderPaymentMethod(method)).join('') :
                `<div class="no-payment-methods">
                            <i class="ph ph-credit-card" aria-hidden="true"></i>
                            <p>No tienes métodos de pago guardados</p>
                        </div>`
            }
                </div>
            </div>
        `;
    }

    /**
     * Render individual payment method
     */
    renderPaymentMethod(method) {
        const isDefault = method.is_default;
        const cardBrand = method.card?.brand?.toUpperCase() || 'CARD';
        const last4 = method.card?.last4 || '****';
        const expMonth = method.card?.exp_month || '';
        const expYear = method.card?.exp_year || '';

        return `
            <div class="payment-method-card ${isDefault ? 'default' : ''}" data-method-id="${method.id}">
                <div class="method-info">
                    <div class="card-icon">
                        <i class="ph ph-credit-card" aria-hidden="true"></i>
                    </div>
                    <div class="card-details">
                        <div class="card-brand">${cardBrand} •••• ${last4}</div>
                        <div class="card-expiry">Vence ${expMonth}/${expYear}</div>
                    </div>
                    ${isDefault ? '<div class="default-badge">Predeterminado</div>' : ''}
                </div>

                <div class="method-actions">
                    ${!isDefault ? `
                        <button class="btn btn-ghost btn-small" data-action="set-default" data-method-id="${method.id}">
                            Predeterminado
                        </button>
                    ` : ''}
                    <button class="btn btn-danger-ghost btn-small" data-action="remove-payment-method" data-method-id="${method.id}">
                        <i class="ph ph-trash" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render billing history
     */
    renderBillingHistory() {
        return `
            <div class="billing-history-section">
                <div class="section-header">
                    <h3>Historial de Facturación</h3>
                    <button class="btn btn-ghost btn-small" data-action="download-invoices">
                        <i class="ph ph-download" aria-hidden="true"></i>
                        Descargar Todo
                    </button>
                </div>

                <div class="billing-history-list">
                    ${this.billingHistory.length > 0 ?
                this.billingHistory.map(invoice => this.renderInvoice(invoice)).join('') :
                `<div class="no-billing-history">
                            <i class="ph ph-receipt" aria-hidden="true"></i>
                            <p>No hay historial de facturación disponible</p>
                        </div>`
            }
                </div>
            </div>
        `;
    }

    /**
     * Render individual invoice
     */
    renderInvoice(invoice) {
        const isPaid = invoice.status === 'paid';
        const amount = this.formatCurrency(invoice.amount_paid || invoice.amount_due, invoice.currency);
        const date = this.formatDate(invoice.created);

        return `
            <div class="invoice-card ${invoice.status}" data-invoice-id="${invoice.id}">
                <div class="invoice-info">
                    <div class="invoice-details">
                        <div class="invoice-number">Factura #${invoice.number || invoice.id.substring(0, 8)}</div>
                        <div class="invoice-date">${date}</div>
                    </div>
                    <div class="invoice-amount">
                        <span class="amount">${amount}</span>
                        <div class="status ${invoice.status}">
                            <i class="ph ${isPaid ? 'ph-check-circle' : 'ph-warning-circle'}" aria-hidden="true"></i>
                            <span>${isPaid ? 'Pagado' : 'Pendiente'}</span>
                        </div>
                    </div>
                </div>

                <div class="invoice-actions">
                    ${invoice.invoice_pdf ? `
                        <a href="${invoice.invoice_pdf}" target="_blank" class="btn btn-ghost btn-small">
                            <i class="ph ph-download" aria-hidden="true"></i>
                            PDF
                        </a>
                    ` : ''}
                    ${!isPaid ? `
                        <button class="btn btn-primary btn-small" data-action="pay-invoice" data-invoice-id="${invoice.id}">
                            Pagar Ahora
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render usage metrics
     */
    renderUsageMetrics() {
        return `
            <div class="usage-metrics-section">
                <h3>Uso del Servicio</h3>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">24</div>
                        <div class="metric-label">Lecciones Completadas</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">156</div>
                        <div class="metric-label">Minutos de Estudio</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">12</div>
                        <div class="metric-label">Certificados Obtenidos</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render actions
     */
    renderActions() {
        return `
            <div class="billing-actions">
                <div class="help-section">
                    <h4>¿Necesitas Ayuda?</h4>
                    <p>Si tienes preguntas sobre tu facturación o suscripción, estamos aquí para ayudarte.</p>
                    <button class="btn btn-outline" data-action="contact-support">
                        <i class="ph ph-chat-circle" aria-hidden="true"></i>
                        Contactar Soporte
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const actionButtons = this.container.querySelectorAll('[data-action]');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleAction(e));
        });
    }

    /**
     * Handle action buttons
     */
    async handleAction(event) {
        event.preventDefault();

        const action = event.target.closest('[data-action]').dataset.action;
        const methodId = event.target.dataset.methodId;
        const invoiceId = event.target.dataset.invoiceId;

        try {
            this.setLoading(true);

            switch (action) {
                case 'browse-plans':
                    this.handleBrowsePlans();
                    break;

                case 'change-plan':
                    await this.handleChangePlan();
                    break;

                case 'cancel-subscription':
                    await this.handleCancelSubscription();
                    break;

                case 'reactivate-subscription':
                    await this.handleReactivateSubscription();
                    break;

                case 'update-payment':
                    await this.handleUpdatePayment();
                    break;

                case 'customer-portal':
                    await this.handleCustomerPortal();
                    break;

                case 'add-payment-method':
                    await this.handleAddPaymentMethod();
                    break;

                case 'remove-payment-method':
                    await this.handleRemovePaymentMethod(methodId);
                    break;

                case 'set-default':
                    await this.handleSetDefaultPaymentMethod(methodId);
                    break;

                case 'pay-invoice':
                    await this.handlePayInvoice(invoiceId);
                    break;

                case 'download-invoices':
                    await this.handleDownloadInvoices();
                    break;

                case 'contact-support':
                    this.handleContactSupport();
                    break;
            }

        } catch (error) {
            console.error('❌ Action failed:', error);
            this.showError('Error al procesar la acción');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Handle browse plans
     */
    handleBrowsePlans() {
        window.location.href = '/pricing';
    }

    /**
     * Handle change plan
     */
    async handleChangePlan() {
        // Open plan selector modal or redirect to pricing page
        window.location.href = '/pricing?change=true';
    }

    /**
     * Handle cancel subscription
     */
    async handleCancelSubscription() {
        const confirmed = await this.showConfirmDialog(
            'Cancelar Suscripción',
            '¿Estás seguro de que quieres cancelar tu suscripción? Mantendrás acceso hasta el final del período actual.',
            'Cancelar Suscripción',
            'Mantener Suscripción'
        );

        if (!confirmed) return;

        const { stripeManager } = await import('../lib/stripe-manager.js');
        await stripeManager.cancelSubscription(this.subscription.id, {
            atPeriodEnd: true,
            reason: 'user_requested'
        });

        this.showSuccess('Suscripción cancelada. Mantendrás acceso hasta el final del período actual.');
        await this.loadBillingData();
        this.render();
    }

    /**
     * Handle reactivate subscription
     */
    async handleReactivateSubscription() {
        const { stripeManager } = await import('../lib/stripe-manager.js');
        await stripeManager.updateSubscription(this.subscription.id, {
            cancel_at_period_end: false
        });

        this.showSuccess('¡Suscripción reactivada exitosamente!');
        await this.loadBillingData();
        this.render();
    }

    /**
     * Handle update payment
     */
    async handleUpdatePayment() {
        // Redirect to payment update flow
        window.location.href = '/billing/update-payment';
    }

    /**
     * Handle customer portal
     */
    async handleCustomerPortal() {
        const { stripeManager } = await import('../lib/stripe-manager.js');
        const session = await stripeManager.createPortalSession(window.location.href);

        window.location.href = session.url;
    }

    /**
     * Handle add payment method
     */
    async handleAddPaymentMethod() {
        // Open payment method form modal or redirect
        window.location.href = '/billing/add-payment-method';
    }

    /**
     * Handle remove payment method
     */
    async handleRemovePaymentMethod(methodId) {
        const confirmed = await this.showConfirmDialog(
            'Eliminar Método de Pago',
            '¿Estás seguro de que quieres eliminar este método de pago?',
            'Eliminar',
            'Cancelar'
        );

        if (!confirmed) return;

        // Remove payment method via API
        const response = await fetch(`/api/payment-methods/${methodId}`, {
            method: 'DELETE',
            headers: await this.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to remove payment method');
        }

        this.showSuccess('Método de pago eliminado exitosamente');
        await this.loadBillingData();
        this.render();
    }

    /**
     * Handle set default payment method
     */
    async handleSetDefaultPaymentMethod(methodId) {
        // Set default payment method via API
        const response = await fetch(`/api/payment-methods/${methodId}/set-default`, {
            method: 'POST',
            headers: await this.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to set default payment method');
        }

        this.showSuccess('Método de pago predeterminado actualizado');
        await this.loadBillingData();
        this.render();
    }

    /**
     * Handle pay invoice
     */
    async handlePayInvoice(invoiceId) {
        // Redirect to invoice payment flow
        window.location.href = `/billing/pay-invoice/${invoiceId}`;
    }

    /**
     * Handle download invoices
     */
    async handleDownloadInvoices() {
        // Download all invoices as ZIP
        const response = await fetch('/api/billing/download-invoices', {
            headers: await this.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to download invoices');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'invoices.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Handle contact support
     */
    handleContactSupport() {
        window.location.href = '/support';
    }

    /**
     * Get plan display name
     */
    getPlanDisplayName(planId) {
        const planNames = {
            'free': 'Plan Gratuito',
            'premium': 'Plan Premium',
            'enterprise': 'Plan Empresarial'
        };

        return planNames[planId] || planId;
    }

    /**
     * Get status icon
     */
    getStatusIcon(status) {
        const icons = {
            'active': 'ph-check-circle',
            'trialing': 'ph-clock',
            'past_due': 'ph-warning-circle',
            'canceled': 'ph-x-circle',
            'incomplete': 'ph-warning'
        };

        return icons[status] || 'ph-info';
    }

    /**
     * Get status text
     */
    getStatusText(status) {
        const texts = {
            'active': 'Activa',
            'trialing': 'En Prueba',
            'past_due': 'Pago Vencido',
            'canceled': 'Cancelada',
            'incomplete': 'Incompleta'
        };

        return texts[status] || status;
    }

    /**
     * Format currency
     */
    formatCurrency(amount, currency = 'usd') {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: currency.toUpperCase(),
            minimumFractionDigits: 2
        }).format(amount / 100);
    }

    /**
     * Format date
     */
    formatDate(date) {
        return new Intl.DateTimeFormat('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    }

    /**
     * Show confirm dialog
     */
    async showConfirmDialog(title, message, confirmText, cancelText) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'confirm-dialog-overlay';
            dialog.innerHTML = `
                <div class="confirm-dialog">
                    <h3>${title}</h3>
                    <p>${message}</p>
                    <div class="dialog-actions">
                        <button class="btn btn-danger" data-result="true">${confirmText}</button>
                        <button class="btn btn-ghost" data-result="false">${cancelText}</button>
                    </div>
                </div>
            `;

            dialog.addEventListener('click', (e) => {
                const result = e.target.dataset.result;
                if (result !== undefined) {
                    dialog.remove();
                    resolve(result === 'true');
                }
            });

            document.body.appendChild(dialog);
        });
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        this.isLoading = loading;

        const buttons = this.container.querySelectorAll('button[data-action]');
        buttons.forEach(button => {
            button.disabled = loading;
        });
    }

    /**
     * Show error message
     */
    showError(message) {
        // Implementation similar to other components
        console.error(message);
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        // Implementation similar to other components
        console.log(message);
    }

    /**
     * Get auth headers
     */
    async getAuthHeaders() {
        if (window.deaAuth?.manager) {
            return await window.deaAuth.manager.getAuthHeaders();
        }
        return { 'Content-Type': 'application/json' };
    }

    /**
     * Destroy component
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }

        // Clear references
        this.subscription = null;
        this.paymentMethods = [];
        this.billingHistory = [];
    }
}

// Export for use in other components
export default BillingManager;