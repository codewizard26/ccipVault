export interface Proposal {
    proposalid: number;
    title: string;
    description: string;
    threshold: number;
    vote_count: number;
    root_hash: string;
    status: 'pending' | 'active' | 'passed' | 'failed' | 'executed';
    created_at: string;
    expires_at: string;
}

export interface CreateProposalData {
    title: string;
    description: string;
    threshold: number;
    expires_at: string;
}

export interface ProposalStorageData {
    title: string;
    description: string;
    threshold: number;
    expires_at: string;
    proposer: string;
    created_at: string;
}
