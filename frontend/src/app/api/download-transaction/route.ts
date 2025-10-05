import { NextRequest, NextResponse } from 'next/server';
import { downloadJsonData } from '@/lib/UploadDataToStorage';

// GET /api/download-transaction?rootHash=xxx - Download transaction data from 0G storage
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const rootHash = searchParams.get('rootHash');

        if (!rootHash) {
            return NextResponse.json({
                success: false,
                error: 'Root hash is required'
            }, { status: 400 });
        }

        console.log('Downloading transaction data from 0G storage:', { rootHash });

        const transactionData = await downloadJsonData(rootHash, `transaction-${rootHash}.json`);

        console.log('Transaction data downloaded from 0G storage successfully');

        return NextResponse.json({
            success: true,
            data: transactionData,
            message: 'Transaction data downloaded from 0G storage successfully'
        });
    } catch (error) {
        console.error('Transaction download error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}
