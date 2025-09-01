// PostgreSQL Configuration for Digital English Academy
export const postgresConfig = {
    development: {
        user: process.env.PG_USER || 'postgres',
        host: process.env.PG_HOST || 'localhost',
        database: process.env.PG_DATABASE || 'fluentleap_db',
        password: process.env.PG_PASSWORD || 'password',
        port: parseInt(process.env.PG_PORT) || 5432,
        ssl: process.env.PG_HOST && process.env.PG_HOST.includes('rds.amazonaws.com') ? { rejectUnauthorized: false } : false,
    },
    staging: {
        user: process.env.PG_USER || 'postgres',
        host: process.env.PG_HOST || 'localhost',
        database: process.env.PG_DATABASE || 'fluentleap_db',
        password: process.env.PG_PASSWORD || 'password',
        port: parseInt(process.env.PG_PORT) || 5432,
        ssl: process.env.PG_HOST && process.env.PG_HOST.includes('rds.amazonaws.com') ? { rejectUnauthorized: false } : false,
    },
    production: {
        user: process.env.PG_USER,
        host: process.env.PG_HOST,
        database: process.env.PG_DATABASE,
        password: process.env.PG_PASSWORD,
        port: parseInt(process.env.PG_PORT) || 5432,
        ssl: { rejectUnauthorized: false },
    }
};

// Tables schema
export const tables = {
    users: "users",
    courses: "courses",
    lessons: "lessons",
    progress: "user_progress",
    threads: "community_threads",
    messages: "community_messages",
    subscriptions: "user_subscriptions",
    payments: "payment_history"
};