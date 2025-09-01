const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/ai', require('./src/routes/ai'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/courses', require('./src/routes/courses'));
app.use('/api/stripe', require('./src/routes/stripe'));
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/video', require('./src/routes/video'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Digital English Academy API',
    version: '1.0.0'
  });
});

// Not found handler
app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found', path: req.path });
});

module.exports = app;