"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Plus, Vote, Clock, Users, CheckCircle, XCircle, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreateProposalModal } from "@/components/CreateProposalModal";
import { Proposal } from "@/types/proposals";

export default function ProposalsPage() {
    const { address, isConnected } = useAccount();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch proposals from API
    useEffect(() => {
        const fetchProposals = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/proposals');
                if (!response.ok) {
                    throw new Error('Failed to fetch proposals');
                }
                const result = await response.json();
                setProposals(result.proposals || []);
            } catch (error) {
                console.error('Error fetching proposals:', error);
                setError('Failed to load proposals');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProposals();
    }, []);

    const getStatusColor = (status: Proposal['status']) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'active':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'passed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'failed':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'executed':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: Proposal['status']) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4" />;
            case 'active':
                return <Clock className="w-4 h-4" />;
            case 'passed':
                return <CheckCircle className="w-4 h-4" />;
            case 'failed':
                return <XCircle className="w-4 h-4" />;
            case 'executed':
                return <CheckCircle className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    const handleViewProposal = async (proposalId: number) => {
        try {
            const response = await fetch(`/api/proposals/${proposalId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch proposal details');
            }
            const result = await response.json();

            // Open proposal details in a new window or modal
            const proposalData = result.proposal;
            const storageData = proposalData.storage_data;

            if (storageData) {
                // Create a downloadable JSON file
                const dataStr = JSON.stringify(storageData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `proposal-${proposalId}-data.json`;
                link.click();
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Error viewing proposal:', error);
        }
    };

    const formatTimeRemaining = (endTime: string) => {
        const now = new Date();
        const expiry = new Date(endTime);
        const diff = expiry.getTime() - now.getTime();

        if (diff <= 0) return "Ended";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days}d ${hours}h left`;
        return `${hours}h left`;
    };

    const handleCreateProposal = async (proposalData: any) => {
        // Refresh the proposals list after creating a new one
        try {
            const response = await fetch('/api/proposals');
            if (response.ok) {
                const result = await response.json();
                setProposals(result.proposals || []);
            }
        } catch (error) {
            console.error('Error refreshing proposals:', error);
        }
        setIsCreateModalOpen(false);
    };

    if (!isConnected) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Vote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
                    <p className="text-gray-500">Please connect your wallet to view and create proposals.</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading proposals...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Proposals</h3>
                    <p className="text-gray-500">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">DAO Proposals</h1>
                    <p className="text-gray-600 mt-1">View and participate in community governance</p>
                </div>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Proposal
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
                        <Vote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {proposals.filter(p => p.status === 'active').length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{proposals.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Passed Proposals</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {proposals.filter(p => p.status === 'passed').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Proposals List */}
            <div className="space-y-4">
                {proposals.map((proposal) => (
                    <Card key={proposal.proposalid} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <CardTitle className="text-lg">#{proposal.proposalid} - {proposal.title}</CardTitle>
                                        <Badge className={getStatusColor(proposal.status)}>
                                            <div className="flex items-center gap-1">
                                                {getStatusIcon(proposal.status)}
                                                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                                            </div>
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-sm text-gray-600 mb-3">
                                        {proposal.description}
                                    </CardDescription>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span>Created: {new Date(proposal.created_at).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>{formatTimeRemaining(proposal.expires_at)}</span>
                                        <span>•</span>
                                        <span>Root Hash: {proposal.root_hash.substring(0, 10)}...</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewProposal(proposal.proposalid)}
                                        className="flex items-center gap-2"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewProposal(proposal.proposalid)}
                                        className="flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Voting Progress</span>
                                    <span className="font-medium">
                                        {proposal.vote_count} / {proposal.threshold} votes
                                    </span>
                                </div>
                                <Progress
                                    value={(proposal.vote_count / proposal.threshold) * 100}
                                    className="h-2"
                                />
                                <div className="flex items-center justify-between text-sm text-gray-500">
                                    <span>Threshold: {proposal.threshold.toLocaleString()} votes</span>
                                    <span>
                                        {proposal.vote_count >= proposal.threshold ? "✅ Quorum reached" : "⏳ Pending quorum"}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Create Proposal Modal */}
            <CreateProposalModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreateProposal={handleCreateProposal}
                userAddress={address}
            />
        </div>
    );
}
