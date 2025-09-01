import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['https://denglishacademy.com', 'https://www.denglishacademy.com', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Digital English Academy API',
        version: '1.0.0'
    });
});

// AI Chat fallback endpoint
app.post('/api/ai/chat', (req, res) => {
    const { messages } = req.body;

    // Simulate processing delay
    setTimeout(() => {
        const fallbackResponses = [
            'Hola! Estoy aquí para ayudarte con tu aprendizaje de inglés.',
            '¿En qué puedo ayudarte hoy?',
            '¿Tienes alguna pregunta sobre gramática o vocabulario?',
            'Te recomiendo practicar más con nuestras lecciones.',
            '¡Excelente pregunta! Sigue practicando.',
            'El inglés se aprende con práctica constante. ¡Sigue así!',
            'Recuerda que cada error es una oportunidad de aprender.',
            '¿Te gustaría que te recomiende algunos ejercicios?'
        ];

        const response = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

        res.json({
            content: response,
            timestamp: new Date().toISOString(),
            fallback: true
        });
    }, 500);
});

// Image generation fallback
app.post('/api/ai/images', (req, res) => {
    const { prompt } = req.body;

    // Return Unsplash placeholder images
    const placeholderImages = [
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop&q=80',
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=450&fit=crop&q=80',
        'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=450&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop&q=80',
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop&q=80',
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=450&fit=crop&q=80'
    ];

    const randomImage = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];

    res.json({
        url: randomImage,
        prompt: prompt,
        fallback: true
    });
});

// User profile endpoints
app.get('/api/users/profile', (req, res) => {
    // Mock user profile
    res.json({
        id: 'user_123',
        name: 'Usuario Demo',
        email: 'demo@denglishacademy.com',
        level: 'Intermedio',
        progress: 65,
        courses_completed: 3,
        lessons_completed: 24
    });
});

app.put('/api/users/profile', (req, res) => {
    const updates = req.body;
    res.json({
        success: true,
        message: 'Perfil actualizado correctamente',
        data: updates
    });
});

// Progress tracking
app.post('/api/users/progress', (req, res) => {
    const { lesson_id, score, time_spent } = req.body;

    res.json({
        success: true,
        message: 'Progreso guardado',
        data: {
            lesson_id,
            score,
            time_spent,
            timestamp: new Date().toISOString()
        }
    });
});

app.get('/api/users/progress', (req, res) => {
    // Mock progress data
    res.json({
        total_lessons: 50,
        completed_lessons: 24,
        total_time: 1440, // minutes
        average_score: 85,
        streak_days: 7,
        achievements: [
            'First Lesson Complete',
            'Week Streak',
            'Grammar Master'
        ]
    });
});

// Courses endpoints
app.get('/api/courses', (req, res) => {
    // Mock courses data
    res.json([
        {
            id: 1,
            title: 'English Basics',
            level: 'Básico',
            type: 'Gramática',
            lessons: 12,
            duration: '2 horas',
            premium: false
        },
        {
            id: 2,
            title: 'Business English',
            level: 'Intermedio',
            type: 'Conversación',
            lessons: 15,
            duration: '3 horas',
            premium: true
        },
        {
            id: 3,
            title: 'Advanced Grammar',
            level: 'Avanzado',
            type: 'Gramática',
            lessons: 20,
            duration: '4 horas',
            premium: true
        }
    ]);
});

app.get('/api/courses/:id', (req, res) => {
    const { id } = req.params;

    // Mock course details
    res.json({
        id: parseInt(id),
        title: 'English Basics',
        description: 'Aprende los fundamentos del inglés con lecciones interactivas.',
        level: 'Básico',
        type: 'Gramática',
        lessons: [
            { id: 1, title: 'Present Simple', duration: '10 min', completed: true },
            { id: 2, title: 'Present Continuous', duration: '12 min', completed: true },
            { id: 3, title: 'Past Simple', duration: '15 min', completed: false }
        ],
        instructor: 'Prof. Sarah Johnson',
        rating: 4.8,
        students: 1250
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        path: req.path
    });
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname)));

// Catch all handler for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Digital English Academy API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

