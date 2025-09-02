/**
 * Subscription Selector Component for Digital English Academy
 * Displays pricing plans and handles subscription selection
 */

export class SubscriptionSelector {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            showFreePlan: true,
            highlightPopular: true,
            allowPlanChange: false,
            currentPlan: null,
            billingCycle: 'monthly', // 'monthly' or 'yearly'
            showTrialInfo: true,
            showFeatureComparison: true,
            ...options
        };

        this.plans = [];
        this.selectedPlan = null;
        this.isLoading = false;
    }

    /**
     * Initialize subscription selector
     */
    async initialize() {
        try {
            console.log('📋 Initializing subscription selector...');

            // Load pricing plans
            await this.loadPricingPlans();

            // Render component
            this.render();

            // Setup event listeners
            this.setupEventListeners();

            console.log('✅ Subscription selector initialized');

        } catch (error) {
            console.error('❌ Subscription selector initialization failed:', error);
            this.showError('Error al cargar los planes de suscripción');
        }
    }

    /**
     * Load pricing plans from configuration
     */
    async loadPricingPlans() {
        try {
            const { getAllPricingPlans, getPaidPlans } = await import('../config/stripe-config.js');

            // Get all plans or only paid plans based on options
            this.plans = this.options.showFreePlan ? getAllPricingPlans() : getPaidPlans();

            // Filter by billing cycle if specified
            if (this.options.billingCycle === 'monthly') {
                this.plans = this.plans.filter(plan =>
                    plan.interval === 'month' || plan.interval === null
                );
            } else if (this.options.billingCycle === 'yearly') {
                this.plans = this.plans.filter(plan =>
                    plan.interval === 'year' || plan.interval === null
                );
            }

        } catch (error) {
            console.error('❌ Failed to load pricing plans:', error);
            throw error;
        }
    }

    /**
     * Render subscription selector
     */
    render() {
        const selectorHTML = `
            <div class="subscription-selector">
                ${this.renderHeader()}
                ${this.renderBillingToggle()}
                ${this.renderPlans()}
                ${this.options.showFeatureComparison ? this.renderFeatureComparison() : ''}
                ${this.renderActions()}
            </div>
        `;

        this.container.innerHTML = selectorHTML;
    }

    /**
     * Render header section
     */
    renderHeader() {
        return `
            <div class="selector-header">
                <h2>Elige tu Plan</h2>
                <p>Selecciona el plan que mejor se adapte a tus necesidades de aprendizaje</p>
                ${this.options.showTrialInfo ? `
                    <div class="trial-info">
                        <i class="ph ph-gift" aria-hidden="true"></i>
                        <span>Prueba gratis por 7 días, cancela cuando quieras</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render billing cycle toggle
     */
    renderBillingToggle() {
        if (this.options.billingCycle !== 'both') return '';

        return `
            <div class="billing-toggle">
                <div class="toggle-group" role="radiogroup" aria-label="Ciclo de facturación">
                    <button 
                        type="button" 
                        class="toggle-option ${this.options.billingCycle === 'monthly' ? 'active' : ''}"
                        data-cycle="monthly"
                        role="radio"
                        aria-checked="${this.options.billingCycle === 'monthly'}"
                    >
                        Mensual
                    </button>
                    <button 
                        type="button" 
                        class="toggle-option ${this.options.billingCycle === 'yearly' ? 'active' : ''}"
                        data-cycle="yearly"
                        role="radio"
                        aria-checked="${this.options.billingCycle === 'yearly'}"
                    >
                        Anual
                        <span class="savings-badge">Ahorra 20%</span>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render pricing plans
     */
    renderPlans() {
        const plansHTML = this.plans.map(plan => this.renderPlan(plan)).join('');

        return `
            <div class="plans-grid">
                ${plansHTML}
            </div>
        `;
    }

    /**
     * Render individual plan
     */
    renderPlan(plan) {
        const isCurrentPlan = this.options.currentPlan === plan.id;
        const isPopular = plan.popular && this.options.highlightPopular;
        const isFree = plan.price === 0;

        return `
            <div class="plan-card ${isPopular ? 'popular' : ''} ${isCurrentPlan ? 'current' : ''}" 
                 data-plan-id="${plan.id}">
                
                ${isPopular ? '<div class="popular-badge">Más Popular</div>' : ''}
                
                <div class="plan-header">
                    <h3 class="plan-name">${plan.name}</h3>
                    <p class="plan-description">${plan.description}</p>
                </div>

                <div class="plan-pricing">
                    <div class="price">
                        ${isFree ? `
                            <span class="price-amount">Gratis</span>
                        ` : `
                            <span class="price-currency">$</span>
                            <span class="price-amount">${plan.price}</span>
                            ${plan.interval ? `<span class="price-period">/${plan.interval === 'month' ? 'mes' : 'año'}</span>` : ''}
                        `}
                    </div>
                    
                    ${plan.originalPrice && plan.savings ? `
                        <div class="price-savings">
                            <span class="original-price">$${plan.originalPrice}</span>
                            <span class="savings">Ahorras $${plan.savings}</span>
                        </div>
                    ` : ''}

                    ${plan.trialDays ? `
                        <div class="trial-period">
                            <i class="ph ph-clock" aria-hidden="true"></i>
                            <span>${plan.trialDays} días de prueba gratis</span>
                        </div>
                    ` : ''}
                </div>

                <div class="plan-features">
                    <ul>
                        ${plan.features.map(feature => `
                            <li>
                                <i class="ph ph-check" aria-hidden="true"></i>
                                <span>${feature}</span>
                            </li>
                        `).join('')}
                    </ul>

                    ${plan.limitations && plan.limitations.length > 0 ? `
                        <div class="plan-limitations">
                            <h4>Limitaciones:</h4>
                            <ul>
                                ${plan.limitations.map(limitation => `
                                    <li>
                                        <i class="ph ph-x" aria-hidden="true"></i>
                                        <span>${limitation}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>

                <div class="plan-action">
                    ${this.renderPlanButton(plan, isCurrentPlan)}
                </div>
            </div>
        `;
    }

    /**
     * Render plan action button
     */
    renderPlanButton(plan, isCurrentPlan) {
        if (isCurrentPlan && !this.options.allowPlanChange) {
            return `
                <button class="btn btn-current" disabled>
                    <i class="ph ph-check-circle" aria-hidden="true"></i>
                    Plan Actual
                </button>
            `;
        }

        if (plan.contactSales) {
            return `
                <button class="btn btn-outline" data-action="contact-sales" data-plan="${plan.id}">
                    Contactar Ventas
                </button>
            `;
        }

        if (plan.price === 0) {
            return `
                <button class="btn btn-ghost" data-action="select-free" data-plan="${plan.id}">
                    Comenzar Gratis
                </button>
            `;
        }

        const buttonText = isCurrentPlan ? 'Cambiar Plan' :
            plan.trialDays ? `Probar ${plan.trialDays} días gratis` :
                'Seleccionar Plan';

        return `
            <button class="btn btn-primary" data-action="select-plan" data-plan="${plan.id}">
                ${buttonText}
            </button>
        `;
    }

    /**
     * Render feature comparison table
     */
    renderFeatureComparison() {
        const allFeatures = [
            'Lecciones básicas',
            'Lecciones avanzadas',
            'Contenido descargable',
            'Certificados',
            'Soporte prioritario',
            'Seguimiento avanzado',
            'Lecciones personalizadas',
            'Gestión de equipos',
            'Reportes avanzados',
            'Integración SSO',
            'API access'
        ];

        return `
            <div class="feature-comparison">
                <h3>Comparación de Características</h3>
                <div class="comparison-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Características</th>
                                ${this.plans.map(plan => `<th>${plan.name}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${allFeatures.map(feature => `
                                <tr>
                                    <td>${feature}</td>
                                    ${this.plans.map(plan => `
                                        <td class="feature-cell">
                                            ${plan.features.includes(feature) ?
                '<i class="ph ph-check text-success" aria-label="Incluido"></i>' :
                '<i class="ph ph-x text-muted" aria-label="No incluido"></i>'
            }
                                        </td>
                                    `).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * Render action buttons
     */
    renderActions() {
        return `
            <div class="selector-actions">
                <div class="money-back-guarantee">
                    <i class="ph ph-shield-check" aria-hidden="true"></i>
                    <span>Garantía de devolución de 30 días</span>
                </div>
                
                <div class="support-info">
                    <p>¿Necesitas ayuda para elegir? 
                        <a href="#" class="support-link" data-action="contact-support">
                            Contacta a nuestro equipo
                        </a>
                    </p>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Billing cycle toggle
        const toggleButtons = this.container.querySelectorAll('.toggle-option');
        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleBillingToggle(e));
        });

        // Plan selection buttons
        const planButtons = this.container.querySelectorAll('[data-action]');
        planButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handlePlanAction(e));
        });

        // Plan card selection
        const planCards = this.container.querySelectorAll('.plan-card');
        planCards.forEach(card => {
            card.addEventListener('click', (e) => this.handlePlanCardClick(e));
        });
    }

    /**
     * Handle billing cycle toggle
     */
    async handleBillingToggle(event) {
        const cycle = event.target.dataset.cycle;
        if (cycle === this.options.billingCycle) return;

        try {
            this.options.billingCycle = cycle;

            // Update toggle state
            const toggleButtons = this.container.querySelectorAll('.toggle-option');
            toggleButtons.forEach(btn => {
                const isActive = btn.dataset.cycle === cycle;
                btn.classList.toggle('active', isActive);
                btn.setAttribute('aria-checked', isActive);
            });

            // Reload plans for new billing cycle
            await this.loadPricingPlans();

            // Re-render plans
            const plansGrid = this.container.querySelector('.plans-grid');
            if (plansGrid) {
                plansGrid.innerHTML = this.plans.map(plan => this.renderPlan(plan)).join('');
            }

            // Dispatch event
            this.container.dispatchEvent(new CustomEvent('billingCycleChanged', {
                detail: { cycle }
            }));

        } catch (error) {
            console.error('❌ Billing toggle failed:', error);
            this.showError('Error al cambiar el ciclo de facturación');
        }
    }

    /**
     * Handle plan action buttons
     */
    async handlePlanAction(event) {
        event.preventDefault();
        event.stopPropagation();

        const action = event.target.dataset.action;
        const planId = event.target.dataset.plan;
        const plan = this.plans.find(p => p.id === planId);

        if (!plan) return;

        try {
            this.setLoading(true);

            switch (action) {
                case 'select-free':
                    await this.handleFreePlanSelection(plan);
                    break;

                case 'select-plan':
                    await this.handlePaidPlanSelection(plan);
                    break;

                case 'contact-sales':
                    this.handleContactSales(plan);
                    break;

                case 'contact-support':
                    this.handleContactSupport();
                    break;
            }

        } catch (error) {
            console.error('❌ Plan action failed:', error);
            this.showError('Error al procesar la selección del plan');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Handle plan card click
     */
    handlePlanCardClick(event) {
        // Don't handle if clicking on a button
        if (event.target.closest('button')) return;

        const planId = event.currentTarget.dataset.planId;
        const plan = this.plans.find(p => p.id === planId);

        if (plan) {
            this.selectPlan(plan);
        }
    }

    /**
     * Handle free plan selection
     */
    async handleFreePlanSelection(plan) {
        console.log('📋 Selecting free plan:', plan.id);

        // Update user subscription to free plan
        if (window.deaAuth?.manager) {
            const user = await window.deaAuth.manager.getUserProfile();
            if (user) {
                // Update subscription in local storage (fallback for missing MongoDB)
                try {
                    const subscriptionData = {
                        plan: 'free',
                        status: 'active',
                        startDate: new Date().toISOString(),
                        auth0Id: user.auth0Id
                    };
                    localStorage.setItem('user_subscription', JSON.stringify(subscriptionData));
                    console.log('Subscription updated in local storage:', subscriptionData);
                } catch (error) {
                    console.error('Error updating subscription:', error);
                }
            }
        }

        this.selectedPlan = plan;

        // Dispatch selection event
        this.container.dispatchEvent(new CustomEvent('planSelected', {
            detail: { plan, type: 'free' }
        }));

        this.showSuccess('¡Plan gratuito activado!');
    }

    /**
     * Handle paid plan selection
     */
    async handlePaidPlanSelection(plan) {
        console.log('💳 Selecting paid plan:', plan.id);

        this.selectedPlan = plan;

        // Dispatch selection event
        this.container.dispatchEvent(new CustomEvent('planSelected', {
            detail: { plan, type: 'paid' }
        }));
    }

    /**
     * Handle contact sales
     */
    handleContactSales(plan) {
        console.log('📞 Contact sales for plan:', plan.id);

        // Open contact form or redirect to sales page
        const salesUrl = `/contact-sales?plan=${plan.id}`;
        window.open(salesUrl, '_blank');

        // Dispatch event
        this.container.dispatchEvent(new CustomEvent('contactSales', {
            detail: { plan }
        }));
    }

    /**
     * Handle contact support
     */
    handleContactSupport() {
        console.log('💬 Contact support');

        // Open support chat or redirect to support page
        const supportUrl = '/support';
        window.open(supportUrl, '_blank');

        // Dispatch event
        this.container.dispatchEvent(new CustomEvent('contactSupport'));
    }

    /**
     * Select plan (visual feedback)
     */
    selectPlan(plan) {
        // Remove previous selection
        const planCards = this.container.querySelectorAll('.plan-card');
        planCards.forEach(card => card.classList.remove('selected'));

        // Add selection to current plan
        const selectedCard = this.container.querySelector(`[data-plan-id="${plan.id}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }

        this.selectedPlan = plan;

        // Announce to screen readers
        if (window.deaAccessibility?.announce) {
            window.deaAccessibility.announce(`Plan ${plan.name} seleccionado`, 'polite');
        }
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        this.isLoading = loading;

        const buttons = this.container.querySelectorAll('button[data-action]');
        buttons.forEach(button => {
            button.disabled = loading;

            if (loading) {
                button.classList.add('loading');
            } else {
                button.classList.remove('loading');
            }
        });
    }

    /**
     * Show error message
     */
    showError(message) {
        // Create or update error message
        let errorContainer = this.container.querySelector('.selector-error');

        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'selector-error';
            this.container.insertBefore(errorContainer, this.container.firstChild);
        }

        errorContainer.innerHTML = `
            <div class="error-message">
                <i class="ph ph-warning-circle" aria-hidden="true"></i>
                <span>${message}</span>
                <button class="error-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="ph ph-x" aria-hidden="true"></i>
                </button>
            </div>
        `;

        // Announce to screen readers
        if (window.deaAccessibility?.announce) {
            window.deaAccessibility.announce(message, 'assertive');
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        // Create or update success message
        let successContainer = this.container.querySelector('.selector-success');

        if (!successContainer) {
            successContainer = document.createElement('div');
            successContainer.className = 'selector-success';
            this.container.insertBefore(successContainer, this.container.firstChild);
        }

        successContainer.innerHTML = `
            <div class="success-message">
                <i class="ph ph-check-circle" aria-hidden="true"></i>
                <span>${message}</span>
            </div>
        `;

        // Auto-hide after 3 seconds
        setTimeout(() => {
            successContainer.remove();
        }, 3000);

        // Announce to screen readers
        if (window.deaAccessibility?.announce) {
            window.deaAccessibility.announce(message, 'polite');
        }
    }

    /**
     * Get selected plan
     */
    getSelectedPlan() {
        return this.selectedPlan;
    }

    /**
     * Update current plan
     */
    updateCurrentPlan(planId) {
        this.options.currentPlan = planId;

        // Re-render plans to update current plan styling
        const plansGrid = this.container.querySelector('.plans-grid');
        if (plansGrid) {
            plansGrid.innerHTML = this.plans.map(plan => this.renderPlan(plan)).join('');
        }
    }

    /**
     * Destroy component
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }

        // Clear references
        this.plans = [];
        this.selectedPlan = null;
    }
}

// Export for use in other components
export default SubscriptionSelector;