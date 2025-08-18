const Fastify = require('fastify');
const fetch = require('node-fetch');
const Stripe = require('stripe');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;
const fastify = Fastify({ logger: true });

// Optional global JWT enforcement (similar to express-oauth2-jwt-bearer middleware)
// Set ENFORCE_AUTH=true to require a valid Auth0 JWT on most routes.
const ENFORCE_AUTH = process.env.ENFORCE_AUTH === 'true';

fastify.addHook('preHandler', async (request, reply) => {
    if (!ENFORCE_AUTH) return;

    // allow unauthenticated access to health and webhook endpoints
    const unauthPaths = ['/health', '/api/stripe/webhook'];
    const path = request.raw && request.raw.url ? request.raw.url.split('?')[0] : request.url;
    if (unauthPaths.includes(path)) return;

    const auth = request.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
        reply.code(401).send({ error: 'Missing or invalid Authorization header' });
        return;
    }
    const token = auth.slice(7);
    try {
        const decoded = await verifyAuth0Token(token);
        // attach the decoded token to the request for handlers
        request.user = decoded;
    } catch (err) {
        request.log.warn(err, 'Auth verification failed (global preHandler)');
        reply.code(401).send({ error: 'Unauthorized' });
    }
});

// Auth0 JWKS client setup (expects AUTH0_DOMAIN env var)
const auth0Domain = process.env.AUTH0_DOMAIN; // e.g. 'your-tenant.us.auth0.com'
let jwks = null;
if (auth0Domain) {
    jwks = jwksClient({ jwksUri: `https://${auth0Domain}/.well-known/jwks.json` });
}

function getKey(header, callback) {
    if (!jwks) return callback(new Error('JWKS not configured'));
    jwks.getSigningKey(header.kid, function (err, key) {
        if (err) return callback(err);
        const signingKey = key.getPublicKey ? key.getPublicKey() : key.rsaPublicKey;
        callback(null, signingKey);
    });
}

async function verifyAuth0Token(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, getKey, { algorithms: ['RS256'], audience: process.env.AUTH0_AUDIENCE, issuer: process.env.AUTH0_ISSUER }, (err, decoded) => {
            if (err) return reject(err);
            resolve(decoded);
        });
    });
}

// Add a content type parser to capture raw body for Stripe webhook signature verification
fastify.addContentTypeParser('application/json', { parseAs: 'buffer' }, function (req, body, done) {
    // body is a Buffer
    req.rawBody = body;
    try {
        const json = JSON.parse(body.toString('utf8'));
        done(null, json);
    } catch (err) {
        done(err, undefined);
    }
});

fastify.get('/api/courses', async (request, reply) => {
    const res = await pool.query('SELECT id, level, type, title, img, blurb FROM courses ORDER BY id');
    reply.send(res.rows);
});

fastify.get('/api/threads', async (request, reply) => {
    const res = await pool.query('SELECT id, title, author, time FROM threads ORDER BY id');
    reply.send(res.rows);
});

fastify.get('/health', async () => ({ ok: true }));

// Create a PaymentIntent (Stripe)
fastify.post('/api/stripe/create-payment-intent', async (request, reply) => {
    if (!stripe) {
        reply.code(500).send({ error: 'Stripe not configured on server.' });
        return;
    }
    const { amount, currency = 'usd' } = request.body || {};
    if (!amount || amount <= 0) {
        reply.code(400).send({ error: 'Invalid amount' });
        return;
    }
    try {
        const intent = await stripe.paymentIntents.create({
            amount: Math.round(amount),
            currency,
        });
        reply.send({ clientSecret: intent.client_secret, id: intent.id });
    } catch (err) {
        request.log.error(err);
        reply.code(500).send({ error: 'Stripe error', details: err.message });
    }
});

// Simple Ollama proxy - forwards prompt to a local Ollama HTTP instance (assumes Ollama running at OLLAMA_URL)
fastify.post('/api/ollama/proxy', async (request, reply) => {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const { model = 'llama2', prompt } = request.body || {};
    if (!prompt) {
        reply.code(400).send({ error: 'Missing prompt' });
        return;
    }
    try {
        const res = await fetch(`${ollamaUrl}/v1/serve/${encodeURIComponent(model)}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        });
        const data = await res.json();
        reply.send(data);
    } catch (err) {
        request.log.error(err);
        reply.code(500).send({ error: 'Ollama proxy error', details: err.message });
    }
});

// Stripe webhook endpoint (verify signature)
fastify.post('/api/stripe/webhook', async (request, reply) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        request.log.warn('Stripe webhook secret not configured');
        // Still attempt to parse if no secret
        reply.code(400).send({ error: 'Webhook secret not configured' });
        return;
    }
    const sig = request.headers['stripe-signature'];
    const raw = request.rawBody ? request.rawBody.toString('utf8') : '';
    try {
        const event = stripe.webhooks.constructEvent(Buffer.from(raw), sig, webhookSecret);
        // handle event types you care about
        request.log.info({ event: event.type }, 'Received Stripe event');
        // handle payment_intent.succeeded -> persist order
        if (event.type === 'payment_intent.succeeded') {
            const pi = event.data.object;
            request.log.info({ id: pi.id }, 'PaymentIntent succeeded');
            try {
                const amount = pi.amount_received || pi.amount || 0;
                const currency = pi.currency || 'usd';
                const email = (pi.charges && pi.charges.data && pi.charges.data[0] && pi.charges.data[0].billing_details && pi.charges.data[0].billing_details.email) || null;
                const metadata = pi.metadata || {};
                await pool.query(
                    `INSERT INTO orders (payment_intent_id, amount, currency, status, customer_email, metadata) VALUES ($1,$2,$3,$4,$5,$6)
                     ON CONFLICT (payment_intent_id) DO UPDATE SET status=EXCLUDED.status`,
                    [pi.id, amount, currency, 'succeeded', email, metadata]
                );
            } catch (dbErr) {
                request.log.error(dbErr, 'Failed to persist order');
            }
        }
        reply.send({ received: true });
    } catch (err) {
        request.log.error(err);
        reply.code(400).send({ error: 'Webhook signature verification failed' });
    }
});

const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();

// Protected endpoint to list orders (requires Authorization: Bearer <token>)
fastify.get('/api/orders', async (request, reply) => {
    const auth = request.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
        reply.code(401).send({ error: 'Missing or invalid Authorization header' });
        return;
    }
    const token = auth.slice(7);
    try {
        const decoded = await verifyAuth0Token(token);
        // Add RBAC or additional checks if needed
        const res = await pool.query('SELECT id, payment_intent_id, amount, currency, status, customer_email, metadata, created_at FROM orders ORDER BY created_at DESC');
        reply.send({ user: decoded, orders: res.rows });
    } catch (err) {
        request.log.warn(err, 'Auth verification failed');
        reply.code(401).send({ error: 'Unauthorized' });
    }
});
