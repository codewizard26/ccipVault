import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getProposalFromKV } from '@/lib/KVStorage';

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: proposalId } = await params;

        // Get proposal from Neon DB
        const query = `
      SELECT proposalid, title, description, threshold, vote_count, root_hash, status, created_at, expires_at
      FROM Proposal
      WHERE proposalid = $1
    `;

        const result = await pool.query(query, [proposalId]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Proposal not found' },
                { status: 404 }
            );
        }

        const proposal = result.rows[0];

        // Fetch detailed data from 0G storage using rootHash
        let storageData = null;
        try {
            storageData = await getProposalFromKV(proposal.root_hash);
        } catch (error) {
            console.warn('Failed to fetch from 0G storage:', error);
            // Continue without storage data if fetch fails
        }

        return NextResponse.json({
            success: true,
            proposal: {
                ...proposal,
                storage_data: storageData,
            },
        });
    } catch (error) {
        console.error('Failed to fetch proposal:', error);
        return NextResponse.json(
            { error: 'Failed to fetch proposal' },
            { status: 500 }
        );
    }
}
