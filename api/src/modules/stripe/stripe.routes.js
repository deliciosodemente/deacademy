import express from 'express';
import * as stripeController from './stripe.js';
import { checkJwt } from '../../utils/auth.js';
const router = express.Router();

// Health check
router.get('/health', stripeController.healthCheck);

// Get subscription products
router.get('/products', stripeController.getProducts);

// Create subscription
router.post('/create-subscription', checkJwt, stripeController.createSubscription);

// Create one-time payment
router.post('/create-payment', checkJwt, stripeController.createPayment);

// Get subscription status
router.get('/subscription-status', checkJwt, stripeController.getSubscriptionStatus);

// Change subscription
router.post('/change-subscription', checkJwt, stripeController.changeSubscription);

// Cancel subscription
router.post('/cancel-subscription', checkJwt, stripeController.cancelSubscription);

// Create customer portal session
router.post('/create-portal-session', checkJwt, stripeController.createPortalSession);

// Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), stripeController.webhook);

export default router;