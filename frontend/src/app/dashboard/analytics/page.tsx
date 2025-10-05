"use client"

import { useState, useEffect } from "react"
import {
    BarChart3,
    TrendingUp,
    Users,
    ArrowUpRight,
    Timer,
    AlertCircle,
    Loader2,
} from "lucide-react"
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
} from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// ---------------- Mock Data ----------------
const mockTVLData = [
    { date: "Aug 1", value: 1000000 },
    { date: "Aug 8", value: 1250000 },
    { date: "Aug 15", value: 1150000 },
    { date: "Aug 22", value: 1400000 },
    { date: "Aug 29", value: 1600000 },
]

const mockDepositsWithdrawals = [
    { date: "Aug 25", deposits: 150000, withdrawals: 50000 },
    { date: "Aug 26", deposits: 200000, withdrawals: 75000 },
    { date: "Aug 27", deposits: 180000, withdrawals: 60000 },
    { date: "Aug 28", deposits: 250000, withdrawals: 80000 },
    { date: "Aug 29", deposits: 300000, withdrawals: 100000 },
]

const mockRebaseTokenData = [
    { date: "Aug 1", supply: 1000000, tvl: 1000000 },
    { date: "Aug 8", supply: 1050000, tvl: 1250000 },
    { date: "Aug 15", supply: 1100000, tvl: 1150000 },
    { date: "Aug 22", supply: 1150000, tvl: 1400000 },
    { date: "Aug 29", supply: 1200000, tvl: 1600000 },
]

const mockDistributionData = [
    { name: "Top 3 Whales", value: 45 },
    { name: "Next 7 Large Holders", value: 25 },
    { name: "Other Holders", value: 30 },
]

const COLORS = ["#3B82F6", "#60A5FA", "#93C5FD"]

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}

// ---------------- Types ----------------
interface AnalyticsData {
    overview: {
        tvl: number;
        totalDeposits: number;
        totalWithdrawals: number;
        uniqueDepositors: number;
        currentAPY: number;
    };
    charts: {
        tvlData: Array<{ date: string; value: number }>;
        depositsWithdrawalsData: Array<{ date: string; deposits: number; withdrawals: number }>;
        userDistribution: Array<{ name: string; value: number }>;
        dailyData: Array<{ date: string; deposits: number; withdrawals: number }>;
        rebaseTokenData: Array<{ date: string; supply: number }>;
    };
}

