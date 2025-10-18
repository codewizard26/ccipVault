import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { storeProposalInKV } from '@/lib/KVStorage';

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, description, threshold, expires_at, proposer } = body;

        // Validate required fields
        if (!title || !description || !threshold || !expires_at || !proposer) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // First, save to Neon DB to get the proposal ID
        const query = `
      INSERT INTO Proposal (title, description, threshold, vote_count, root_hash, status, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING proposalid, created_at
    `;

        const values = [
            title,
            description,
            threshold,
            0, // vote_count starts at 0
            '', // root_hash will be updated after KV storage
            'pending',
            expires_at,
        ];

        const result = await pool.query(query, values);
        const proposal = result.rows[0];
        const proposalId = proposal.proposalid.toString();

        // Prepare data for KV storage
        const storageData = {
            proposalid: proposalId,
            title,
            description,
            threshold,
            expires_at,
            proposer,
            created_at: proposal.created_at,
        };

        // Upload to 0G storage
        const kvResult = await storeProposalInKV(proposalId, storageData);

        // Update the proposal with the root hash
        const updateQuery = `
      UPDATE Proposal 
      SET root_hash = $1 
      WHERE proposalid = $2
    `;

        await pool.query(updateQuery, [kvResult.rootHash, proposalId]);

        return NextResponse.json({
            success: true,
            proposal: {
                proposalid: proposalId,
                title,
                description,
                threshold,
                vote_count: 0,
                root_hash: kvResult.rootHash,
                status: 'pending',
                created_at: proposal.created_at,
                expires_at,
            },
        });
    } catch (error) {
        console.error('Proposal creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create proposal' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const query = `
      SELECT proposalid, title, description, threshold, vote_count, root_hash, status, created_at, expires_at
      FROM Proposal
      ORDER BY created_at DESC
    `;

        const result = await pool.query(query);
        const proposals = result.rows;

        return NextResponse.json({
            success: true,
            proposals,
        });
    } catch (error) {
        console.error('Failed to fetch proposals:', error);
        return NextResponse.json(
            { error: 'Failed to fetch proposals' },
            { status: 500 }
        );
    }
}
