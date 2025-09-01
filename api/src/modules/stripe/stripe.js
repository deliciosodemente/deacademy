/**
 * Stripe Backend Controller for Digital English Academy
 * Handles subscriptions, payments, and webhooks
 */
import Stripe from 'stripe';
import { postgresManager } from '../../../../lib/postgresql-manager.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
import SUBSCRIPTION_PRODUCTS from '../../config/stripe-products.js';

const healthCheck = (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
};

const getProducts = (req, res) => {
    const products = Object.entries(SUBSCRIPTION_PRODUCTS).map(([id, product]) => ({
        id,
        ...product
    }));
    res.json({ products });
};

const createSubscription = async (req, res) => {
    try {
        const { priceId, trialDays = 7 } = req.body;
        const { userId, userEmail } = req;

        let customer;
        const existingCustomers = await stripe.customers.list({ email: userEmail, limit: 1 });

        if (existingCustomers.data.length > 0) {
            customer = existingCustomers.data[0];
        } else {
            customer = await stripe.customers.create({
                email: userEmail,
                metadata: { auth0_user_id: userId }
            });
            await postgresManager.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customer.id, userId]);
        }

        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: priceId }],
            trial_period_days: trialDays,
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
            metadata: { auth0_user_id: userId }
        });

        res.json({
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice.payment_intent.client_secret,
            customerId: customer.id
        });
    } catch (error) {
        console.error('Subscription creation error:', error);
        res.status(400).json({ error: error.message });
    }
};

const createPayment = async (req, res) => {
    try {
        const { amount, currency = 'usd', description } = req.body;
        const { userId, userEmail } = req;

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            description,
            metadata: { auth0_user_id: userId, user_email: userEmail }
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Payment creation error:', error);
        res.status(400).json({ error: error.message });
    }
};

const getSubscriptionStatus = async (req, res) => {
    try {
        const { userId } = req;
        const customers = await stripe.customers.list({ limit: 100 });
        const customer = customers.data.find(c => c.metadata.auth0_user_id === userId);

        if (!customer) {
            return res.json({ plan: 'free', status: 'active' });
        }

        const subscriptions = await stripe.subscriptions.list({ customer: customer.id, status: 'active', limit: 1 });

        if (subscriptions.data.length === 0) {
            return res.json({ plan: 'free', status: 'active' });
        }

        const subscription = subscriptions.data[0];
        const priceId = subscription.items.data[0].price.id;

        let plan = 'free';
        for (const [planId, product] of Object.entries(SUBSCRIPTION_PRODUCTS)) {
            if (Object.values(product.prices).includes(priceId)) {
                plan = planId;
                break;
            }
        }

        res.json({
            plan,
            status: subscription.status,
            subscriptionId: subscription.id,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            trialEnd: subscription.trial_end
        });
    } catch (error) {
        console.error('Subscription status error:', error);
        res.status(500).json({ error: 'Failed to get subscription status' });
    }
};

const changeSubscription = async (req, res) => {
    try {
        const { newPriceId } = req.body;
        const { userId } = req;

        const customers = await stripe.customers.list({ limit: 100 });
        const customer = customers.data.find(c => c.metadata.auth0_user_id === userId);

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const subscriptions = await stripe.subscriptions.list({ customer: customer.id, status: 'active', limit: 1 });

        if (subscriptions.data.length === 0) {
            return res.status(404).json({ error: 'No active subscription found' });
        }

        const subscription = subscriptions.data[0];
        const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
            items: [{ id: subscription.items.data[0].id, price: newPriceId }],
            proration_behavior: 'create_prorations'
        });

        res.json({ subscription: updatedSubscription, message: 'Subscription updated successfully' });
    } catch (error) {
        console.error('Subscription change error:', error);
        res.status(400).json({ error: error.message });
    }
};

const cancelSubscription = async (req, res) => {
    try {
        const { reason = '' } = req.body;
        const { userId } = req;

        const customers = await stripe.customers.list({ limit: 100 });
        const customer = customers.data.find(c => c.metadata.auth0_user_id === userId);

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const subscriptions = await stripe.subscriptions.list({ customer: customer.id, status: 'active', limit: 1 });

        if (subscriptions.data.length === 0) {
            return res.status(404).json({ error: 'No active subscription found' });
        }

        const subscription = subscriptions.data[0];
        const cancelledSubscription = await stripe.subscriptions.update(subscription.id, {
            cancel_at_period_end: true,
            metadata: { ...subscription.metadata, cancellation_reason: reason }
        });

        res.json({ subscription: cancelledSubscription, message: 'Subscription will be cancelled at the end of the current period' });
    } catch (error) {
        console.error('Subscription cancellation error:', error);
        res.status(400).json({ error: error.message });
    }
};

const createPortalSession = async (req, res) => {
    try {
        const { userId } = req;
        const customers = await stripe.customers.list({ limit: 100 });
        const customer = customers.data.find(c => c.metadata.auth0_user_id === userId);

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: customer.id,
            return_url: `${req.headers.origin}/account`
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Portal session error:', error);
        res.status(400).json({ error: error.message });
    }
};

const usage = new Map();
const trackUsage = async (req, res) => {
    try {
        const { feature, amount = 1 } = req.body;
        const { userId } = req;
        const today = new Date().toISOString().split('T')[0];
        const key = `${userId}:${feature}:${today}`;
        const current = usage.get(key) || 0;
        usage.set(key, current + amount);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getUsageStats = async (req, res) => {
    try {
        const { userId } = req;
        const today = new Date().toISOString().split('T')[0];
        const stats = {};
        for (const [key, value] of usage.entries()) {
            if (key.startsWith(`${userId}:`) && key.endsWith(`:${today}`)) {
                const feature = key.split(':')[1];
                stats[feature] = value;
            }
        }
        res.json(stats);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const webhook = (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    handleStripeEvent(event);
    res.json({ received: true });
};

async function handleStripeEvent(event) {
    const { type, data } = event;
    const session = data.object;

    switch (type) {
        case 'customer.subscription.created':
            await postgresManager.query('UPDATE users SET stripe_subscription_id = $1, subscription_status = $2 WHERE stripe_customer_id = $3', [session.id, session.status, session.customer]);
            break;
        case 'customer.subscription.updated':
            await postgresManager.query('UPDATE users SET subscription_status = $1 WHERE stripe_subscription_id = $2', [session.status, session.id]);
            break;
        case 'customer.subscription.deleted':
            await postgresManager.query('UPDATE users SET subscription_status = $1 WHERE stripe_subscription_id = $2', [session.status, session.id]);
            break;
        case 'invoice.payment_succeeded':
            await postgresManager.query('INSERT INTO payments (stripe_invoice_id, user_id, amount, currency, status) VALUES ($1, $2, $3, $4, $5)', [session.id, session.customer, session.amount_paid, session.currency, 'succeeded']);
            break;
        case 'invoice.payment_failed':
            await postgresManager.query('INSERT INTO payments (stripe_invoice_id, user_id, amount, currency, status) VALUES ($1, $2, $3, $4, $5)', [session.id, session.customer, session.amount_paid, session.currency, 'failed']);
            break;
        default:
            console.log(`Unhandled event type ${type}`);
    }
}

export {
    healthCheck,
    getProducts,
    createSubscription,
    createPayment,
    getSubscriptionStatus,
    changeSubscription,
    cancelSubscription,
    createPortalSession,
    trackUsage,
    getUsageStats,
    webhook
};