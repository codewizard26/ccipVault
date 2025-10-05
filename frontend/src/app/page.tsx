'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useRouter } from 'next/navigation';
import { Database, Cpu, Shield, ArrowRight, ExternalLink, Link, Coins, BarChart3, Timer, GitMerge } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center transform rotate-3 transition-transform hover:rotate-6">
                  <span className="text-white font-bold text-lg">0G</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent">
                  Smart Vault
                </h1>
                <p className="text-sm text-blue-600">Powered by 0G</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <a
                href="https://docs.0g.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center group"
              >
                Documentation
                <ExternalLink className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" />
              </a>
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative py-32 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50 opacity-70"></div>
          <div className="container mx-auto text-center max-w-4xl relative z-10">
            <div className="inline-block mb-4 px-6 py-2 bg-blue-100 rounded-full">
              <span className="text-blue-600 font-semibold">Intelligent DeFi Infrastructure</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-blue-900 mb-6 leading-tight">
              The Future of <br />
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Smart Vaults
              </span>
            </h1>
            <p className="text-xl text-blue-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              Experience the next generation of decentralized finance with AI-powered analytics
              and immutable snapshot storage on 0G infrastructure.
            </p>
            <div className="flex items-center justify-center space-x-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="group relative px-8 py-4 bg-blue-600 rounded-xl overflow-hidden transition-all hover:bg-blue-700"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative flex items-center text-white font-medium text-lg">
                  Launch App
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
              <a
                href="https://docs.0g.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="group px-8 py-4 border-2 border-blue-200 text-blue-600 rounded-xl font-medium text-lg transition-all hover:border-blue-300 hover:bg-blue-50 flex items-center"
              >
                Explore Docs
                <ExternalLink className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
            <div className="w-2 h-16 bg-gradient-to-b from-blue-200 to-transparent"></div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white relative">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto text-center mb-16">
              <h2 className="text-4xl font-bold text-blue-900 mb-4">
                Powered by Innovation
              </h2>
              <p className="text-blue-600">
                Leverage cutting-edge technology to secure and analyze your assets
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: Database,
                  title: "Immutable Snapshots",
                  description: "Every transaction is securely stored on 0G Storage with verifiable proofs and instant access.",
                  gradient: "from-blue-400 to-blue-600"
                },
                {
                  icon: Cpu,
                  title: "AI-Powered Insights",
                  description: "Advanced analytics powered by 0G Compute help you make informed decisions about your portfolio.",
                  gradient: "from-indigo-400 to-blue-600"
                },
                {
                  icon: Shield,
                  title: "Enterprise Security",
                  description: "Bank-grade security with optional snapshot hashing and comprehensive audit trails.",
                  gradient: "from-blue-600 to-indigo-600"
                },
                {
                  icon: Link,
                  title: "Cross Chain Integration",
                  description: "Seamless cross-chain asset transfers powered by Chainlink CCIP for enhanced interoperability.",
                  gradient: "from-blue-500 to-indigo-500"
                }
              ].map((feature, index) => (
                <div key={index} className="group relative">
                  <div className="absolute inset-0 bg-blue-50 rounded-2xl transform transition-transform group-hover:scale-105 group-hover:shadow-lg"></div>
                  <div className="relative p-8">
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 transform transition-transform group-hover:rotate-6`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-blue-900 mb-4">{feature.title}</h3>
                    <p className="text-blue-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-blue-900 text-center mb-12">How It Works</h2>
            <div className="max-w-4xl mx-auto">
              {/* Project Overview */}
              <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border border-blue-100 mb-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200 to-transparent opacity-20 rounded-full transform translate-x-32 -translate-y-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-200 to-transparent opacity-20 rounded-full transform -translate-x-24 translate-y-24"></div>

                <div className="relative">
                  <h3 className="text-3xl font-bold text-blue-900 mb-4 flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mr-4 transform rotate-3">
                      <Coins className="w-6 h-6 text-white" />
                    </div>
                    Rebase Token Vault
                  </h3>
                  <p className="text-blue-600 mb-12 text-lg max-w-3xl">
                    A decentralized interest-bearing vault built on the 0G network that allows users to deposit 0G tokens
                    and earn interest through rebase token mechanics.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      {
                        icon: BarChart3,
                        title: "Interest-Bearing Vault",
                        description: "Deposit 0G tokens to earn interest",
                        gradient: "from-blue-400 to-blue-600"
                      },
                      {
                        icon: GitMerge,
                        title: "Rebase Token Mechanics",
                        description: "Automatic token rebasing with interest accrual",
                        gradient: "from-indigo-400 to-blue-600"
                      },
                      {
                        icon: Timer,
                        title: "Instant Access",
                        description: "No lock-up periods for deposits/withdrawals",
                        gradient: "from-blue-600 to-indigo-600"
                      }
                    ].map((feature, index) => (
                      <div key={index} className="group bg-white p-6 rounded-xl border border-blue-100 hover:shadow-lg transition-all transform hover:-translate-y-1">
                        <div className={`w-12 h-12 mb-4 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center transform transition-transform group-hover:rotate-6`}>
                          <feature.icon className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-blue-900 mb-2">{feature.title}</h4>
                        <p className="text-blue-600">{feature.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Process Steps */}
              <div className="space-y-6 relative">
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-600 via-blue-400 to-transparent"></div>
                {[
                  {
                    title: 'Deposit & Withdraw',
                    description: 'User deposits/withdraws from vault with automatic interest calculations.',
                    icon: Coins
                  },
                  {
                    title: 'Snapshot Creation',
                    description: 'A JSON snapshot is created and stored on 0G Storage with immutable proof.',
                    icon: Database
                  },
                  {
                    title: 'Data Processing',
                    description: 'Snapshots are aggregated and processed via 0G Compute for analytics.',
                    icon: Cpu
                  },
                  {
                    title: 'Analytics Dashboard',
                    description: 'Users get real-time analytics dashboards + downloadable reports.',
                    icon: BarChart3
                  }
                ].map((step, index) => (
                  <div key={index} className="flex items-start space-x-4 bg-white p-6 rounded-xl border border-blue-100 ml-8 hover:shadow-md transition-all relative">
                    <div className="absolute -left-8 w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center transform -translate-x-1/2">
                      <span className="text-white font-bold">{index + 1}</span>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <step.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-blue-900 mb-1">{step.title}</h4>
                      <p className="text-blue-600">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Showcase Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-blue-900 text-center mb-12">Platform Showcase</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="bg-blue-50 p-8 rounded-2xl border border-blue-100">
                <h3 className="text-xl font-semibold text-blue-900 mb-4">Snapshot Viewer</h3>
                <div className="bg-white p-4 rounded-xl border border-blue-100">
                  <pre className="text-sm text-blue-600 overflow-x-auto">
                    {JSON.stringify({
                      type: "deposit",
                      amount: "1.5 0G",
                      timestamp: "2024-01-01T12:00:00Z",
                      hash: "0x123...abc"
                    }, null, 2)}
                  </pre>
                </div>
              </div>
              <div className="bg-blue-50 p-8 rounded-2xl border border-blue-100">
                <h3 className="text-xl font-semibold text-blue-900 mb-4">Analytics Dashboard</h3>
                <div className="aspect-video bg-white rounded-xl border border-blue-100 flex items-center justify-center">
                  <p className="text-blue-600">Interactive Charts & Analytics</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-blue-900 text-center mb-12">Development Roadmap</h2>
            <div className="max-w-3xl mx-auto space-y-6">
              {[
                { phase: "Phase 1", title: "Vault UI with Deposit/Withdraw", status: "complete" },
                { phase: "Phase 2", title: "0G Storage for Snapshots", status: "complete" },
                { phase: "Phase 3", title: "0G Compute Analytics Dashboard", status: "complete" },
                { phase: "Phase 4", title: "Cross Chain Integration (CCIP) & Advanced Features", status: "future" }
              ].map((item) => (
                <div key={item.phase} className="flex items-center bg-white p-6 rounded-xl border border-blue-100">
                  <div className="w-24 font-medium text-blue-600">{item.phase}</div>
                  <div className="flex-1 text-blue-900">{item.title}</div>
                  <div>
                    {item.status === 'complete' && <span className="text-green-500">✅</span>}
                    {item.status === 'current' && <span className="text-blue-500">🔄</span>}
                    {item.status === 'future' && <span>🔮</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-blue-100">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-6 md:mb-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">0G</span>
              </div>
              <span className="text-blue-600 font-medium">Smart Vault</span>
            </div>
            <div className="flex items-center space-x-8">
              <a href="https://docs.0g.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 transition-colors">Docs</a>
              <a href="https://github.com/0g-ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 transition-colors">GitHub</a>
              <a href="https://twitter.com/0g_protocol" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 transition-colors">Twitter</a>
              <a href="https://discord.gg/0g" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 transition-colors">Discord</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
