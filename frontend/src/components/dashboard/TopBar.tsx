"use client"

import { useAccount, useDisconnect, useConnect, useChainId } from "wagmi"
import {
  LogOut,
  Copy,
  Check,
  Wallet,
  Network
} from "lucide-react"
import { useState } from "react"
import { injected } from 'wagmi/connectors'

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { NETWORKS } from "@/config/contracts"

export function TopBar() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { connect } = useConnect()
  const chainId = useChainId()
  const [copied, setCopied] = useState(false)

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyToClipboard = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isCorrectNetwork = chainId === NETWORKS.GALILEO.id

  const handleConnect = async () => {
    try {
      await connect({ connector: injected() })
    } catch (error) {
      console.error('Connection failed:', error)
    }
  }

  if (!isConnected) {
    return (
      <div className="flex h-16 items-center justify-between px-6 border-b border-blue-100 bg-white shadow-sm">
        <div className="flex items-center space-x-2">
          <Network className="w-5 h-5 text-blue-400" />
          <span className="text-sm text-blue-600">Not connected to 0G Network</span>
        </div>
        <Button
          onClick={handleConnect}
          className="bg-blue-600 hover:bg-blue-700 text-white transition-all px-6 py-2 text-sm font-medium rounded-xl shadow-sm"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-16 items-center justify-between px-6 border-b border-blue-100 bg-white shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 ${isCorrectNetwork ? 'bg-green-500' : 'bg-yellow-500'} rounded-full animate-pulse`}></div>
          <span className="text-sm text-blue-600 font-medium">
            {isCorrectNetwork ? 'Connected to 0G' : 'Wrong Network'}
          </span>
        </div>
        <Separator orientation="vertical" className="h-6 bg-blue-100" />
        <div className="flex items-center space-x-2">
          <Network className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-blue-600">
            {isCorrectNetwork ? '0G Galileo Network' : 'Please switch to 0G Network'}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-blue-50 rounded-xl px-4 py-2 border border-blue-100 transition-all hover:border-blue-200 shadow-sm">
          <Avatar className="w-6 h-6">
            <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
              {address ? address.slice(2, 4).toUpperCase() : "??"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-blue-900">
            {address ? formatAddress(address) : "Unknown"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-6 w-6 p-0 hover:bg-blue-100 text-blue-600 transition-colors"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-600" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => disconnect()}
          className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
