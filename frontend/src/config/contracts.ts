// Contract addresses and configuration
// Updated with deployed contract addresses

export const CONTRACTS = {
    // Deployed contract addresses on 0G Galileo Testnet (Chain ID: 16602)
    REBASE_TOKEN: "0xe1927760CE13363e0813d9fcDbd2ab6771A6585a",
    POOL: "0xf6C7bF63A9E8C33A16e35783cDb4984f86e55602",
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