"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { X, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateProposalData } from "@/types/proposals";
import { CONTRACTS } from "@/config/contracts";
import REBASE_TOKEN_ABI from "@/contracts/RebaseToken.json";

interface CreateProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateProposal: (data: CreateProposalData) => void;
    userAddress?: `0x${string}`;
}

export function CreateProposalModal({
    isOpen,
    onClose,
    onCreateProposal,
    userAddress
}: CreateProposalModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [threshold, setThreshold] = useState(1000);
    const [expiresAt, setExpiresAt] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Read user's RBT balance to check if they have at least 1 token
    const { data: userRBTBalance } = useReadContract({
        address: CONTRACTS.REBASE_TOKEN as `0x${string}`,
        abi: REBASE_TOKEN_ABI.abi,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`],
        query: {
            enabled: !!userAddress,
        },
    });

    const hasMinimumTokens = userRBTBalance && Number(userRBTBalance) >= 1e18;
    const formattedBalance = userRBTBalance ? parseFloat(formatEther(userRBTBalance)).toFixed(4) : "0";

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!title.trim()) {
            newErrors.title = "Title is required";
        } else if (title.length < 10) {
            newErrors.title = "Title must be at least 10 characters long";
        }

        if (!description.trim()) {
            newErrors.description = "Description is required";
        } else if (description.length < 50) {
            newErrors.description = "Description must be at least 50 characters long";
        }

        if (!threshold || threshold < 1) {
            newErrors.threshold = "Threshold must be at least 1";
        }

        if (!expiresAt) {
            newErrors.expiresAt = "Expiry date is required";
        } else {
            const expiryDate = new Date(expiresAt);
            const now = new Date();
            if (expiryDate <= now) {
                newErrors.expiresAt = "Expiry date must be in the future";
            }
        }

        if (!hasMinimumTokens) {
            newErrors.tokens = "You need to have at least 1 RBT token locked to create a proposal";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/proposals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    threshold: threshold,
                    expires_at: expiresAt,
                    proposer: userAddress,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create proposal');
            }

            const result = await response.json();

            onCreateProposal({
                title: title.trim(),
                description: description.trim(),
                threshold: threshold,
                expires_at: expiresAt,
            });

            // Reset form
            setTitle("");
            setDescription("");
            setThreshold(1000);
            setExpiresAt("");
            setErrors({});
        } catch (error) {
            console.error("Error creating proposal:", error);
            setErrors({ submit: "Failed to create proposal. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setTitle("");
            setDescription("");
            setThreshold(1000);
            setExpiresAt("");
            setErrors({});
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 p-6">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-semibold">Create New Proposal</DialogTitle>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Token Requirement Check */}
                    <Card className={hasMinimumTokens ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                {hasMinimumTokens ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                )}
                                Token Requirement
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <CardDescription className="text-sm">
                                {hasMinimumTokens ? (
                                    <span className="text-green-700">
                                        ✅ You have {formattedBalance} RBT tokens. You can create a proposal.
                                    </span>
                                ) : (
                                    <span className="text-red-700">
                                        ❌ You need at least 1 RBT token locked in the pool to create a proposal.
                                        Current balance: {formattedBalance} RBT tokens.
                                    </span>
                                )}
                            </CardDescription>
                        </CardContent>
                    </Card>

                    {/* Proposal Details */}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                Proposal Title *
                            </label>
                            <Input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter a clear and concise title for your proposal"
                                className={errors.title ? "border-red-300 focus:border-red-500" : ""}
                                disabled={isSubmitting}
                            />
                            {errors.title && (
                                <p className="text-red-600 text-sm mt-1">{errors.title}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Proposal Description *
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Provide a detailed description of your proposal, including the rationale, implementation details, and expected outcomes..."
                                rows={6}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${errors.description ? "border-red-300 focus:border-red-500" : "border-gray-300"
                                    }`}
                                disabled={isSubmitting}
                            />
                            {errors.description && (
                                <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                            )}
                            <p className="text-gray-500 text-sm mt-1">
                                {description.length}/50 characters minimum
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 mb-2">
                                    Vote Threshold *
                                </label>
                                <Input
                                    id="threshold"
                                    type="number"
                                    value={threshold}
                                    onChange={(e) => setThreshold(Number(e.target.value))}
                                    placeholder="1000"
                                    min="1"
                                    className={errors.threshold ? "border-red-300 focus:border-red-500" : ""}
                                    disabled={isSubmitting}
                                />
                                {errors.threshold && (
                                    <p className="text-red-600 text-sm mt-1">{errors.threshold}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-2">
                                    Expiry Date *
                                </label>
                                <Input
                                    id="expiresAt"
                                    type="datetime-local"
                                    value={expiresAt}
                                    onChange={(e) => setExpiresAt(e.target.value)}
                                    className={errors.expiresAt ? "border-red-300 focus:border-red-500" : ""}
                                    disabled={isSubmitting}
                                />
                                {errors.expiresAt && (
                                    <p className="text-red-600 text-sm mt-1">{errors.expiresAt}</p>
                                )}
                            </div>
                        </div>

                        {/* Proposal Summary */}
                        <Card className="border-blue-200 bg-blue-50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm text-blue-800">Proposal Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Vote Threshold:</span>
                                        <span className="font-medium text-blue-800">{threshold.toLocaleString()} votes</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Expiry Date:</span>
                                        <span className="font-medium text-blue-800">
                                            {expiresAt ? new Date(expiresAt).toLocaleString() : 'Not set'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Storage:</span>
                                        <span className="font-medium text-blue-800">0G KV Storage</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Submit Error */}
                        {errors.submit && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-red-600 text-sm">{errors.submit}</p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !hasMinimumTokens}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Creating...
                                </>
                            ) : (
                                "Create Proposal"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
