const Fastify = require('fastify');
const fetch = require('node-fetch');
const Stripe = require('stripe');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;
const fastify = Fastify({ logger: true });

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

const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
