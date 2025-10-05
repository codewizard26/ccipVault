import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { storeTransactionInKV } from '@/lib/KVStorage';
import { uploadTransactionData } from '@/lib/UploadDataToStorage';

// GET /api/transactions - Get all transactions
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') as 'deposit' | 'withdraw' | null;

        let transactions;
        if (type && (type === 'deposit' || type === 'withdraw')) {
            transactions = await DatabaseService.getTransactionsByType(type);
        } else {
            transactions = await DatabaseService.getTransactions();
        }

        return NextResponse.json({
            success: true,
            data: transactions
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch transactions' },
            { status: 500 }
        );
    }
}

// POST /api/transactions - Store a new transaction
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { transactionType, transactionHash, amount, rootHash, walletAddress } = body;

        // Debug logging
        console.log('Received transaction data:', {
            transactionType,
            transactionHash,
            amount,
            rootHash,
            body
        });

        // Validate required fields
        if (!transactionType || !transactionHash || amount === undefined || amount === null || amount === '' || !rootHash) {
            console.log('Validation failed:', {
                transactionType: !!transactionType,
                transactionHash: !!transactionHash,
                transactionHashValue: transactionHash,
                amount: amount,
                amountType: typeof amount,
                rootHash: !!rootHash,
                rootHashValue: rootHash
            });

            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields: transactionType, transactionHash, amount, and rootHash are all required',
                    received: { transactionType, transactionHash, amount, rootHash }
                },
                { status: 400 }
            );
        }

        // Validate transaction type
        if (transactionType !== 'deposit' && transactionType !== 'withdraw') {
            return NextResponse.json(
                { success: false, error: 'Invalid transaction type' },
                { status: 400 }
            );
        }

        const transaction = await DatabaseService.storeTransaction(
            transactionType,
            transactionHash,
            amount,
            rootHash || ''
        );

        // Store transaction hash and wallet address in KV storage if wallet address is provided
        if (walletAddress) {
            try {
                console.log('Storing transaction in KV storage:', { transactionHash, walletAddress });
                await storeTransactionInKV(transactionHash, walletAddress);
                console.log('Transaction stored in KV storage successfully');
            } catch (kvError) {
                console.error('Failed to store transaction in KV storage:', kvError);
                // Don't fail the entire request if KV storage fails
            }
        }

        // Automatically upload transaction data to 0G storage
        let storageRootHash = null;
        try {
            console.log('Uploading transaction data to 0G storage:', { transactionHash, walletAddress });
            const uploadResult = await uploadTransactionData({
                transactionType,
                transactionHash,
                amount: amount.toString(),
                walletAddress: walletAddress || '',
                timestamp: new Date().toISOString()
            });

            console.log('Transaction data uploaded to 0G storage successfully:', uploadResult);
            storageRootHash = uploadResult.rootHash;

            // Update the transaction with the 0G storage root hash
            if (uploadResult.rootHash) {
                try {
                    await DatabaseService.updateTransactionRootHash(transactionHash, uploadResult.rootHash);
                    console.log('Transaction updated with 0G storage root hash:', uploadResult.rootHash);
                } catch (updateError) {
                    console.error('Failed to update transaction with root hash:', updateError);
                }
            }
        } catch (uploadError) {
            console.error('Failed to upload transaction data to 0G storage:', uploadError);
            // Don't fail the entire request if 0G storage upload fails
        }

        return NextResponse.json({
            success: true,
            data: transaction,
            rootHash: storageRootHash
        });
    } catch (error) {
        console.error('Error storing transaction:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to store transaction' },
            { status: 500 }
        );
    }
}
