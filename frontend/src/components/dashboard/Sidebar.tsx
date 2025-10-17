"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Vault,
  History,
  Settings,
  Wallet,
  TrendingUp,
  Shield,
  Brain,
  Lock
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const navigation = [
  {
    name: "Vault",
    href: "/dashboard",
    icon: Vault,
    description: "Manage your vault deposits and withdrawals"
  },
  {
    name: "Staking",
    href: "/dashboard/staking",
    icon: Lock,
    description: "Stake tokens for voting power"
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: TrendingUp,
    description: "View vault analytics and insights"
  },
  {
    name: "AI Analysis",
    href: "/dashboard/ai-analysis",
    icon: Brain,
    description: "Get AI-powered vault insights"
  },
  {
    name: "History",
    href: "/dashboard/history",
    icon: History,
    description: "View transaction history"
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    description: "Configure your preferences"
  }
]

const stats = [
  {
    name: "Total Value Locked",
    value: "$1,234,567",
    icon: TrendingUp,
    change: "+12.5%",
    changeType: "positive"
  },
  {
    name: "APY",
    value: "8.5%",
    icon: Shield,
    change: "+0.2%",
    changeType: "positive"
  }
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-white shadow-sm border-r border-blue-100">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center px-6 bg-white border-b border-blue-100">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-xl font-semibold text-blue-900 truncate">Vault</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start h-12 px-4 rounded-xl transition-all",
                  isActive
                    ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 shadow-sm"
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 min-w-[20px]",
                  isActive ? "text-blue-600" : "text-gray-400"
                )} />
                <div className="flex flex-col items-start ml-3 min-w-0 flex-1">
                  <span className="font-medium truncate w-full">{item.name}</span>
                  <span className="text-xs text-gray-500 truncate w-full">{item.description}</span>
                </div>
              </Button>
            </Link>
          )
        })}
      </nav>

      <Separator className="mx-4 bg-blue-100" />

      {/* Stats */}
      <div className="p-4 space-y-4">
        <h3 className="text-sm font-medium text-blue-900 uppercase tracking-wider truncate">
          Vault Stats
        </h3>
        <div className="space-y-3">
          {stats.map((stat) => (
            <div key={stat.name}
              className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-100 hover:border-blue-200 transition-all shadow-sm"
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <stat.icon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 truncate">{stat.name}</p>
                  <p className="text-lg font-bold text-blue-900 truncate">{stat.value}</p>
                </div>
              </div>
              <div className={cn(
                "text-sm font-medium flex-shrink-0 ml-2",
                stat.changeType === "positive" ? "text-emerald-600" : "text-red-600"
              )}>
                {stat.change}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
