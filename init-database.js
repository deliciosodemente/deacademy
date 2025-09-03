import 'dotenv/config';
import { postgresManager } from './lib/postgresql-manager.js';

// Database schema initialization
const createTablesSQL = {
    users: `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            auth0_id VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255),
            picture TEXT,
            subscription_status VARCHAR(50) DEFAULT 'free',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `,
    courses: `
        CREATE TABLE IF NOT EXISTS courses (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            level VARCHAR(50),
            duration_minutes INTEGER,
            price_cents INTEGER,
            stripe_product_id VARCHAR(255),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `,
    lessons: `
        CREATE TABLE IF NOT EXISTS lessons (
            id SERIAL PRIMARY KEY,
            course_id INTEGER REFERENCES courses(id),
            title VARCHAR(255) NOT NULL,
            content TEXT,
            video_url TEXT,
            order_index INTEGER,
            duration_minutes INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `,
    user_progress: `
        CREATE TABLE IF NOT EXISTS user_progress (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            course_id INTEGER REFERENCES courses(id),
            lesson_id INTEGER REFERENCES lessons(id),
            completed BOOLEAN DEFAULT false,
            progress_percentage INTEGER DEFAULT 0,
            completed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `,
    user_subscriptions: `
        CREATE TABLE IF NOT EXISTS user_subscriptions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            stripe_subscription_id VARCHAR(255),
            stripe_customer_id VARCHAR(255),
            status VARCHAR(50),
            current_period_start TIMESTAMP,
            current_period_end TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `,
    payment_history: `
        CREATE TABLE IF NOT EXISTS payment_history (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            stripe_payment_intent_id VARCHAR(255),
            amount_cents INTEGER,
            currency VARCHAR(3) DEFAULT 'USD',
            status VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `
};

async function initializeDatabase() {
    try {
        console.log('🚀 Initializing database schema...');
        
        // Connect to database
        await postgresManager.initializeClient();
        console.log('✅ Connected to PostgreSQL');
        
        // Create tables
        for (const [tableName, sql] of Object.entries(createTablesSQL)) {
            console.log(`📋 Creating table: ${tableName}`);
            await postgresManager.query(sql);
            console.log(`✅ Table ${tableName} created successfully`);
        }
        
        // Insert sample data
        console.log('📊 Inserting sample data...');
        
        // Sample courses
        const sampleCourses = [
            {
                title: 'English Fundamentals',
                description: 'Master the basics of English grammar and vocabulary',
                level: 'beginner',
                duration_minutes: 120,
                price_cents: 2999
            },
            {
                title: 'Business English',
                description: 'Professional English for the workplace',
                level: 'intermediate',
                duration_minutes: 180,
                price_cents: 4999
            },
            {
                title: 'Advanced Conversation',
                description: 'Fluent conversation skills and advanced topics',
                level: 'advanced',
                duration_minutes: 240,
                price_cents: 7999
            }
        ];
        
        for (const course of sampleCourses) {
            await postgresManager.query(
                `INSERT INTO courses (title, description, level, duration_minutes, price_cents) 
                 VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
                [course.title, course.description, course.level, course.duration_minutes, course.price_cents]
            );
        }
        
        console.log('✅ Sample data inserted successfully');
        console.log('🎉 Database initialization completed!');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    } finally {
        await postgresManager.disconnect();
        console.log('🔌 Disconnected from PostgreSQL');
    }
}

// Run initialization
initializeDatabase().catch(console.error);