import { NextRequest, NextResponse } from 'next/server';
import { storeTransactionInKV, getWalletFromTransaction } from '@/lib/KVStorage';

// POST /api/kv - Store transaction hash and wallet address in KV storage
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { transactionHash, walletAddress, action } = body;

        if (!transactionHash) {
            return NextResponse.json({
                success: false,
                error: 'Transaction hash is required'
            }, { status: 400 });
        }

        if (action === 'store') {
            if (!walletAddress) {
                return NextResponse.json({
                    success: false,
                    error: 'Wallet address is required for store action'
                }, { status: 400 });
            }

            console.log('Storing transaction in KV storage:', { transactionHash, walletAddress });

            const result = await storeTransactionInKV(transactionHash, walletAddress);

            return NextResponse.json({
                success: true,
                data: result,
                message: 'Transaction stored in KV storage successfully'
            });
        } else if (action === 'retrieve') {
            console.log('Retrieving wallet address from KV storage:', { transactionHash });

            const walletAddress = await getWalletFromTransaction(transactionHash);

            return NextResponse.json({
                success: true,
                data: { walletAddress },
                message: 'Wallet address retrieved from KV storage successfully'
            });
        } else {
            return NextResponse.json({
                success: false,
                error: 'Invalid action. Use "store" or "retrieve"'
            }, { status: 400 });
        }
    } catch (error) {
        console.error('KV operation error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}

// GET /api/kv?transactionHash=xxx - Retrieve wallet address from transaction hash
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const transactionHash = searchParams.get('transactionHash');

        if (!transactionHash) {
            return NextResponse.json({
                success: false,
                error: 'Transaction hash is required'
            }, { status: 400 });
        }

        console.log('Retrieving wallet address from KV storage:', { transactionHash });

        const walletAddress = await getWalletFromTransaction(transactionHash);

        return NextResponse.json({
            success: true,
            data: { walletAddress },
            message: 'Wallet address retrieved from KV storage successfully'
        });
    } catch (error) {
        console.error('KV retrieval error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}
