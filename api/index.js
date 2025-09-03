import 'dotenv/config';
import express from 'express';
const app = express();
const port = process.env.PORT || 8000;

// Initialize PostgreSQL connection
import { postgresManager } from '../lib/postgresql-manager.js';

// Middleware
app.use(express.json());

// API Routes
import stripeRoutes from './src/modules/stripe/stripe.routes.js';
import authRoutes from './src/modules/auth/auth.routes.js';
import usersRoutes from './src/modules/users/users.routes.js';
import coursesRoutes from './src/modules/courses/courses.routes.js';
import videoRoutes from './src/modules/video/video.routes.js';
import aiRoutes from './src/modules/ai/ai.routes.js';

app.use('/api/stripe', stripeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/ai', aiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.send('FluentLeap API is running');
});

// Start server
app.listen(port, async () => {
  console.log(`Server listening at http://localhost:${port}`);
  
  // Initialize database connection
  try {
    await postgresManager.initializeClient();
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
});