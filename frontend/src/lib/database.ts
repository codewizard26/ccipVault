import { Pool } from 'pg';

// Database connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export interface VaultTransaction {
    id: number;
    transaction_type: 'deposit' | 'withdraw';
    transaction_hash: string;
    amount: string;
    timestamp: Date;
    root_hash: string;
}

export class DatabaseService {
    // Store a transaction in the database
    static async storeTransaction(
        transactionType: 'deposit' | 'withdraw',
        transactionHash: string,
        amount: string,
        rootHash: string = ''
    ): Promise<VaultTransaction> {
        const client = await pool.connect();
        try {
            const query = `
        INSERT INTO vault_transactions (transaction_type, transaction_hash, amount, root_hash)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
            const values = [transactionType, transactionHash, amount, rootHash];

            const result = await client.query(query, values);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    // Get all transactions
    static async getTransactions(): Promise<VaultTransaction[]> {
        const client = await pool.connect();
        try {
            const query = `
        SELECT * FROM vault_transactions 
        ORDER BY timestamp DESC
      `;

            const result = await client.query(query);
            return result.rows;
        } finally {
            client.release();
        }
    }

    // Get transactions by type
    static async getTransactionsByType(transactionType: 'deposit' | 'withdraw'): Promise<VaultTransaction[]> {
        const client = await pool.connect();
        try {
            const query = `
        SELECT * FROM vault_transactions 
        WHERE transaction_type = $1
        ORDER BY timestamp DESC
      `;

            const result = await client.query(query, [transactionType]);
            return result.rows;
        } finally {
            client.release();
        }
    }

    // Update root hash for a transaction
    static async updateRootHash(transactionHash: string, rootHash: string): Promise<VaultTransaction | null> {
        const client = await pool.connect();
        try {
            const query = `
        UPDATE vault_transactions 
        SET root_hash = $1
        WHERE transaction_hash = $2
        RETURNING *
      `;

            const result = await client.query(query, [rootHash, transactionHash]);
            return result.rows[0] || null;
        } finally {
            client.release();
        }
    }

    // Get transaction by hash
    static async getTransactionByHash(transactionHash: string): Promise<VaultTransaction | null> {
        const client = await pool.connect();
        try {
            const query = `
        SELECT * FROM vault_transactions 
        WHERE transaction_hash = $1
      `;

            const result = await client.query(query, [transactionHash]);
            return result.rows[0] || null;
        } finally {
            client.release();
        }
    }

    // Update transaction root hash
    static async updateTransactionRootHash(transactionHash: string, rootHash: string): Promise<VaultTransaction | null> {
        const client = await pool.connect();
        try {
            const query = `
                UPDATE vault_transactions 
                SET root_hash = $1 
                WHERE transaction_hash = $2 
                RETURNING *
            `;
            const values = [rootHash, transactionHash];

            const result = await client.query(query, values);
            return result.rows[0] || null;
        } finally {
            client.release();
        }
    }

    // Test database connection
    static async testConnection(): Promise<boolean> {
        try {
            const client = await pool.connect();
            await client.query('SELECT 1');
            client.release();
            return true;
        } catch (error) {
            console.error('Database connection test failed:', error);
            return false;
        }
    }
}

export default pool;
