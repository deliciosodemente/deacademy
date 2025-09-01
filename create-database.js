import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function createDatabase() {
    // Connect to postgres database first
    const client = new Client({
        host: process.env.PG_HOST,
        port: process.env.PG_PORT || 5432,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: 'postgres', // Connect to default postgres database
        ssl: {
            rejectUnauthorized: false
        }
    });

    console.log('Connection config:', {
        host: process.env.PG_HOST,
        port: process.env.PG_PORT || 5432,
        user: process.env.PG_USER,
        database: 'postgres'
    });

    try {
        console.log('🔌 Connecting to PostgreSQL server...');
        await client.connect();
        console.log('✅ Connected to PostgreSQL server');

        // Check if database already exists
        const checkResult = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = 'fluentleap_db'"
        );

        if (checkResult.rows.length > 0) {
            console.log('ℹ️  Database fluentleap_db already exists');
        } else {
            // Create the database
            console.log('🏗️  Creating database fluentleap_db...');
            await client.query('CREATE DATABASE fluentleap_db');
            console.log('✅ Database fluentleap_db created successfully!');
        }

    } catch (error) {
        console.error('❌ Error creating database:');
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', error);
        process.exit(1);
    } finally {
        await client.end();
        console.log('🔌 Connection closed');
    }
}

// Run the function
createDatabase().catch(console.error);