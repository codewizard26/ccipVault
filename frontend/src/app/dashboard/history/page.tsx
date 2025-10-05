"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Database,
  Loader2
} from "lucide-react"
import toast from "react-hot-toast"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { SnapshotModal } from "@/components/SnapshotModal"

interface Transaction {
  id: string
  type: "deposit" | "withdraw" | "interest"
  amount: string
  token: string
  value: string
  status: "completed" | "pending" | "failed"
  timestamp: string
  hash: string
  snapshotRootHash?: string
  snapshotData?: {
    txHash: string
    chainUid: number
    amount: number
    token: string
    [key: string]: unknown
  }
}

export default function HistoryPage() {

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [loadingSnapshot, setLoadingSnapshot] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function fetchTransactions() {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch transactions from database
        const dbResponse = await fetch('/api/transactions')
        if (dbResponse.ok) {
          const dbData = await dbResponse.json()
          const dbTransactions: Transaction[] = dbData.data.map((tx: any) => ({
            id: tx.id.toString(),
            type: tx.transaction_type,
            amount: tx.amount,
            token: tx.transaction_type === 'deposit' ? '0G' : 'RBT',
            value: "",
            status: 'completed', // All transactions in DB are completed since we wait for hash
            timestamp: new Date(tx.timestamp).toLocaleString(),
            hash: tx.transaction_hash,
            snapshotRootHash: tx.root_hash || undefined,
          }))

          if (!isCancelled) {
            setTransactions(dbTransactions)
          }
        } else {
          throw new Error('Failed to fetch transactions from database')
        }
      } catch (e: any) {
        if (!isCancelled) setError(e?.message ?? "Failed to fetch transactions")
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    fetchTransactions()

    return () => {
      isCancelled = true
    }
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownRight className="w-4 h-4 text-green-600" />
      case "withdraw":
        return <ArrowUpRight className="w-4 h-4 text-red-600" />
      case "interest":
        return <TrendingUp className="w-4 h-4 text-blue-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const fetchSnapshot = async (rootHash: string, txId: string) => {
    setLoadingSnapshot(txId)
    try {
      const response = await fetch(`/api/download-transaction?rootHash=${rootHash}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTransactions(prev => prev.map(tx =>
            tx.id === txId ? { ...tx, snapshotData: result.data } : tx
          ))
          toast.success(`Transaction data fetched from 0G storage successfully! Root Hash: ${rootHash.slice(0, 8)}...${rootHash.slice(-8)}`)
        } else {
          throw new Error(result.error || "Failed to fetch transaction data")
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch transaction data")
      }
    } catch (error) {
      console.error("Error fetching transaction data from 0G storage:", error)
      toast.error(`Failed to fetch transaction data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoadingSnapshot(null)
    }
  }

  const refreshTransactions = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const dbResponse = await fetch('/api/transactions')
      if (dbResponse.ok) {
        const dbData = await dbResponse.json()
        const dbTransactions: Transaction[] = dbData.data.map((tx: any) => ({
          id: tx.id.toString(),
          type: tx.transaction_type,
          amount: tx.amount,
          token: tx.transaction_type === 'deposit' ? '0G' : 'RBT',
          value: "",
          status: 'completed', // All transactions in DB are completed since we wait for hash
          timestamp: new Date(tx.timestamp).toLocaleString(),
          hash: tx.transaction_hash,
          snapshotRootHash: tx.root_hash || undefined,
        }))

        setTransactions(dbTransactions)
      } else {
        throw new Error('Failed to fetch transactions from database')
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch transactions")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTransactions = transactions.filter(tx => {
    const typeMatch = filterType === "all" || tx.type === filterType
    const statusMatch = filterStatus === "all" || tx.status === filterStatus
    return typeMatch && statusMatch
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-blue-900">Transaction History</h1>
        <p className="text-blue-700 mt-2">
          View all your vault transactions and activity
        </p>
      </div>

      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter transactions by type and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-end md:space-x-4 space-y-4 md:space-y-0">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-blue-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Transactions</option>
                <option value="deposit">Deposits</option>
                <option value="withdraw">Withdrawals</option>
                <option value="interest">Interest</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-blue-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="flex-1" />
            <div>
              <Button onClick={refreshTransactions} variant="outline" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  'Refresh'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            {isLoading ? "Loading..." : error ? error : `${filteredTransactions.length} transaction${filteredTransactions.length !== 1 ? 's' : ''} found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!isLoading && filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No transactions found matching your filters
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div key={tx.id} className="border border-blue-100 rounded-xl p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                        {getTypeIcon(tx.type)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900 capitalize">
                            {tx.type}
                          </p>
                          {tx.snapshotRootHash && (
                            <Badge variant="secondary" className="flex items-center space-x-1 bg-blue-50 text-blue-700 border border-blue-100">
                              <Database className="w-3 h-3" />
                              <span>0G</span>
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{tx.timestamp}</p>
                        <p className="text-xs text-gray-500 font-mono">{tx.hash}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-blue-900">{tx.amount} {tx.token}</p>
                      <p className="text-sm text-gray-600">{tx.value}</p>
                      <div className="flex items-center justify-end mt-1">
                        {getStatusIcon(tx.status)}
                        <span className="ml-1 text-xs text-gray-500 capitalize">
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {tx.snapshotRootHash && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Database className="w-4 h-4" />
                          <span>Transaction data stored on 0G</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!tx.snapshotData && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchSnapshot(tx.snapshotRootHash!, tx.id)}
                              disabled={loadingSnapshot === tx.id}
                            >
                              {loadingSnapshot === tx.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Fetch Data
                                </>
                              )}
                            </Button>
                          )}
                          {tx.snapshotData && (
                            <SnapshotModal
                              trigger={
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Data
                                </Button>
                              }
                              title={`Transaction Data for ${tx.type}`}
                              data={tx.snapshotData}
                              rootHash={tx.snapshotRootHash}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
