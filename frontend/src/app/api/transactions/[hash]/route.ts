import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

// GET /api/transactions/[hash] - Get transaction by hash
export async function GET(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  try {
    const transaction = await DatabaseService.getTransactionByHash(params.hash);
    
    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}

// PUT /api/transactions/[hash] - Update transaction root hash
export async function PUT(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  try {
    const body = await request.json();
    const { rootHash } = body;

    if (!rootHash) {
      return NextResponse.json(
        { success: false, error: 'Root hash is required' },
        { status: 400 }
      );
    }

    const transaction = await DatabaseService.updateRootHash(params.hash, rootHash);
    
    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}
