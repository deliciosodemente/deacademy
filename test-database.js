import 'dotenv/config';
import { postgresManager } from './lib/postgresql-manager.js';

async function testDatabase() {
    try {
        console.log('🔍 Testing database connection and structure...');
        console.log('📊 Database config:', {
            host: process.env.PG_HOST,
            port: process.env.PG_PORT,
            database: process.env.PG_DATABASE,
            user: process.env.PG_USER
        });
        
        // Initialize connection
        await postgresManager.initializeClient();
        
        // Test basic query
        const result = await postgresManager.query('SELECT NOW() as current_time');
        console.log('✅ Database query successful:', result.rows[0]);
        
        // Check if tables exist
        const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `;
        
        const tables = await postgresManager.query(tablesQuery);
        console.log('📋 Available tables:');
        tables.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });
        
        // Test users table structure if it exists
        const usersTableQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position;
        `;
        
        const userColumns = await postgresManager.query(usersTableQuery);
        if (userColumns.rows.length > 0) {
            console.log('👤 Users table structure:');
            userColumns.rows.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
            });
        } else {
            console.log('⚠️  Users table not found');
        }
        
        console.log('✅ Database test completed successfully');
        
    } catch (error) {
        console.error('❌ Database test failed:', error.message);
    } finally {
        await postgresManager.disconnect();
    }
}

testDatabase();