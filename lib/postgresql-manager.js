import { Pool } from 'pg';
import { postgresConfig } from '../config/database.js';

class PostgreSQLManager {
    constructor() {
        this.pool = null;
        this.isConnected = false;
    }

    async initializeClient(environment = 'development') {
        try {
            const config = postgresConfig[environment];
            if (!config) {
                throw new Error(`No configuration found for environment: ${environment}`);
            }

            this.pool = new Pool(config);
            const client = await this.pool.connect();
            this.isConnected = true;
            console.log(`✅ Connected to PostgreSQL: ${client.database}`);
            client.release();
            return this.pool;
        } catch (error) {
            console.error('❌ PostgreSQL connection failed:', error);
            throw error;
        }
    }

    async query(text, params) {
        if (!this.isConnected) throw new Error('Database not connected');
        const start = Date.now();
        const res = await this.pool.query(text, params);
        const duration = Date.now() - start;
        console.log('executed query', { text, duration, rows: res.rowCount });
        return res;
    }

    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            this.isConnected = false;
            console.log('🔌 Disconnected from PostgreSQL');
        }
    }
}

const postgresqlManager = new PostgreSQLManager();

export { PostgreSQLManager };
export const postgresManager = new PostgreSQLManager();