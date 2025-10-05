// API utility functions for client-side requests to server-side API routes

export interface TransactionData {
    transactionType: 'deposit' | 'withdraw';
    transactionHash: string;
    amount: string;
    rootHash?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// Store a transaction in the database
export async function storeTransaction(data: TransactionData): Promise<ApiResponse<any>> {
    try {
        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to store transaction');
        }

        return result;
    } catch (error) {
        console.error('Error storing transaction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Get all transactions from the database
export async function getTransactions(type?: 'deposit' | 'withdraw'): Promise<ApiResponse<any[]>> {
    try {
        const url = type ? `/api/transactions?type=${type}` : '/api/transactions';
        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch transactions');
        }

        return result;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Update transaction root hash
export async function updateTransactionRootHash(
    transactionHash: string,
    rootHash: string
): Promise<ApiResponse<any>> {
    try {
        const response = await fetch(`/api/transactions/${transactionHash}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rootHash }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to update transaction');
        }

        return result;
    } catch (error) {
        console.error('Error updating transaction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Get transaction by hash
export async function getTransactionByHash(transactionHash: string): Promise<ApiResponse<any>> {
    try {
        const response = await fetch(`/api/transactions/${transactionHash}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch transaction');
        }

        return result;
    } catch (error) {
        console.error('Error fetching transaction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Check database health
export async function checkDatabaseHealth(): Promise<ApiResponse<any>> {
    try {
        const response = await fetch('/api/database/health');
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Database health check failed');
        }

        return result;
    } catch (error) {
        console.error('Error checking database health:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
