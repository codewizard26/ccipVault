// Contract addresses and configuration
// Updated with deployed contract addresses

import RebaseTokenABI from "../contracts/RebaseToken.json";
import RebaseTokenPoolABI from "../contracts/RebaseTokenPool.json";
import VaultABI from "../contracts/Vault.json";

export const contracts = {
    rebaseToken: {
        address: "0xe1927760CE13363e0813d9fcDbd2ab6771A6585a",
        abi: RebaseTokenABI.abi,
    },
    rebaseTokenPool: {
        address: "0x5d812E2DECb3fB88DfA3fC5758b615E49BdCBaD8",
        abi: RebaseTokenPoolABI.abi,
    },
    vault: {
        address: "0x056c765EEDe2Da129d36d7bBA656B1f0f8d30D7f",
        abi: VaultABI.abi,
    },
};

export const CONTRACTS = {
    // Deployed contract addresses on 0G Galileo Testnet (Chain ID: 16602)
    REBASE_TOKEN: "0xe1927760CE13363e0813d9fcDbd2ab6771A6585a",
    POOL: "0x5d812E2DECb3fB88DfA3fC5758b615E49BdCBaD8",
    VAULT: "0x056c765EEDe2Da129d36d7bBA656B1f0f8d30D7f",
};

export const NETWORKS = {
    GALILEO: {
        id: 16602, // 0x40d9 in hex - actual 0G Galileo Testnet chain ID
        name: "0G Galileo Testnet",
        rpcUrl: "https://evmrpc-testnet.0g.ai",
        blockExplorer: "https://galileo.0g.ai",
        nativeCurrency: {
            name: "0G",
            symbol: "0G",
            decimals: 18,
        },
    },
};

export const CHAIN_ID = NETWORKS.GALILEO.id; 