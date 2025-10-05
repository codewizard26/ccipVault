import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

// GET /api/transactions/[hash] - Get transaction by hash
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await context.params;
    const transaction = await DatabaseService.getTransactionByHash(hash);

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
  context: { params: Promise<{ hash: string }> }
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

    const { hash } = await context.params;
    const transaction = await DatabaseService.updateRootHash(hash, rootHash);

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
