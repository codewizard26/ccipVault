'use client';

import React, { useState } from 'react';
import { Database, Search, Loader2, CheckCircle, AlertCircle, Copy, Home } from 'lucide-react';
import Link from 'next/link';

interface ApiResponse {
    success: boolean;
    data?: any;
    error?: string;
    message?: string;
}

export default function KVStorageInterface() {
    const [transactionHash, setTransactionHash] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [retrievedWallet, setRetrievedWallet] = useState('');
    const [lastOperationHash, setLastOperationHash] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const clearMessages = () => {
        setError('');
        setSuccess('');
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setSuccess('Copied to clipboard!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to copy to clipboard');
        }
    };

    const storeInKV = async () => {
        if (!transactionHash.trim() || !walletAddress.trim()) {
            setError('Please enter both transaction hash and wallet address');
            return;
        }

        clearMessages();
        setLoading(true);

        try {
            const response = await fetch('/api/kv', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'store',
                    transactionHash: transactionHash.trim(),
                    walletAddress: walletAddress.trim()
                }),
            });

            const result: ApiResponse = await response.json();

            if (result.success) {
                const txHash = result.data?.txHash || 'N/A';
                setLastOperationHash(txHash);
                setSuccess(`Transaction hash and wallet address stored in KV storage successfully! TX: ${txHash.slice(0, 8)}...${txHash.slice(-8)}`);
                setTransactionHash('');
                setWalletAddress('');
            } else {
                setError(result.error || 'Failed to store in KV storage');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const retrieveFromKV = async () => {
        if (!transactionHash.trim()) {
            setError('Please enter a transaction hash');
            return;
        }

        clearMessages();
        setLoading(true);

        try {
            const response = await fetch(`/api/kv?transactionHash=${encodeURIComponent(transactionHash.trim())}`);
            const result: ApiResponse = await response.json();

            if (result.success && result.data?.walletAddress) {
                setRetrievedWallet(result.data.walletAddress);
                setSuccess('Wallet address retrieved from KV storage successfully!');
            } else {
                setError(result.error || 'Failed to retrieve from KV storage');
                setRetrievedWallet('');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
            setRetrievedWallet('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                    <Link href="/" className="text-blue-600 hover:text-blue-800 transition-colors">
                        <Home className="h-8 w-8" />
                    </Link>
                    <h1 className="text-4xl font-bold text-gray-900">0G KV Storage Interface</h1>
                </div>
                <p className="text-gray-600 text-lg">Store and retrieve transaction hash to wallet address mappings using 0G KV storage</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Connected to 0G Testnet</span>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <span className="text-red-700">{error}</span>
                    <button
                        onClick={clearMessages}
                        className="ml-auto text-red-600 hover:text-red-800"
                    >
                        ×
                    </button>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-green-700">{success}</span>
                    <button
                        onClick={clearMessages}
                        className="ml-auto text-green-600 hover:text-green-800"
                    >
                        ×
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Store Section */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                        <Database className="h-6 w-6 text-blue-600" />
                        <h2 className="text-2xl font-semibold text-gray-900">Store in KV</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Hash</label>
                            <input
                                type="text"
                                value={transactionHash}
                                onChange={(e) => setTransactionHash(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-sm"
                                placeholder="Enter transaction hash..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Address</label>
                            <input
                                type="text"
                                value={walletAddress}
                                onChange={(e) => setWalletAddress(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-sm"
                                placeholder="Enter wallet address..."
                            />
                        </div>

                        <button
                            onClick={storeInKV}
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Database className="h-5 w-5" />}
                            {loading ? 'Storing in KV...' : 'Store in KV Storage'}
                        </button>
                    </div>
                </div>

                {/* Retrieve Section */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                        <Search className="h-6 w-6 text-green-600" />
                        <h2 className="text-2xl font-semibold text-gray-900">Retrieve from KV</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Hash</label>
                            <input
                                type="text"
                                value={transactionHash}
                                onChange={(e) => setTransactionHash(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors font-mono text-sm"
                                placeholder="Enter transaction hash to lookup..."
                            />
                        </div>

                        <button
                            onClick={retrieveFromKV}
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                            {loading ? 'Retrieving...' : 'Retrieve Wallet Address'}
                        </button>

                        {/* Retrieved Result */}
                        {retrievedWallet && (
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                                <h3 className="text-sm font-medium text-gray-600 mb-2">Retrieved Wallet Address:</h3>
                                <div className="flex items-center gap-2 bg-white p-3 rounded-lg border">
                                    <code className="flex-1 text-sm break-all font-mono text-gray-800">{retrievedWallet}</code>
                                    <button
                                        onClick={() => copyToClipboard(retrievedWallet)}
                                        className="p-2 text-gray-600 hover:text-gray-900 transition-colors hover:bg-gray-100 rounded"
                                        title="Copy wallet address"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Last Operation Hash */}
                        {lastOperationHash && (
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                                <h3 className="text-sm font-medium text-gray-600 mb-2">Last Operation Transaction Hash:</h3>
                                <div className="flex items-center gap-2 bg-white p-3 rounded-lg border">
                                    <code className="flex-1 text-sm break-all font-mono text-gray-800">{lastOperationHash}</code>
                                    <button
                                        onClick={() => copyToClipboard(lastOperationHash)}
                                        className="p-2 text-gray-600 hover:text-gray-900 transition-colors hover:bg-gray-100 rounded"
                                        title="Copy transaction hash"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    How it Works
                </h3>
                <div className="space-y-3 text-gray-700">
                    <p>
                        <strong>Store:</strong> Upload a transaction hash and wallet address pair to 0G KV storage.
                        This creates a permanent, decentralized mapping that can be retrieved later.
                    </p>
                    <p>
                        <strong>Retrieve:</strong> Enter a transaction hash to look up the associated wallet address
                        from the 0G KV storage network.
                    </p>
                    <p>
                        <strong>Integration:</strong> When transactions are confirmed in the vault interface,
                        they are automatically stored in KV storage with the user's wallet address.
                    </p>
                    <p>
                        <strong>History Tab:</strong> Visit the History tab to see all transactions and use the
                        "Fetch Data" button to download complete transaction data from 0G storage.
                    </p>
                </div>
            </div>
        </div>
    );
}
