"use client"

import { useState, useEffect } from "react"
import {
    Brain,
    TrendingUp,
    Users,
    DollarSign,
    AlertTriangle,
    Lightbulb,
    Loader2,
    RefreshCw,
    CheckCircle,
    XCircle,
    Info,
    Zap,
    MessageCircle,
    Send
} from "lucide-react"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface VaultData {
    tvl: number;
    totalDeposits: number;
    totalWithdrawals: number;
    uniqueDepositors: number;
    currentAPY: number;
    recentTransactions: Array<{
        type: string;
        amount: number;
        timestamp: string;
        hash: string;
    }>;
    timeRange: string;
}

interface AIAnalysisResponse {
    analysis: string;
    vaultData: VaultData;
    question: string | null;
    generatedAt: string;
}

interface ServiceStatus {
    balance: string;
    servicesCount: number;
    services: Array<{
        provider: string;
        serviceType: string;
        model: string;
        verifiability: string;
        inputPrice: string;
        outputPrice: string;
    }>;
}

export default function AIAnalysisPage() {
    const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null)
    const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [timeRange, setTimeRange] = useState("1M")
    const [question, setQuestion] = useState("")
    const [askingQuestion, setAskingQuestion] = useState(false)

    // Fetch service status on component mount
    useEffect(() => {
        fetchServiceStatus()
    }, [])

    const fetchServiceStatus = async () => {
        try {
            const response = await fetch('/api/ai-analysis')
            const result = await response.json()

            if (result.success) {
                setServiceStatus(result.data)
            } else {
                console.error('Failed to fetch service status:', result.error)
            }
        } catch (err) {
            console.error('Error fetching service status:', err)
        }
    }

    const generateAnalysis = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch('/api/ai-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ timeRange })
            })

            const result = await response.json()

            if (result.success) {
                setAnalysis(result.data)
            } else {
                setError(result.error || 'Failed to generate AI analysis')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred')
        } finally {
            setLoading(false)
        }
    }

    const askQuestion = async () => {
        if (!question.trim()) return;

        try {
            setAskingQuestion(true)
            setError(null)

            const response = await fetch('/api/ai-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ timeRange, question: question.trim() })
            })

            const result = await response.json()

            if (result.success) {
                setAnalysis(result.data)
                setQuestion("") // Clear the question input
            } else {
                setError(result.error || 'Failed to get answer')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred')
        } finally {
            setAskingQuestion(false)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value)
    }

    const formatAnalysis = (analysisText: string) => {
        // Split analysis into sections
        const sections = analysisText.split(/\*\*(.*?)\*\*:/g)
        const formattedSections = []

        for (let i = 0; i < sections.length; i += 2) {
            if (sections[i + 1]) {
                formattedSections.push({
                    title: sections[i + 1].trim(),
                    content: sections[i + 2]?.trim() || ''
                })
            }
        }

        return formattedSections
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Brain className="w-8 h-8 text-purple-600" />
                        AI Vault Analysis
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Powered by 0G Compute - Get intelligent insights about your vault's performance
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="1D">Last 24 Hours</option>
                        <option value="1W">Last Week</option>
                        <option value="1M">Last Month</option>
                        <option value="3M">Last 3 Months</option>
                        <option value="All">All Time</option>
                    </select>
                    <Button
                        onClick={generateAnalysis}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4 mr-2" />
                                Generate Analysis
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Question Input */}
            <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                        <MessageCircle className="w-5 h-5" />
                        Ask a Question About Your Vault
                    </CardTitle>
                    <CardDescription>
                        Get specific insights about your vault's performance, risks, or strategy
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g., Is my vault performing well? What are the main risks? Should I deposit more?"
                            className="flex-1 px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
                        />
                        <Button
                            onClick={askQuestion}
                            disabled={askingQuestion || !question.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                        >
                            {askingQuestion ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Asking...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Ask
                                </>
                            )}
                        </Button>
                    </div>
                    <div className="mt-3 text-sm text-blue-700">
                        <p className="font-medium">Example questions:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>"Is my vault's APY competitive compared to other DeFi protocols?"</li>
                            <li>"What are the main risks I should be aware of?"</li>
                            <li>"Should I deposit more funds or withdraw some?"</li>
                            <li>"How is my vault's growth compared to the market?"</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* 0G Compute Service Status */}
            {serviceStatus && (
                <Card className="border-purple-200 bg-purple-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-900">
                            <Zap className="w-5 h-5" />
                            0G Compute Service Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-lg p-4 border border-purple-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm font-medium text-gray-600">Balance</span>
                                </div>
                                <p className="text-lg font-bold text-purple-900">{serviceStatus.balance} OG</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-purple-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Brain className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm font-medium text-gray-600">Available Services</span>
                                </div>
                                <p className="text-lg font-bold text-purple-900">{serviceStatus.servicesCount}</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-purple-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-medium text-gray-600">Status</span>
                                </div>
                                <Badge className="bg-green-100 text-green-800">Connected</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error State */}
            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-900">Analysis Error</p>
                                <p className="text-sm text-red-700">{error}</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={generateAnalysis}
                                    className="mt-2 text-red-600 border-red-300 hover:bg-red-50"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Try Again
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Analysis Results */}
            {analysis && (
                <div className="space-y-6">
                    {/* Vault Data Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                Vault Data Summary
                            </CardTitle>
                            <CardDescription>
                                Data analyzed for {timeRange} time period
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <DollarSign className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-800">Total Value Locked</span>
                                    </div>
                                    <p className="text-xl font-bold text-blue-900">{formatCurrency(analysis.vaultData.tvl)}</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                        <span className="text-sm font-medium text-green-800">Total Deposits</span>
                                    </div>
                                    <p className="text-xl font-bold text-green-900">{formatCurrency(analysis.vaultData.totalDeposits)}</p>
                                </div>
                                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                                        <span className="text-sm font-medium text-red-800">Total Withdrawals</span>
                                    </div>
                                    <p className="text-xl font-bold text-red-900">{formatCurrency(analysis.vaultData.totalWithdrawals)}</p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className="w-4 h-4 text-purple-600" />
                                        <span className="text-sm font-medium text-purple-800">Unique Depositors</span>
                                    </div>
                                    <p className="text-xl font-bold text-purple-900">{analysis.vaultData.uniqueDepositors}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Analysis */}
                    <Card className="border-blue-100">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Brain className="w-5 h-5 text-purple-600" />
                                {analysis.question ? 'AI Answer' : 'AI Analysis Results'}
                            </CardTitle>
                            <CardDescription>
                                {analysis.question ? (
                                    <>
                                        <span className="font-medium">Question:</span> "{analysis.question}"
                                        <br />
                                        Generated on {new Date(analysis.generatedAt).toLocaleString()}
                                    </>
                                ) : (
                                    `Generated on ${new Date(analysis.generatedAt).toLocaleString()}`
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-gray max-w-none">
                                {analysis.question ? (
                                    // Display question answer as a single response
                                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                                        <div className="flex items-start gap-3">
                                            <MessageCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                                            <div>
                                                <h3 className="text-lg font-semibold text-blue-900 mb-3">Answer</h3>
                                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                                    {analysis.analysis}
                                                </p>
                                                {/* Feedback */}
                                                <div className="mt-4 flex items-center gap-3">
                                                    <span className="text-sm text-blue-800">Was this helpful?</span>
                                                    <button className="px-3 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-50">Yes</button>
                                                    <button className="px-3 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-50">No</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // Display full analysis with sections
                                    formatAnalysis(analysis.analysis).map((section, index) => (
                                        <div key={index} className="mb-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                {section.title === 'Growth Analysis' && <TrendingUp className="w-5 h-5 text-blue-600" />}
                                                {section.title === 'Usage Patterns' && <Users className="w-5 h-5 text-green-600" />}
                                                {section.title === 'APR Analysis' && <DollarSign className="w-5 h-5 text-yellow-600" />}
                                                {section.title === 'Risk Assessment' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                                                {section.title === 'Investment Recommendation' && <Lightbulb className="w-5 h-5 text-purple-600" />}
                                                {section.title}
                                            </h3>
                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                                    {section.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Transactions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Info className="w-5 h-5 text-gray-600" />
                                Recent Transactions
                            </CardTitle>
                            <CardDescription>
                                Last 10 transactions used in analysis
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {analysis.vaultData.recentTransactions.map((tx, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                        <div className="flex items-center gap-3">
                                            <Badge
                                                className={tx.type === 'deposit'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }
                                            >
                                                {tx.type}
                                            </Badge>
                                            <span className="text-sm text-gray-600">
                                                {new Date(tx.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-gray-900">
                                                {formatCurrency(tx.amount)}
                                            </p>
                                            <p className="text-xs text-gray-500 font-mono">
                                                {tx.hash.slice(0, 8)}...{tx.hash.slice(-8)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Empty State */}
            {!analysis && !loading && !error && (
                <Card className="border-dashed border-2 border-gray-300">
                    <CardContent className="p-12 text-center">
                        <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Ready for AI Analysis
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Click "Generate Analysis" to get intelligent insights about your vault's performance,
                            growth patterns, and investment recommendations powered by 0G Compute.
                        </p>
                        <Button
                            onClick={generateAnalysis}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <Zap className="w-4 h-4 mr-2" />
                            Generate Analysis
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Loading skeletons */}
            {loading && (
                <div className="space-y-6">
                    <div className="rounded-xl border border-blue-100 bg-white p-6 animate-pulse h-[120px]" />
                    <div className="rounded-xl border border-blue-100 bg-white p-6 animate-pulse h-[260px]" />
                </div>
            )}
        </div>
    )
}
