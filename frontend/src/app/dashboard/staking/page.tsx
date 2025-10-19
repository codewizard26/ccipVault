"use client"

import { useState, useEffect, useCallback } from "react"
import { useAccount, useBalance, useWriteContract, useReadContract } from "wagmi"
import { formatEther, parseEther } from "viem"
import { Lock, Unlock, TrendingUp, Users, Clock, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "react-hot-toast"
import { contracts } from "@/config/contracts"

export default function StakingPage() {
    const { address, isConnected } = useAccount()
    const [stakeAmount, setStakeAmount] = useState("")
    const [unstakeAmount, setUnstakeAmount] = useState("")
    const [isStaking, setIsStaking] = useState(false)
    const [isUnstaking, setIsUnstaking] = useState(false)
    const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>()
    const [stakeHash, setStakeHash] = useState<`0x${string}` | undefined>()
    const [unstakeHash, setUnstakeHash] = useState<`0x${string}` | undefined>()

    // Contract interactions
    const { writeContract: writeContractApproval, data: approvalTxHash, isPending: isApprovalPending } = useWriteContract()
    const { writeContract: writeContractStake, data: stakeTxHash, isPending: isStakePending } = useWriteContract()
    const { writeContract: writeContractUnstake, data: unstakeTxHash, isPending: isUnstakePending } = useWriteContract()

    // Manual polling for transaction receipts
    const [isApprovalLoading, setIsApprovalLoading] = useState(false)
    const [isApprovalSuccess, setIsApprovalSuccess] = useState(false)
    const [isStakeLoading, setIsStakeLoading] = useState(false)
    const [isStakeSuccess, setIsStakeSuccess] = useState(false)
    const [isUnstakeLoading, setIsUnstakeLoading] = useState(false)
    const [isUnstakeSuccess, setIsUnstakeSuccess] = useState(false)

    // Read contract data
    const { data: tokenBalance } = useReadContract({
        address: contracts.rebaseToken.address as `0x${string}`,
        abi: contracts.rebaseToken.abi,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
    })

    const { data: stakedBalance } = useReadContract({
        address: contracts.rebaseTokenPool.address as `0x${string}`,
        abi: contracts.rebaseTokenPool.abi,
        functionName: "getStakedBalance",
        args: address ? [address] : undefined,
    })

    const { data: votingPower } = useReadContract({
        address: contracts.rebaseTokenPool.address as `0x${string}`,
        abi: contracts.rebaseTokenPool.abi,
        functionName: "getVotingPower",
        args: address ? [address] : undefined,
    })

    const { data: totalStaked } = useReadContract({
        address: contracts.rebaseTokenPool.address as `0x${string}`,
        abi: contracts.rebaseTokenPool.abi,
        functionName: "getTotalStaked",
    })

    // Watch for approval transaction hash
    useEffect(() => {
        if (approvalTxHash) {
            console.log("Approval transaction hash received:", approvalTxHash)
            setApprovalHash(approvalTxHash)
            setIsApprovalLoading(true)
            setIsApprovalSuccess(false)
            // Start polling for approval transaction receipt
            pollTransactionReceipt(approvalTxHash, 'approval')
        }
    }, [approvalTxHash])

    // Watch for stake transaction hash
    useEffect(() => {
        if (stakeTxHash) {
            console.log("Stake transaction hash received:", stakeTxHash)
            setStakeHash(stakeTxHash)
            setIsStakeLoading(true)
            setIsStakeSuccess(false)
            // Start polling for stake transaction receipt
            pollTransactionReceipt(stakeTxHash, 'stake')
        }
    }, [stakeTxHash])

    // Watch for unstake transaction hash
    useEffect(() => {
        if (unstakeTxHash) {
            console.log("Unstake transaction hash received:", unstakeTxHash)
            setUnstakeHash(unstakeTxHash)
            setIsUnstakeLoading(true)
            setIsUnstakeSuccess(false)
            // Start polling for unstake transaction receipt
            pollTransactionReceipt(unstakeTxHash, 'unstake')
        }
    }, [unstakeTxHash])

    // Function to poll for transaction receipt
    const pollTransactionReceipt = async (txHash: string, type: 'approval' | 'stake' | 'unstake') => {
        console.log(`Polling for ${type} transaction receipt:`, txHash)

        const poll = async () => {
            try {
                const response = await fetch('https://evmrpc-testnet.0g.ai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'eth_getTransactionReceipt',
                        params: [txHash],
                        id: 1
                    })
                })

                const data = await response.json()
                console.log(`${type} transaction receipt check:`, data)

                if (data.result) {
                    // Transaction confirmed
                    console.log(`${type} transaction confirmed!`)
                    if (type === 'approval') {
                        setIsApprovalLoading(false)
                        setIsApprovalSuccess(true)
                    } else if (type === 'stake') {
                        setIsStakeLoading(false)
                        setIsStakeSuccess(true)
                    } else if (type === 'unstake') {
                        setIsUnstakeLoading(false)
                        setIsUnstakeSuccess(true)
                    }
                } else {
                    // Transaction not yet mined, poll again in 3 seconds
                    console.log(`${type} transaction not yet mined, polling again in 3 seconds...`)
                    setTimeout(poll, 3000)
                }
            } catch (error) {
                console.error(`Error polling ${type} transaction:`, error)
                // Retry in 3 seconds on error
                setTimeout(poll, 3000)
            }
        }

        poll()
    }

    const executeStakeTransaction = useCallback(async () => {
        console.log("executeStakeTransaction called with stakeAmount:", stakeAmount)
        if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
            toast.error("Please enter a valid amount to stake")
            return
        }

        try {
            const amount = parseEther(stakeAmount)
            console.log("Sending stake transaction with amount:", amount.toString())
            toast.loading("Staking tokens...", { id: "staking" })

            await writeContractStake({
                address: contracts.rebaseTokenPool.address as `0x${string}`,
                abi: contracts.rebaseTokenPool.abi,
                functionName: "stake",
                args: [amount],
            })

            console.log("Stake transaction sent, waiting for hash...")
        } catch (error) {
            console.error("Staking error:", error)
            toast.error("Failed to stake tokens")
            toast.dismiss("staking")
            setIsStaking(false)
        }
    }, [stakeAmount, writeContractStake])

    // Handle approval success
    useEffect(() => {
        console.log("Approval effect triggered:", { isApprovalSuccess, approvalHash })
        if (isApprovalSuccess && approvalHash) {
            console.log("Approval successful, executing stake transaction...")
            toast.success("Approval confirmed!")
            // Now send the staking transaction
            executeStakeTransaction()
        }
    }, [isApprovalSuccess, approvalHash, executeStakeTransaction])

    // Handle staking success
    useEffect(() => {
        if (isStakeSuccess && stakeHash) {
            toast.success("Successfully staked tokens!")
            setStakeAmount("")
            setApprovalHash(undefined)
            setStakeHash(undefined)
            setIsStaking(false)
        }
    }, [isStakeSuccess, stakeHash])

    // Handle unstaking success
    useEffect(() => {
        if (isUnstakeSuccess && unstakeHash) {
            toast.success("Successfully unstaked tokens!")
            setUnstakeAmount("")
            setUnstakeHash(undefined)
            setIsUnstaking(false)
        }
    }, [isUnstakeSuccess, unstakeHash])

    const handleStake = async () => {
        console.log("handleStake called with stakeAmount:", stakeAmount)
        if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
            toast.error("Please enter a valid amount to stake")
            return
        }

        if (!address) {
            toast.error("Please connect your wallet")
            return
        }

        try {
            setIsStaking(true)
            const amount = parseEther(stakeAmount)
            console.log("Sending approval transaction with amount:", amount.toString())

            toast.loading("Approving tokens...", { id: "approval" })

            // First approve the contract to spend tokens
            await writeContractApproval({
                address: contracts.rebaseToken.address as `0x${string}`,
                abi: contracts.rebaseToken.abi,
                functionName: "approve",
                args: [contracts.rebaseTokenPool.address as `0x${string}`, amount],
            })

            console.log("Approval transaction sent, waiting for hash...")
        } catch (error) {
            console.error("Approval error:", error)
            toast.error("Failed to approve tokens")
            toast.dismiss("approval")
            setIsStaking(false)
        }
    }

    const handleUnstake = async () => {
        if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) {
            toast.error("Please enter a valid amount to unstake")
            return
        }

        if (!address) {
            toast.error("Please connect your wallet")
            return
        }

        try {
            setIsUnstaking(true)
            const amount = parseEther(unstakeAmount)

            toast.loading("Unstaking tokens...", { id: "unstaking" })

            await writeContractUnstake({
                address: contracts.rebaseTokenPool.address as `0x${string}`,
                abi: contracts.rebaseTokenPool.abi,
                functionName: "unstake",
                args: [amount],
            })

            console.log("Unstake transaction sent, waiting for hash...")
        } catch (error) {
            console.error("Unstaking error:", error)
            toast.error("Failed to unstake tokens")
            toast.dismiss("unstaking")
            setIsUnstaking(false)
        }
    }

    const handleMaxStake = () => {
        if (tokenBalance && typeof tokenBalance === 'bigint') {
            setStakeAmount(formatEther(tokenBalance))
        }
    }

    const handleMaxUnstake = () => {
        if (stakedBalance && typeof stakedBalance === 'bigint') {
            setUnstakeAmount(formatEther(stakedBalance))
        }
    }

    if (!isConnected) {
        return (
            <div className="flex items-center justify-center h-64">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
                            <p className="text-gray-600">Please connect your wallet to access the staking dashboard</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Staking Dashboard</h1>
                    <p className="text-gray-600 mt-1">Stake your RBT tokens to earn voting power for DAO governance</p>
                </div>
                <Badge variant="secondary" className="px-3 py-1">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Live
                </Badge>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Your Staked</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stakedBalance && typeof stakedBalance === 'bigint' ? formatEther(stakedBalance) : "0"} RBT
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Lock className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Voting Power</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {votingPower && typeof votingPower === 'bigint' ? formatEther(votingPower) : "0"} VP
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Staked</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {totalStaked && typeof totalStaked === 'bigint' ? formatEther(totalStaked) : "0"} RBT
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Coins className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Token Balance</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {tokenBalance && typeof tokenBalance === 'bigint' ? formatEther(tokenBalance) : "0"} RBT
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Coins className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Staking Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stake Tokens */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Lock className="w-5 h-5 mr-2 text-blue-600" />
                            Stake RBT Tokens
                        </CardTitle>
                        <CardDescription>
                            Lock your RBT (Rebase Token) to earn voting power for DAO governance
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Amount to Stake
                            </label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    placeholder="0.0"
                                    value={stakeAmount}
                                    onChange={(e) => setStakeAmount(e.target.value)}
                                    className="pr-20"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="absolute right-1 top-1 h-8"
                                    onClick={handleMaxStake}
                                >
                                    Max
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Available: {tokenBalance && typeof tokenBalance === 'bigint' ? formatEther(tokenBalance) : "0"} RBT
                            </p>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-blue-700">Voting Power Earned:</span>
                                <span className="font-semibold text-blue-900">
                                    {stakeAmount ? `${stakeAmount} VP` : "0 VP"}
                                </span>
                            </div>
                        </div>

                        <Button
                            onClick={handleStake}
                            disabled={isStaking || isApprovalPending || isStakePending || isApprovalLoading || isStakeLoading || !stakeAmount || parseFloat(stakeAmount) <= 0}
                            className="w-full"
                            size="lg"
                        >
                            {isStaking || isApprovalPending || isStakePending || isApprovalLoading || isStakeLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    {isApprovalPending ? "Approving..." : isStakePending ? "Staking..." : isApprovalLoading ? "Waiting for approval..." : isStakeLoading ? "Waiting for stake..." : "Processing..."}
                                </>
                            ) : (
                                <>
                                    <Lock className="w-4 h-4 mr-2" />
                                    Stake Tokens
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Unstake Tokens */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Unlock className="w-5 h-5 mr-2 text-red-600" />
                            Unstake RBT Tokens
                        </CardTitle>
                        <CardDescription>
                            Unlock your staked RBT tokens and lose corresponding voting power
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Amount to Unstake
                            </label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    placeholder="0.0"
                                    value={unstakeAmount}
                                    onChange={(e) => setUnstakeAmount(e.target.value)}
                                    className="pr-20"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="absolute right-1 top-1 h-8"
                                    onClick={handleMaxUnstake}
                                >
                                    Max
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Staked: {stakedBalance && typeof stakedBalance === 'bigint' ? formatEther(stakedBalance) : "0"} RBT
                            </p>
                        </div>

                        <div className="bg-red-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-red-700">Voting Power Lost:</span>
                                <span className="font-semibold text-red-900">
                                    {unstakeAmount ? `${unstakeAmount} VP` : "0 VP"}
                                </span>
                            </div>
                        </div>

                        <Button
                            onClick={handleUnstake}
                            disabled={isUnstaking || isUnstakePending || isUnstakeLoading || !unstakeAmount || parseFloat(unstakeAmount) <= 0}
                            variant="destructive"
                            className="w-full"
                            size="lg"
                        >
                            {isUnstaking || isUnstakePending || isUnstakeLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    {isUnstakePending ? "Unstaking..." : "Waiting for unstake..."}
                                </>
                            ) : (
                                <>
                                    <Unlock className="w-4 h-4 mr-2" />
                                    Unstake Tokens
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Staking Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Staking Information</CardTitle>
                    <CardDescription>
                        Learn more about how staking works and its benefits
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="rewards">Voting Power</TabsTrigger>
                            <TabsTrigger value="governance">Governance</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">How Staking Works</h4>
                                    <ul className="space-y-2 text-sm text-gray-600">
                                        <li>• Lock your RBT (Rebase Token) to earn voting power</li>
                                        <li>• 1:1 ratio - 1 RBT staked = 1 Voting Power</li>
                                        <li>• No lock-up period - unstake anytime</li>
                                        <li>• Only RBT tokens can be staked</li>
                                        <li>• Voting power is used for DAO governance</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Benefits</h4>
                                    <ul className="space-y-2 text-sm text-gray-600">
                                        <li>• Participate in DAO governance</li>
                                        <li>• Vote on protocol proposals</li>
                                        <li>• Influence protocol development</li>
                                        <li>• No additional rewards - pure governance utility</li>
                                    </ul>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="rewards" className="space-y-4">
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                                <h4 className="font-semibold text-gray-900 mb-2">Voting Power System</h4>
                                <p className="text-sm text-gray-600 mb-4">
                                    Staking RBT tokens provides voting power for DAO governance. No additional rewards are distributed.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-lg">
                                        <h5 className="font-medium text-gray-900">Voting Power</h5>
                                        <p className="text-sm text-gray-600">1:1 ratio - 1 RBT staked = 1 Voting Power</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg">
                                        <h5 className="font-medium text-gray-900">Governance Rights</h5>
                                        <p className="text-sm text-gray-600">Participate in protocol decisions and proposals</p>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="governance" className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">DAO Governance</h4>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Your voting power allows you to participate in important protocol decisions.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white p-4 rounded-lg border">
                                        <h5 className="font-medium text-gray-900 mb-2">Protocol Upgrades</h5>
                                        <p className="text-sm text-gray-600">Vote on smart contract upgrades and improvements</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border">
                                        <h5 className="font-medium text-gray-900 mb-2">Parameter Changes</h5>
                                        <p className="text-sm text-gray-600">Influence interest rates and other protocol parameters</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border">
                                        <h5 className="font-medium text-gray-900 mb-2">Treasury Management</h5>
                                        <p className="text-sm text-gray-600">Decide on treasury allocation and spending</p>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
