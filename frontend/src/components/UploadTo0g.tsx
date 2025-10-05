'use client';

import React, { useState } from 'react';
import { Upload, Download, FileText, Database, Loader2, CheckCircle, AlertCircle, Copy, Home } from 'lucide-react';
import Link from 'next/link';

interface UploadResult {
    rootHash: string;
    txHash: string;
    fileName?: string;
    size?: number;
    originalName?: string;
}

interface ApiResponse {
    success: boolean;
    result?: UploadResult;
    data?: any;
    error?: string;
}

export default function ZeroGUploader() {
    const [jsonData, setJsonData] = useState('{\n  "name": "John Doe",\n  "age": 30,\n  "city": "New York",\n  "preferences": {\n    "theme": "dark",\n    "notifications": true\n  }\n}');
    const [fileName, setFileName] = useState('my-data.json');
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
    const [downloadHash, setDownloadHash] = useState('');
    const [downloadedData, setDownloadedData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);

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

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const uploadJsonData = async () => {
        clearMessages();
        setLoading(true);

        try {
            const parsedData = JSON.parse(jsonData);

            const response = await fetch('/api/upload/json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: parsedData,
                    fileName: fileName
                }),
            });

            const result: ApiResponse = await response.json();
            console.log('Upload result:', result);

            if (result.success && result.result) {
                setUploadResult(result.result);
                const rootHash = result.result.rootHash;
                setSuccess(`JSON data uploaded successfully to 0G storage! Root Hash: ${rootHash.slice(0, 8)}...${rootHash.slice(-8)}`);
            } else {
                setError(result.error || 'Upload failed');
            }
        } catch (err) {
            if (err instanceof SyntaxError) {
                setError('Invalid JSON format. Please check your JSON data.');
            } else {
                setError(err instanceof Error ? err.message : 'Unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    const uploadFile = async () => {
        if (!selectedFile) {
            setError('Please select a file first');
            return;
        }

        clearMessages();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await fetch('/api/upload/file', {
                method: 'POST',
                body: formData,
            });

            const result: ApiResponse = await response.json();

            if (result.success && result.result) {
                setUploadResult(result.result);
                const rootHash = result.result.rootHash;
                setSuccess(`File uploaded successfully to 0G storage! Root Hash: ${rootHash.slice(0, 8)}...${rootHash.slice(-8)}`);
            } else {
                setError(result.error || 'Upload failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const downloadJsonData = async () => {
        if (!downloadHash.trim()) {
            setError('Please enter a root hash');
            return;
        }

        clearMessages();
        setLoading(true);

        try {
            const response = await fetch(`/api/download/json/${downloadHash}`);
            const result: ApiResponse = await response.json();

            if (result.success && result.data) {
                setDownloadedData(result.data);
                setSuccess(`JSON data downloaded successfully from 0G storage! Root Hash: ${downloadHash.slice(0, 8)}...${downloadHash.slice(-8)}`);
            } else {
                setError(result.error || 'Download failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const downloadFile = async () => {
        if (!downloadHash.trim()) {
            setError('Please enter a root hash');
            return;
        }

        clearMessages();
        setLoading(true);

        try {
            const response = await fetch(`/api/download/file/${downloadHash}`);

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `download-${Date.now()}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                setSuccess(`File downloaded successfully from 0G storage! Root Hash: ${downloadHash.slice(0, 8)}...${downloadHash.slice(-8)}`);
            } else {
                const errorResult = await response.json();
                setError(errorResult.error || 'Download failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                    <Link href="/" className="text-blue-600 hover:text-blue-800 transition-colors">
                        <Home className="h-8 w-8" />
                    </Link>
                    <h1 className="text-4xl font-bold text-gray-900">0G Storage Interface</h1>
                </div>
                <p className="text-gray-600 text-lg">Upload and download JSON data & files using 0G decentralized storage</p>
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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div className="space-y-6">
                    {/* JSON Upload */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                            <Database className="h-6 w-6 text-blue-600" />
                            <h2 className="text-2xl font-semibold text-gray-900">Upload JSON Data</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">File Name</label>
                                <input
                                    type="text"
                                    value={fileName}
                                    onChange={(e) => setFileName(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="Enter file name..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">JSON Data</label>
                                <textarea
                                    value={jsonData}
                                    onChange={(e) => setJsonData(e.target.value)}
                                    rows={10}
                                    className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="Enter your JSON data..."
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                    Size: {new Blob([jsonData]).size} bytes
                                </div>
                            </div>

                            <button
                                onClick={uploadJsonData}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                                {loading ? 'Uploading to 0G...' : 'Upload JSON to 0G'}
                            </button>
                        </div>
                    </div>

                    {/* File Upload */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="h-6 w-6 text-purple-600" />
                            <h2 className="text-2xl font-semibold text-gray-900">Upload File</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
                                <div
                                    className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        type="file"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="text-center">
                                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-600">
                                            {selectedFile ? selectedFile.name : 'Drop a file here, or click to select'}
                                        </p>
                                        {selectedFile && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatBytes(selectedFile.size)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={uploadFile}
                                disabled={loading || !selectedFile}
                                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                                {loading ? 'Uploading to 0G...' : 'Upload File to 0G'}
                            </button>
                        </div>
                    </div>

                    {/* Upload Result */}
                    {uploadResult && (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border border-green-200">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                Upload Success
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-2">Root Hash (Storage ID)</label>
                                    <div className="flex items-center gap-2 bg-white p-3 rounded-lg border">
                                        <code className="flex-1 text-sm break-all font-mono text-gray-800">{uploadResult.rootHash}</code>
                                        <button
                                            onClick={() => copyToClipboard(uploadResult.rootHash)}
                                            className="p-2 text-gray-600 hover:text-gray-900 transition-colors hover:bg-gray-100 rounded"
                                            title="Copy root hash"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-2">Transaction Hash</label>
                                    <div className="flex items-center gap-2 bg-white p-3 rounded-lg border">
                                        <code className="flex-1 text-sm break-all font-mono text-gray-800">{uploadResult.txHash}</code>
                                        <button
                                            onClick={() => copyToClipboard(uploadResult.txHash)}
                                            className="p-2 text-gray-600 hover:text-gray-900 transition-colors hover:bg-gray-100 rounded"
                                            title="Copy transaction hash"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    {uploadResult.fileName && (
                                        <div>
                                            <span className="font-medium text-gray-600">File Name:</span>
                                            <p className="text-gray-900">{uploadResult.fileName}</p>
                                        </div>
                                    )}
                                    {uploadResult.size && (
                                        <div>
                                            <span className="font-medium text-gray-600">Size:</span>
                                            <p className="text-gray-900">{formatBytes(uploadResult.size)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Download Section */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                            <Download className="h-6 w-6 text-green-600" />
                            <h2 className="text-2xl font-semibold text-gray-900">Download from 0G</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Root Hash (Storage ID)</label>
                                <input
                                    type="text"
                                    value={downloadHash}
                                    onChange={(e) => setDownloadHash(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-sm transition-colors"
                                    placeholder="Enter root hash to download from 0G storage..."
                                />
                                {uploadResult && (
                                    <button
                                        onClick={() => setDownloadHash(uploadResult.rootHash)}
                                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                        Use hash from last upload
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    onClick={downloadJsonData}
                                    disabled={loading || !downloadHash.trim()}
                                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                                    {loading ? 'Loading...' : 'Get JSON'}
                                </button>

                                <button
                                    onClick={downloadFile}
                                    disabled={loading || !downloadHash.trim()}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                                    {loading ? 'Loading...' : 'Download File'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Downloaded Data */}
                    {downloadedData && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-200">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Database className="h-5 w-5 text-blue-600" />
                                Downloaded JSON Data
                            </h3>
                            <div className="bg-white rounded-lg p-4 border">
                                <pre className="text-sm overflow-auto max-h-96 text-gray-800">
                                    {JSON.stringify(downloadedData, null, 2)}
                                </pre>
                            </div>
                            <button
                                onClick={() => copyToClipboard(JSON.stringify(downloadedData, null, 2))}
                                className="mt-3 text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                            >
                                <Copy className="h-4 w-4" />
                                Copy JSON data
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}