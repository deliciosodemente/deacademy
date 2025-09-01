/**
 * Configuración de Productos Stripe - Digital English Academy
 * ¡LISTO PARA GENERAR INGRESOS! 💰
 */

export const stripeProducts = {
    // 🆓 PLAN GRATUITO
    free: {
        name: 'Plan Gratuito',
        price: 0,
        currency: 'usd',
        interval: 'month',
        features: [
            '✅ Acceso a cursos básicos',
            '✅ 10 consultas IA por mes',
            '✅ Comunidad de estudiantes',
            '✅ Certificados básicos'
        ],
        limits: {
            aiQueries: 10,
            courses: 'basic',
            support: 'community'
        }
    },

    // 💎 PLAN PREMIUM
    premium: {
        name: 'Plan Premium',
        price: 29.99,
        priceId: 'price_premium_monthly', // Reemplazar con tu Price ID real
        currency: 'usd',
        interval: 'month',
        popular: true,
        features: [
            '✅ Todos los cursos disponibles',
            '✅ 100 consultas IA por mes',
            '✅ Tutor IA personalizado',
            '✅ Certificados oficiales',
            '✅ Soporte prioritario',
            '✅ Descarga de contenido',
            '✅ Clases en vivo semanales'
        ],
        limits: {
            aiQueries: 100,
            courses: 'all',
            support: 'priority',
            downloads: true,
            liveClasses: true
        }
    },

    // 🚀 PLAN PRO
    pro: {
        name: 'Plan Pro',
        price: 99.99,
        priceId: 'price_pro_monthly', // Reemplazar con tu Price ID real
        currency: 'usd',
        interval: 'month',
        features: [
            '✅ Todo del Plan Premium',
            '✅ 1000 consultas IA por mes',
            '✅ IA sin límites los fines de semana',
            '✅ Sesiones 1-on-1 con profesores',
            '✅ Cursos empresariales',
            '✅ API access para desarrolladores',
            '✅ Análisis de progreso avanzado',
            '✅ Soporte 24/7'
        ],
        limits: {
            aiQueries: 1000,
            courses: 'all_plus_enterprise',
            support: '24/7',
            downloads: true,
            liveClasses: true,
            oneOnOne: true,
            apiAccess: true
        }
    },

    // 🏢 PLAN EMPRESARIAL
    enterprise: {
        name: 'Plan Empresarial',
        price: 299.99,
        priceId: 'price_enterprise_monthly', // Reemplazar con tu Price ID real
        currency: 'usd',
        interval: 'month',
        features: [
            '✅ Todo del Plan Pro',
            '✅ IA ilimitada',
            '✅ Cursos personalizados',
            '✅ Dashboard de administración',
            '✅ Múltiples usuarios (hasta 50)',
            '✅ Integración con LMS',
            '✅ Reportes avanzados',
            '✅ Gerente de cuenta dedicado'
        ],
        limits: {
            aiQueries: 'unlimited',
            courses: 'custom',
            support: 'dedicated',
            users: 50,
            customization: true,
            lmsIntegration: true
        }
    }
};

// 🎯 CONFIGURACIÓN DE CHECKOUT
export const checkoutConfig = {
    successUrl: 'https://denglishacademy.com/success?session_id={CHECKOUT_SESSION_ID}',
    cancelUrl: 'https://denglishacademy.com/pricing',

    // Métodos de pago aceptados
    paymentMethods: ['card'],

    // Configuración de facturación
    billingAddressCollection: 'auto',

    // Configuración de impuestos
    automaticTax: {
        enabled: true
    },

    // Configuración de cupones
    allowPromotionCodes: true,

    // Configuración de prueba gratuita
    trialPeriodDays: 7, // 7 días gratis para Premium y Pro

    // Configuración de facturación
    invoiceCreation: {
        enabled: true,
        invoiceData: {
            description: 'Suscripción a Digital English Academy',
            footer: 'Gracias por elegir Digital English Academy para tu aprendizaje de inglés.'
        }
    }
};

