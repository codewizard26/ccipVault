# 🌟 0G Smart Vault

A decentralized interest-bearing vault built on the 0G network that allows users to deposit 0G tokens and earn interest through rebase token mechanics.

## 🎉 Deployment Status

### 📋 Contract Addresses (0G Galileo Testnet - Chain ID 16602)

| Contract | Address | Status |
|----------|---------|--------|
| **RebaseToken** | `0xe1927760CE13363e0813d9fcDbd2ab6771A6585a` | ✅ Deployed |
| **Pool** | `0xf6C7bF63A9E8C33A16e35783cDb4984f86e55602` | ✅ Deployed |
| **Vault** | `0x056c765EEDe2Da129d36d7bBA656B1f0f8d30D7f` | ✅ Deployed |

### 🔧 Configuration
- **Network:** 0G Galileo Testnet (Chain ID: 16602)
- **RPC:** `https://evmrpc-testnet.0g.ai`
- **Block Explorer:** `https://galileo.0g.ai`

### ✅ Deployment Status
- ✅ **Permissions:** All roles granted correctly
- ✅ **Test Results:** Successful deposit of 0.1 0G tokens
- ✅ **Frontend:** Contract addresses updated
- ✅ **Network:** Proper chain detection & switching

## 🚀 Features

### Core Features
1. **Interest-Bearing Vault**
   - Deposit 0G tokens to earn interest
   - No lock-up periods for deposits/withdrawals
   - Automatic interest calculations

2. **Rebase Token Mechanics**
   - Dynamic balance calculation
   - Automatic token rebasing
   - Interest accrual through rebasing

3. **On-chain 0G Storage (KV)**
   - Automatically stores transaction snapshots (keyed by tx hash) on 0G Storage
   - Root hash is surfaced in UI and toast notifications on upload/download
   - Seamless retrieval for audit and historical proof

4. **AI-Powered Analytics via 0G Compute**
   - Broker-backed connection to verified providers (TEE/TeeML)
   - Full vault analysis and Q&A (“Ask a question about your vault”)
   - Secure per-request signed headers, optional result verification
   
### Technical Implementation
- **On-chain Storage (0G KV)**
  - Tx hash → wallet address and transaction metadata stored on 0G KV
  - Root hash persisted and shown on UI; download supported from History

- **Off-chain Storage (Neon DB)**
  - `vault_transactions` table for deposits/withdrawals and root hashes
  - Used for fast dashboards, 4-hour interval analytics, and model context

- **Analytics & AI (0G Compute + OpenAI SDK)**
  - Authenticated requests to providers; model metadata resolved at runtime
  - Full analysis and custom Q&A endpoints via Next.js API routes

## 📈 Development Roadmap

### Phase 1: Core Infrastructure ✅
- [x] Smart contract development
- [x] Vault UI with deposit/withdraw functionality
- [x] Basic dashboard implementation
- [x] Network integration & switching
- [x] MetaMask integration

### Phase 2: 0G Storage Integration ✅
- [x] Automatic 0G KV storage on tx confirmation
- [x] Root hash surfaced in UI and toasts
- [x] Snapshot fetch from History (modal view)

### Phase 3: Analytics Platform ✅
- [x] 0G Compute integration (broker + providers)
- [x] Analytics dashboard with 4‑hour interval charts
- [x] AI risk/usage/APR insights
- [x] Vault Q&A powered by 0G Compute

### Phase 4: Advanced Features 🔮
- [ ] Cross-chain integration (CCIP)
- [ ] Multi-token support
- [ ] Advanced governance features
- [ ] Enhanced security features
- [ ] Community features

## 🛠 Quick Start

1. **Clone & Install**
   ```bash
   git clone [repository-url]
   cd frontend
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Connect Wallet**
   - Switch to 0G Galileo Testnet (Chain ID 16602)
   - Use the 0G faucet to get test tokens

## 📚 Documentation

- [Setup Guide](SETUP_GUIDE.md)
- [Vault Mechanics](VAULT_MECHANICS.md)
- [Deployment Guide](DEPLOYMENT_SCRIPTS_GUIDE.md)

## 🔗 Links

- [Documentation](https://docs.0g.ai)
- [GitHub](https://github.com/0g-ai)
- [Twitter](https://twitter.com/0g_protocol)
- [Discord](https://discord.gg/0g)

## 🏗 Project Structure

- `/frontend` - Next.js frontend application
- `/src` - Smart contract source code
- `/test` - Contract test suite
- `/script` - Deployment scripts
- `/lib` - External dependencies

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.