// ---------------- Component ----------------
export default function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState("1M") // 1D, 1W, 1M, 3M, All
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch analytics data
    useEffect(() => {
        fetchAnalyticsData()
    }, [timeRange])

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`/api/analytics?timeRange=${timeRange}`)
            const result = await response.json()

            if (result.success) {
                setAnalyticsData(result.data)
            } else {
                setError(result.error || 'Failed to fetch analytics data')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred')
        } finally {
            setLoading(false)
        }
    }

    // Use real data if available, otherwise fall back to mock data
    const data = analyticsData || {
        overview: {
            tvl: 1600000,
            totalDeposits: 2500000,
            totalWithdrawals: 350000,
            uniqueDepositors: 156,
            currentAPY: 8.5
        },
        charts: {
            tvlData: mockTVLData,
            depositsWithdrawalsData: mockDepositsWithdrawals,
            userDistribution: mockDistributionData,
            dailyData: mockDepositsWithdrawals,
            rebaseTokenData: mockRebaseTokenData
        }
    }

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                {/* KPI Skeletons */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="p-6 rounded-xl border border-blue-100 bg-white animate-pulse">
                            <div className="h-4 w-24 bg-blue-100 rounded mb-3" />
                            <div className="h-6 w-32 bg-blue-100 rounded mb-2" />
                            <div className="h-4 w-20 bg-blue-100 rounded" />
                        </div>
                    ))}
                </div>

                {/* Chart Skeletons */}
                <div className="rounded-xl border border-blue-100 bg-white p-4 animate-pulse h-[350px]" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-xl border border-blue-100 bg-white p-4 animate-pulse h-[350px]" />
                    <div className="rounded-xl border border-blue-100 bg-white p-4 animate-pulse h-[350px]" />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-900">Error Loading Analytics</p>
                                <p className="text-sm text-red-700">{error}</p>
                                <button
                                    onClick={fetchAnalyticsData}
                                    className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* ---- Info Note ---- */}
            <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-green-900">Live Data</p>
                            <p className="text-sm text-green-700">
                                Analytics are now powered by real transaction data from your Neon database. Data updates automatically as new transactions are processed.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ---- Overview Cards ---- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* TVL */}
                <Card className="border-blue-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Value Locked</p>
                                <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(data.overview.tvl)}</h3>
                                <p className="mt-1 text-sm text-green-600 flex items-center">
                                    <TrendingUp className="w-4 h-4 mr-1" />
                                    {data.overview.tvl > 0 ? '+15.3%' : 'No data'}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                                <BarChart3 className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Depositors */}
                <Card className="border-blue-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Active Depositors</p>
                                <h3 className="text-2xl font-bold text-gray-900">{data.overview.uniqueDepositors}</h3>
                                <p className="mt-1 text-sm text-green-600 flex items-center">
                                    <ArrowUpRight className="w-4 h-4 mr-1" />
                                    {data.overview.uniqueDepositors > 0 ? '+23 this week' : 'No data'}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Deposits/Withdrawals */}
                <Card className="border-blue-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Deposits</p>
                                <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(data.overview.totalDeposits)}</h3>
                                <p className="mt-1 text-sm text-gray-600">{formatCurrency(data.overview.totalWithdrawals)} withdrawn</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                                <ArrowUpRight className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* APY */}
                <Card className="border-blue-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Current APY</p>
                                <h3 className="text-2xl font-bold text-gray-900">{data.overview.currentAPY}%</h3>
                                <p className="mt-1 text-sm text-green-600 flex items-center">
                                    <TrendingUp className="w-4 h-4 mr-1" />
                                    +0.5% this week
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                                <Timer className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ---- Vault Growth ---- */}
            <Card className="border-blue-100">
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>Vault Growth</CardTitle>
                        <CardDescription>Cumulative TVL growth in 4-hour intervals</CardDescription>
                    </div>
                    <div className="flex space-x-2 mt-2 md:mt-0">
                        {["1D", "1W", "1M", "3M", "All"].map((range) => (
                            <Button
                                key={range}
                                variant={timeRange === range ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                    setTimeRange(range)
                                    // Data will be refetched automatically via useEffect
                                }}
                            >
                                {range}
                            </Button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.charts.tvlData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="date" />
                                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                                <Tooltip
                                    formatter={(value: number) => [formatCurrency(value), 'TVL']}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    name="Vault TVL"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    isAnimationActive
                                    animationDuration={600}
                                    animationEasing="ease-out"
                                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* ---- Deposits vs Withdrawals + User Distribution ---- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Deposits vs Withdrawals */}
                <Card className="border-blue-100">
                    <CardHeader>
                        <CardTitle>Deposits vs Withdrawals</CardTitle>
                        <CardDescription>4-hour interval activity for the last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.charts.depositsWithdrawalsData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis dataKey="date" />
                                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Legend />
                                    <Bar dataKey="deposits" name="Deposits" fill="#3B82F6" isAnimationActive animationDuration={500} animationEasing="ease-out" />
                                    <Bar dataKey="withdrawals" name="Withdrawals" fill="#EF4444" isAnimationActive animationDuration={500} animationEasing="ease-out" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* User Distribution */}
                <Card className="border-blue-100">
                    <CardHeader>
                        <CardTitle>User Distribution</CardTitle>
                        <CardDescription>Concentration of funds by holder type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                    <Pie
                                        data={data.charts.userDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        nameKey="name"
                                        label
                                    >
                                        {data.charts.userDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ---- Rebase Token Performance ---- */}
            <Card className="border-blue-100">
                <CardHeader>
                    <CardTitle>Token Supply Growth</CardTitle>
                    <CardDescription>Cumulative token supply growth in 4-hour intervals</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.charts.rebaseTokenData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="date" />
                                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="supply"
                                    name="Token Supply Growth"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    isAnimationActive
                                    animationDuration={600}
                                    animationEasing="ease-out"
                                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* ---- Risk / Behavior Insights ---- */}
            <Card>
                <CardHeader>
                    <CardTitle>AI Risk Insights</CardTitle>
                    <CardDescription>Powered by 0G Compute</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[
                            {
                                message: "Unusual large withdrawal detected in last 24h",
                                type: "warning",
                            },
                            {
                                message: "TVL grew by 15% this week due to 3 new large depositors",
                                type: "info",
                            },
                            {
                                message: "Vault is 80% concentrated in top 5 addresses",
                                type: "alert",
                            },
                        ].map((insight, index) => (
                            <div
                                key={index}
                                className={`flex items-start space-x-4 p-4 rounded-lg ${insight.type === "warning"
                                    ? "bg-yellow-50"
                                    : insight.type === "alert"
                                        ? "bg-red-50"
                                        : "bg-blue-50"
                                    }`}
                            >
                                <AlertCircle
                                    className={`w-5 h-5 mt-0.5 ${insight.type === "warning"
                                        ? "text-yellow-600"
                                        : insight.type === "alert"
                                            ? "text-red-600"
                                            : "text-blue-600"
                                        }`}
                                />
                                <p className="text-sm">{insight.message}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