// 💳 FUNCIONES DE STRIPE
export class StripeManager {
    constructor() {
        this.stripe = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            // Cargar Stripe.js
            if (!window.Stripe) {
                await this.loadStripeJS();
            }

            // Inicializar con clave pública
            const publishableKey = window.deaConfig?.stripePublishableKey ||
                'pk_live_51RP8jBA9gFBXMfaLdQJ8K9vYxGzF8mK2nP4rT6sU8wV0xY2zA3bC5dE7fG9hI1jK3lM5nO7pQ9rS1tU3vW5xY7zA9bC1dE3fG5h';

            this.stripe = window.Stripe(publishableKey);
            this.isInitialized = true;

            console.log('✅ Stripe inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando Stripe:', error);
            throw error;
        }
    }

    async loadStripeJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async createCheckoutSession(priceId, userId, email) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            // Obtener token de autenticación
            const token = await this.getAuthToken();

            // Crear sesión de checkout
            const response = await fetch('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    priceId,
                    userId,
                    email
                })
            });

            if (!response.ok) {
                throw new Error('Error creando sesión de pago');
            }

            const { sessionId } = await response.json();

            // Redirigir a Stripe Checkout
            const { error } = await this.stripe.redirectToCheckout({
                sessionId
            });

            if (error) {
                throw error;
            }

        } catch (error) {
            console.error('❌ Error en checkout:', error);
            throw error;
        }
    }

    async getAuthToken() {
        if (window.deaAuth?.manager) {
            return await window.deaAuth.manager.getAccessToken();
        }
        throw new Error('Usuario no autenticado');
    }

    // 🎨 CREAR BOTONES DE SUSCRIPCIÓN
    createSubscriptionButton(plan, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const product = stripeProducts[plan];
        if (!product) return;

        const button = document.createElement('button');
        button.className = `subscription-btn ${plan === 'premium' ? 'popular' : ''}`;
        button.innerHTML = `
      <div class="plan-header">
        <h3>${product.name}</h3>
        ${plan === 'premium' ? '<span class="popular-badge">Más Popular</span>' : ''}
      </div>
      <div class="plan-price">
        <span class="currency">$</span>
        <span class="amount">${product.price}</span>
        <span class="period">/mes</span>
      </div>
      <div class="plan-features">
        ${product.features.map(feature => `<div class="feature">${feature}</div>`).join('')}
      </div>
      <div class="plan-action">
        ${plan === 'free' ? 'Comenzar Gratis' : 'Suscribirse Ahora'}
      </div>
    `;

        // Agregar evento de click
        button.addEventListener('click', async () => {
            try {
                if (plan === 'free') {
                    // Redirigir a registro gratuito
                    window.location.href = '/register';
                    return;
                }

                // Verificar autenticación
                if (!window.deaAuth?.manager?.isUserAuthenticated()) {
                    // Guardar plan seleccionado y redirigir a login
                    localStorage.setItem('selectedPlan', plan);
                    await window.deaAuth.manager.loginWithRedirect();
                    return;
                }

                // Obtener datos del usuario
                const user = await window.deaAuth.manager.getUser();

                // Crear sesión de checkout
                await this.createCheckoutSession(product.priceId, user.sub, user.email);

            } catch (error) {
                console.error('Error en suscripción:', error);
                alert('Error procesando suscripción. Por favor, intenta nuevamente.');
            }
        });

        container.appendChild(button);
    }

    // 📊 VERIFICAR ESTADO DE SUSCRIPCIÓN
    async checkSubscriptionStatus() {
        try {
            const token = await this.getAuthToken();

            const response = await fetch('/api/user/subscription', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error verificando suscripción');
            }

            return await response.json();

        } catch (error) {
            console.error('Error verificando suscripción:', error);
            return { plan: 'free', status: 'inactive' };
        }
    }

    // 🔄 MANEJAR DESPUÉS DEL PAGO
    async handlePaymentSuccess(sessionId) {
        try {
            // Verificar sesión de pago
            const response = await fetch(`/api/stripe/verify-session/${sessionId}`, {
                headers: {
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                }
            });

            if (!response.ok) {
                throw new Error('Error verificando pago');
            }

            const session = await response.json();

            // Mostrar mensaje de éxito
            this.showSuccessMessage(session);

            // Actualizar UI
            await this.updateSubscriptionUI();

            // Redirigir al dashboard
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 3000);

        } catch (error) {
            console.error('Error procesando pago exitoso:', error);
        }
    }

    showSuccessMessage(session) {
        const message = document.createElement('div');
        message.className = 'payment-success';
        message.innerHTML = `
      <div class="success-content">
        <div class="success-icon">🎉</div>
        <h2>¡Pago Exitoso!</h2>
        <p>Tu suscripción ha sido activada correctamente.</p>
        <p>Recibirás un email de confirmación en breve.</p>
        <div class="success-actions">
          <button onclick="window.location.href='/dashboard'">Ir al Dashboard</button>
        </div>
      </div>
    `;

        document.body.appendChild(message);
    }

    async updateSubscriptionUI() {
        const subscription = await this.checkSubscriptionStatus();

        // Actualizar elementos de UI basados en suscripción
        const subscriptionElements = document.querySelectorAll('[data-subscription]');

        subscriptionElements.forEach(element => {
            const requiredPlan = element.dataset.subscription;
            const userPlan = subscription.plan;

            if (this.hasAccess(userPlan, requiredPlan)) {
                element.style.display = 'block';
                element.classList.remove('locked');
            } else {
                element.style.display = 'none';
                element.classList.add('locked');
            }
        });
    }

    hasAccess(userPlan, requiredPlan) {
        const planHierarchy = ['free', 'premium', 'pro', 'enterprise'];
        const userLevel = planHierarchy.indexOf(userPlan);
        const requiredLevel = planHierarchy.indexOf(requiredPlan);

        return userLevel >= requiredLevel;
    }
}

// Exportar instancia singleton
export const stripeManager = new StripeManager();

// Auto-inicializar cuando el DOM esté listo
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', async () => {
        try {
            await stripeManager.initialize();

            // Manejar éxito de pago si estamos en la página de éxito
            const urlParams = new URLSearchParams(window.location.search);
            const sessionId = urlParams.get('session_id');

            if (sessionId) {
                await stripeManager.handlePaymentSuccess(sessionId);
            }

            // Verificar plan seleccionado después del login
            const selectedPlan = localStorage.getItem('selectedPlan');
            if (selectedPlan && window.deaAuth?.manager?.isUserAuthenticated()) {
                localStorage.removeItem('selectedPlan');
                const user = await window.deaAuth.manager.getUser();
                const product = stripeProducts[selectedPlan];

                if (product && product.priceId) {
                    await stripeManager.createCheckoutSession(product.priceId, user.sub, user.email);
                }
            }

        } catch (error) {
            console.warn('Stripe initialization failed:', error);
        }
    });
}