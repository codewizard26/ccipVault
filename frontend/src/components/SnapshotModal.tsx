"use client"

import { useState } from "react"
import { Copy, Check, Database, Calendar, Hash, Wallet, ArrowUpDown, Globe, FileText } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface SnapshotModalProps {
    trigger: React.ReactNode
    title?: string
    data: Record<string, unknown>
    rootHash?: string
}

export function SnapshotModal({ trigger, title = "Transaction Data", data, rootHash }: SnapshotModalProps) {
    const [copied, setCopied] = useState(false)

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy: ', err)
        }
    }

    // Format the data for better display with icons and styling
    const formatDataForDisplay = (data: Record<string, unknown>) => {
        const items = []

        // Transaction Type
        if (data.transactionType) {
            items.push({
                icon: <ArrowUpDown className="w-4 h-4" />,
                label: 'Transaction Type',
                value: String(data.transactionType).toUpperCase(),
                type: 'badge',
                color: data.transactionType === 'deposit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            })
        }

        // Amount
        if (data.amount) {
            items.push({
                icon: <Database className="w-4 h-4" />,
                label: 'Amount',
                value: `${data.amount} ${data.transactionType === 'deposit' ? '0G' : 'RBT'}`,
                type: 'text'
            })
        }

        // Transaction Hash
        if (data.transactionHash) {
            items.push({
                icon: <Hash className="w-4 h-4" />,
                label: 'Transaction Hash',
                value: String(data.transactionHash),
                type: 'hash'
            })
        }

        // Wallet Address
        if (data.walletAddress) {
            items.push({
                icon: <Wallet className="w-4 h-4" />,
                label: 'Wallet Address',
                value: String(data.walletAddress),
                type: 'address'
            })
        }

        // Timestamp
        if (data.timestamp) {
            items.push({
                icon: <Calendar className="w-4 h-4" />,
                label: 'Timestamp',
                value: new Date(data.timestamp as string).toLocaleString(),
                type: 'text'
            })
        }

        // Chain ID
        if (data.chainId) {
            items.push({
                icon: <Globe className="w-4 h-4" />,
                label: 'Chain ID',
                value: String(data.chainId),
                type: 'text'
            })
        }

        // Version
        if (data.version) {
            items.push({
                icon: <FileText className="w-4 h-4" />,
                label: 'Version',
                value: String(data.version),
                type: 'text'
            })
        }

        return items
    }

    const formattedItems = formatDataForDisplay(data);

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-4">
                    <DialogTitle className="flex items-center justify-between text-xl">
                        <div className="flex items-center gap-2">
                            <Database className="w-6 h-6 text-blue-600" />
                            <span>{title}</span>
                        </div>
                        {rootHash && (
                            <Badge variant="outline" className="text-xs">
                                Root: {rootHash.slice(0, 8)}...{rootHash.slice(-8)}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Transaction Overview Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Database className="w-5 h-5 text-blue-600" />
                            Transaction Overview
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {formattedItems.slice(0, 4).map((item, index) => (
                                <div key={index} className="bg-white rounded-lg p-4 border border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                            {item.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-600">{item.label}</p>
                                            {item.type === 'badge' ? (
                                                <Badge className={`mt-1 ${item.color}`}>
                                                    {item.value}
                                                </Badge>
                                            ) : (
                                                <p className="text-sm font-mono text-gray-900 break-all">
                                                    {item.value.length > 30 ?
                                                        `${item.value.slice(0, 15)}...${item.value.slice(-15)}` :
                                                        item.value
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Detailed Information */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-600" />
                            Detailed Information
                        </h3>
                        <div className="space-y-3">
                            {formattedItems.map((item, index) => (
                                <div key={index} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="p-2 bg-white rounded-lg text-gray-600 shadow-sm">
                                        {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-700 mb-1">{item.label}</p>
                                        {item.type === 'badge' ? (
                                            <Badge className={item.color}>
                                                {item.value}
                                            </Badge>
                                        ) : (
                                            <p className="text-sm font-mono text-gray-900 break-all bg-white p-2 rounded border">
                                                {item.value}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Raw JSON Data */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-gray-600" />
                                Raw JSON Data
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copyToClipboard}
                                className="flex items-center gap-2"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Copy JSON
                                    </>
                                )}
                            </Button>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-sm text-green-400 font-mono">
                                <code>{JSON.stringify(data, null, 2)}</code>
                            </pre>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
