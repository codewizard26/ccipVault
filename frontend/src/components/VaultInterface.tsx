"use client"

import { useState, useEffect } from "react"
import { useAccount, useBalance, useChainId, useReadContract, useWriteContract, useSwitchChain, useWaitForTransactionReceipt } from "wagmi"
import { parseEther, formatEther } from "viem"
import { ArrowUpRight, ArrowDownRight, Loader2, Shield, Info, Wallet, ChevronDown } from "lucide-react"
import toast from "react-hot-toast"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { CONTRACTS, NETWORKS } from "@/config/contracts"

// Vault ABI for deposit and withdraw functions
const VAULT_ABI = [
    {
        "inputs": [],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_rbtAmount",
                "type": "uint256"
            }
        ],
        "name": "redeem",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getVaultBalance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_rbtAmount",
                "type": "uint256"
            }
        ],
        "name": "calculateRedeemAmount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

// RebaseToken ABI for balance checks
const REBASE_TOKEN_ABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

interface Transaction {
    id: string
    type: "deposit" | "withdraw"
    amount: string
    token: string
    txHash: string
    timestamp: string
    snapshotRootHash?: string
}

export default function VaultInterface() {
    const { address, isConnected } = useAccount()
    const chainId = useChainId()
    const { data: balance } = useBalance({ address })
    const { switchChain } = useSwitchChain()
    const [activeTab, setActiveTab] = useState("deposit")
    const [amount, setAmount] = useState("")
    const [depositAsset, setDepositAsset] = useState("0G")
    const [depositNote, setDepositNote] = useState("")
    const [withdrawAsset, setWithdrawAsset] = useState("RBT")
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

    const [isLoading, setIsLoading] = useState(false)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [pendingTxHash, setPendingTxHash] = useState<string | null>(null)
    const [isProcessingConfirmation, setIsProcessingConfirmation] = useState(false)
    const [pendingTransactionData, setPendingTransactionData] = useState<{
        type: 'deposit' | 'withdraw' | null;
        amount: string;
    } | null>(null)

    const { writeContract, isPending, error, data: txHash } = useWriteContract()

    // Wait for transaction receipt when we have a pending hash
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash: pendingTxHash as `0x${string}`,
        query: {
            enabled: !!pendingTxHash,
        },
    })

    // Read RBT balance directly from RebaseToken contract
    const { data: userRBTBalance } = useReadContract({
        address: CONTRACTS.REBASE_TOKEN as `0x${string}`,
        abi: REBASE_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
        query: {
            enabled: !!address,
        },
    })

    // Read vault balance
    const { data: vaultBalance } = useReadContract({
        address: CONTRACTS.VAULT as `0x${string}`,
        abi: VAULT_ABI,
        functionName: 'getVaultBalance',
    })

    // Read RBT total supply
    const { data: rbtTotalSupply } = useReadContract({
        address: CONTRACTS.REBASE_TOKEN as `0x${string}`,
        abi: REBASE_TOKEN_ABI,
        functionName: 'totalSupply',
    })

    const isCorrectNetwork = chainId === NETWORKS.GALILEO.id

    // Handle transaction hash from writeContract
    useEffect(() => {
        if (txHash && !pendingTxHash) {
            console.log("Transaction hash received:", txHash)
            setPendingTxHash(txHash)
        }
    }, [txHash, pendingTxHash])

    // Handle writeContract errors
    useEffect(() => {
        if (error) {
            console.error('WriteContract error:', error)
            toast.error('Transaction failed. Please try again.')
            setIsLoading(false)
        }
    }, [error])

    // Handle transaction confirmation and database storage
    useEffect(() => {
        if (isConfirmed && pendingTxHash && !isProcessingConfirmation) {
            setIsProcessingConfirmation(true)
            handleTransactionConfirmed(pendingTxHash)
        }
    }, [isConfirmed, pendingTxHash, isProcessingConfirmation])

    const handleTransactionConfirmed = async (txHash: string) => {
        try {
            console.log("Handling transaction confirmation for hash:", txHash)
            console.log("Pending transaction data:", pendingTransactionData)

            // Validate we have all required data
            if (!txHash || !pendingTransactionData || !pendingTransactionData.type || !pendingTransactionData.amount) {
                console.error("Missing required data for transaction:", {
                    txHash,
                    pendingTransactionData,
                    activeTab,
                    amount
                })
                toast.error("Missing transaction data")
                return
            }

            // Store transaction in database with confirmed hash
            const transactionData = {
                transactionType: pendingTransactionData.type,
                transactionHash: txHash,
                amount: pendingTransactionData.amount,
                rootHash: "pending", // Default value, will be updated if snapshot is stored
                walletAddress: address // Include wallet address for KV storage
            };

            console.log("Sending transaction data to API:", transactionData);

            const transactionResponse = await fetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(transactionData),
            })

            if (transactionResponse.ok) {
                const responseData = await transactionResponse.json()
                console.log("Transaction stored in database with hash:", txHash)

                if (responseData.rootHash) {
                    toast.success(`Transaction confirmed and stored in database and 0G storage! Root Hash: ${responseData.rootHash.slice(0, 8)}...${responseData.rootHash.slice(-8)}`)
                } else {
                    toast.success("Transaction confirmed and stored in database and 0G storage!")
                }
            } else {
                const errorData = await transactionResponse.json()
                console.error("Failed to store transaction in database:", errorData)
                toast.error(`Database error: ${errorData.error || 'Unknown error'}`)
            }

            // Snapshot toggle removed; uploads are handled automatically by backend

            // Reset states
            setPendingTxHash(null)
            setAmount("")
            setIsLoading(false)
            setIsProcessingConfirmation(false)
            setPendingTransactionData(null)
        } catch (error) {
            console.error("Error handling transaction confirmation:", error)
            toast.error("Error processing confirmed transaction")
            setPendingTxHash(null)
            setIsLoading(false)
            setIsProcessingConfirmation(false)
            setPendingTransactionData(null)
        }
    }

    const handleSwitchTo0G = async () => {
        try {
            await switchChain({ chainId: NETWORKS.GALILEO.id })
        } catch (error) {
            console.error('Failed to switch chain:', error)
        }
    }

    const resetTransactionState = () => {
        setPendingTxHash(null)
        setIsLoading(false)
        setIsProcessingConfirmation(false)
        setPendingTransactionData(null)
    }

    const handleDeposit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid amount')
            return
        }

        if (!balance || parseFloat(balance.formatted) < parseFloat(amount)) {
            toast.error('Insufficient 0G balance')
            return
        }

        setIsLoading(true)

        try {
            const loadingToast = toast.loading("Transaction sent...")
            const amountInWei = parseEther(amount)

            // Store transaction data for later use
            setPendingTransactionData({
                type: 'deposit',
                amount: amount
            })

            // Send transaction - hash will be received via useEffect
            writeContract({
                address: CONTRACTS.VAULT as `0x${string}`,
                abi: VAULT_ABI,
                functionName: 'deposit',
                value: amountInWei,
            })

            toast.dismiss(loadingToast)
            toast.loading("Waiting for transaction confirmation...")

        } catch (error) {
            console.error('Deposit error:', error)
            toast.error('Deposit failed. Please try again.')
            setIsLoading(false)
        }
    }

    const handleWithdraw = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid amount')
            return
        }

        // Basic safety: deposit asset must be 0G for now
        if (depositAsset !== '0G') {
            toast.error('Selected asset not supported for deposit')
            return
        }

        if (!userRBTBalance || parseFloat(formatEther(userRBTBalance as bigint)) < parseFloat(amount)) {
            toast.error('Insufficient RBT balance')
            return
        }

        // Withdrawals always go to the connected wallet; no destination input required

        setIsLoading(true)

        try {
            const loadingToast = toast.loading("Transaction sent...")
            const amountInWei = parseEther(amount)

            // Store transaction data for later use
            setPendingTransactionData({
                type: 'withdraw',
                amount: amount
            })

            // Send transaction - hash will be received via useEffect
            writeContract({
                address: CONTRACTS.VAULT as `0x${string}`,
                abi: VAULT_ABI,
                functionName: 'redeem',
                args: [amountInWei],
            })

            toast.dismiss(loadingToast)
            toast.loading("Waiting for transaction confirmation...")

        } catch (error) {
            console.error('Withdraw error:', error)
            toast.error('Withdraw failed. Please try again.')
            setIsLoading(false)
        }
    }

    const handleMaxDeposit = () => {
        if (balance) {
            setAmount(balance.formatted)
        }
    }

    const handleMaxWithdraw = () => {
        if (userRBTBalance) {
            setAmount(formatEther(userRBTBalance as bigint))
        }
    }

    if (!isConnected) {
        return (
            <Card className="border-none shadow-lg bg-gradient-to-br from-white to-blue-50">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-blue-900">Connect Wallet</CardTitle>
                    <CardDescription className="text-blue-600">Please connect your wallet to use the vault</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    if (!isCorrectNetwork) {
        return (
            <Card className="border-none shadow-lg bg-gradient-to-br from-white to-blue-50">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-blue-900">Wrong Network</CardTitle>
                    <CardDescription className="text-blue-600">Please switch to 0G Galileo Testnet</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={handleSwitchTo0G}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all"
                    >
                        Switch to 0G Galileo Testnet
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Deposit/Withdraw Interface - Moved to top */}
            <Card className="border-none shadow-lg bg-gradient-to-br from-white to-blue-50">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-3xl font-bold text-blue-900 text-left flex items-center gap-2">
                        <Wallet className="w-7 h-7 text-blue-600" />
                        Vault Operations
                    </CardTitle>
                    <CardDescription className="text-blue-600 text-left text-lg">Deposit or withdraw tokens securely</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8">
                            <TabsTrigger
                                value="deposit"
                                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-left pl-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <ArrowDownRight className="w-5 h-5" />
                                    <span className="text-lg">Deposit</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="withdraw"
                                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-left pl-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <ArrowUpRight className="w-5 h-5" />
                                    <span className="text-lg">Withdraw</span>
                                </div>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="deposit" className="space-y-4">
                            <div className="space-y-4">
                                {/* Asset Type */}
                                <div>
                                    <label className="block text-sm font-medium text-blue-900 mb-2 text-left">Asset Type</label>
                                    <div className="relative">
                                        <select
                                            value={depositAsset}
                                            onChange={(e) => setDepositAsset(e.target.value)}
                                            className="appearance-none w-full px-4 py-3 border border-blue-200 rounded-xl bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="0G">0G</option>
                                            <option value="RBT" disabled>RBT (unsupported)</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-blue-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-lg font-medium text-blue-900 mb-3 text-left">
                                        Amount (0G)
                                    </label>
                                    <div className="flex space-x-2">
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.0"
                                            disabled={isLoading || isPending}
                                            className="flex-1 px-4 py-4 text-lg border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 bg-white"
                                        />
                                        <Button
                                            onClick={handleMaxDeposit}
                                            disabled={isLoading || isPending}
                                            variant="outline"
                                            className="px-8 text-lg rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
                                        >
                                            Max
                                        </Button>
                                    </div>
                                </div>

                                {/* Optional Note */}
                                <div>
                                    <label className="block text-sm font-medium text-blue-900 mb-2 text-left">Optional Note</label>
                                    <input
                                        type="text"
                                        value={depositNote}
                                        onChange={(e) => setDepositNote(e.target.value)}
                                        placeholder="Add a memo for your records (optional)"
                                        className="w-full px-4 py-3 border border-blue-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>



                                <Button
                                    onClick={handleDeposit}
                                    disabled={isLoading || isPending || isConfirming || !amount || parseFloat(amount) <= 0}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-7 text-lg transition-all"
                                >
                                    {isLoading || isPending ? (
                                        <>
                                            <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                                            <span className="text-lg">Sending...</span>
                                        </>
                                    ) : isConfirming ? (
                                        <>
                                            <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                                            <span className="text-lg">Confirming...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ArrowDownRight className="w-6 h-6 mr-2" />
                                            <span className="text-lg">Deposit 0G</span>
                                        </>
                                    )}
                                </Button>

                                {/* Debug info */}
                                {pendingTxHash && (
                                    <div className="text-xs text-gray-500 mt-2">
                                        Pending TX: {pendingTxHash.slice(0, 10)}...
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="withdraw" className="space-y-4">
                            <div className="space-y-4">
                                {/* Asset Type */}
                                <div>
                                    <label className="block text-sm font-medium text-blue-900 mb-2 text-left">Asset Type</label>
                                    <div className="relative">
                                        <select
                                            value={withdrawAsset}
                                            onChange={(e) => setWithdrawAsset(e.target.value)}
                                            className="appearance-none w-full px-4 py-3 border border-blue-200 rounded-xl bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="RBT">RBT</option>
                                            <option value="0G" disabled>0G (withdraw requires RBT)</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-blue-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-lg font-medium text-blue-900 mb-3 text-left">
                                        Amount (RBT)
                                    </label>
                                    <div className="flex space-x-2">
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.0"
                                            disabled={isLoading || isPending}
                                            className="flex-1 px-4 py-4 text-lg border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 bg-white"
                                        />
                                        <Button
                                            onClick={handleMaxWithdraw}
                                            disabled={isLoading || isPending}
                                            variant="outline"
                                            className="px-8 text-lg rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
                                        >
                                            Max
                                        </Button>
                                    </div>
                                </div>

                                {/* Destination implicitly set to connected wallet */}

                                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-blue-100">
                                    <div className="flex items-center space-x-3">
                                        <Shield className="w-6 h-6 text-blue-600" />
                                        <span className="text-lg font-medium text-blue-900">Two‑Factor Confirmation</span>
                                    </div>
                                    <Switch
                                        checked={twoFactorEnabled}
                                        onCheckedChange={setTwoFactorEnabled}
                                        disabled={isLoading || isPending}
                                        className="data-[state=checked]:bg-blue-600"
                                    />
                                </div>
                                <p className="text-xs text-blue-700 -mt-3">Enable 2FA to require an additional confirmation code before completing the withdrawal.</p>

                                <Button
                                    onClick={handleWithdraw}
                                    disabled={isLoading || isPending || isConfirming || !amount || parseFloat(amount) <= 0}
                                    className="w-full border-2 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl py-7 text-lg transition-all"
                                >
                                    {isLoading || isPending ? (
                                        <>
                                            <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                                            <span className="text-lg">Sending...</span>
                                        </>
                                    ) : isConfirming ? (
                                        <>
                                            <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                                            <span className="text-lg">Confirming...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ArrowUpRight className="w-6 h-6 mr-2" />
                                            <span className="text-lg">Withdraw 0G</span>
                                        </>
                                    )}
                                </Button>

                                {/* Debug info */}
                                {pendingTxHash && (
                                    <div className="text-xs text-gray-500 mt-2">
                                        Pending TX: {pendingTxHash.slice(0, 10)}...
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Balance Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-lg bg-gradient-to-br from-white to-blue-50">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-blue-900 text-left">Your Balances</CardTitle>
                        <CardDescription className="text-blue-600 text-left">Available tokens</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-white rounded-xl shadow-sm border border-blue-100">
                            <p className="text-sm text-blue-600 mb-2 text-left">0G Balance</p>
                            <p className="text-2xl font-bold text-blue-900 text-left">
                                {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : "0.0000 0G"}
                            </p>
                        </div>
                        <div className="p-4 bg-white rounded-xl shadow-sm border border-blue-100">
                            <p className="text-sm text-blue-600 mb-2 text-left">RBT Balance</p>
                            <p className="text-2xl font-bold text-blue-900 text-left">
                                {userRBTBalance ? `${parseFloat(formatEther(userRBTBalance as bigint)).toFixed(6)} RBT` : "0.000000 RBT"}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Vault Statistics */}
                <Card className="border-none shadow-lg bg-gradient-to-br from-white to-blue-50">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-blue-900 text-left">Vault Statistics</CardTitle>
                        <CardDescription className="text-blue-600 text-left">Current performance</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-white rounded-xl shadow-sm border border-blue-100">
                            <p className="text-sm text-blue-600 mb-2 text-left">Vault Balance</p>
                            <p className="text-2xl font-bold text-blue-900 text-left">
                                {vaultBalance ? `${parseFloat(formatEther(vaultBalance as bigint)).toFixed(4)} 0G` : "0.0000 0G"}
                            </p>
                        </div>
                        <div className="p-4 bg-white rounded-xl shadow-sm border border-blue-100">
                            <p className="text-sm text-blue-600 mb-2 text-left">Total RBT Supply</p>
                            <p className="text-2xl font-bold text-blue-900 text-left">
                                {rbtTotalSupply ? `${parseFloat(formatEther(rbtTotalSupply as bigint)).toFixed(6)} RBT` : "0.000000 RBT"}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            {transactions.length > 0 && (
                <Card className="border-none shadow-lg bg-gradient-to-br from-white to-blue-50">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-blue-900">Recent Transactions</CardTitle>
                        <CardDescription className="text-blue-600">Your latest vault operations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {transactions.slice(0, 5).map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-blue-100 hover:border-blue-200 transition-all">
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === "deposit" ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600"
                                            }`}>
                                            {tx.type === "deposit" ? (
                                                <ArrowDownRight className="w-5 h-5" />
                                            ) : (
                                                <ArrowUpRight className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-blue-900 capitalize">{tx.type}</p>
                                            <p className="text-sm text-blue-600">
                                                {new Date(tx.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-blue-900">{tx.amount} {tx.token}</p>
                                        <p className="text-xs text-blue-600 font-mono">
                                            {tx.txHash === "pending" ? "Pending..." : `${tx.txHash.slice(0, 8)}...${tx.txHash.slice(-8)}`}
                                        </p>
                                        {tx.snapshotRootHash && (
                                            <Badge variant="secondary" className="mt-1 bg-blue-100 text-blue-600 hover:bg-blue-200">
                                                0G Snapshot
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error Display */}
            {error && (
                <Card className="border-none shadow-lg bg-red-50">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-red-600">Transaction Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-red-600">{error.message}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}