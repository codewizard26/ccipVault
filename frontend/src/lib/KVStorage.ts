import { Indexer, Batcher, KvClient } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';

// Network Constants
const RPC_URL = 'https://evmrpc-testnet.0g.ai';
const FLOW_CONTRACT_ADDRESS = '0x22E03a6A89B950F1c82ec5e74F8eCa321a105296';
const KV_CLIENT_URL = 'http://3.101.147.150:6789';

// Multiple indexer endpoints for fallback
const INDEXER_ENDPOINTS = [
    'https://indexer-storage-testnet-turbo.0g.ai',
    'https://indexer-storage-testnet-standard.0g.ai',
    'https://testnet-indexer.0g.ai'
];

// Lazy initialization functions
function getSigner() {
    const raw = process.env.PRIVATE_KEY;
    if (!raw) {
        throw new Error('PRIVATE_KEY environment variable is not set');
    }

    // Normalize: trim whitespace/newlines, ensure 0x-prefix, validate length
    const trimmed = raw.trim().replace(/^0x/i, '');
    if (!/^[0-9a-fA-F]{64}$/.test(trimmed)) {
        throw new Error('Invalid PRIVATE_KEY format. Expected 64 hex chars (with or without 0x).');
    }
    const normalized = '0x' + trimmed;

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    return new ethers.Wallet(normalized, provider);
}

async function getIndexer() {
    for (const endpoint of INDEXER_ENDPOINTS) {
        try {
            console.log(`Trying indexer endpoint: ${endpoint}`);
            const indexer = new Indexer(endpoint);

            // Test the indexer by trying to get sharded nodes
            const testResponse = await indexer.getShardedNodes();
            if (testResponse && testResponse.trusted) {
                console.log(`Successfully connected to indexer: ${endpoint}`);
                return indexer;
            }
        } catch (error) {
            console.warn(`Indexer endpoint ${endpoint} failed:`, error instanceof Error ? error.message : String(error));
            continue;
        }
    }

    throw new Error('All indexer endpoints are currently unavailable. Please check the 0g network status or try again later.');
}

// Upload data to 0G-KV
export async function uploadToKV(streamId: string, key: string, value: string) {
    try {
        const indexer = await getIndexer();
        const signer = getSigner();

        const [nodes, err] = await indexer.selectNodes(1);
        if (err !== null) {
            throw new Error(`Error selecting nodes: ${err}`);
        }

        const flowContract = new ethers.Contract(
            FLOW_CONTRACT_ADDRESS,
            ['function flow(bytes32, bytes) external'],
            signer
        ) as any; // Type assertion for 0G SDK compatibility

        const batcher = new Batcher(1, nodes, flowContract, RPC_URL);

        const keyBytes = Uint8Array.from(Buffer.from(key, 'utf-8'));
        const valueBytes = Uint8Array.from(Buffer.from(value, 'utf-8'));
        batcher.streamDataBuilder.set(streamId, keyBytes, valueBytes);

        const [tx, batchErr] = await batcher.exec();
        if (batchErr !== null) {
            throw new Error(`Batch execution error: ${batchErr}`);
        }

        console.log("KV upload successful! TX:", tx);
        return { success: true, txHash: tx };
    } catch (error) {
        console.error('KV upload error:', error);
        throw error;
    }
}

// Download data from 0G-KV
export async function downloadFromKV(streamId: string, key: string) {
    try {
        const kvClient = new KvClient(KV_CLIENT_URL);
        const keyBytes = Uint8Array.from(Buffer.from(key, 'utf-8'));
        const value = await kvClient.getValue(streamId, ethers.encodeBase64(keyBytes) as any);
        return value;
    } catch (error) {
        console.error('KV download error:', error);
        throw error;
    }
}

// Upload transaction hash and wallet address to KV storage
export async function storeTransactionInKV(transactionHash: string, walletAddress: string) {
    try {
        // Use a consistent stream ID for transaction storage
        const streamId = 'transaction-storage';

        console.log(`Storing transaction ${transactionHash} with wallet ${walletAddress} in KV storage`);

        const result = await uploadToKV(streamId, transactionHash, walletAddress);

        console.log('Transaction stored in KV storage successfully:', result);
        return result;
    } catch (error) {
        console.error('Failed to store transaction in KV storage:', error);
        throw error;
    }
}

// Retrieve wallet address from transaction hash
export async function getWalletFromTransaction(transactionHash: string) {
    try {
        const streamId = 'transaction-storage';

        console.log(`Retrieving wallet address for transaction ${transactionHash} from KV storage`);

        const walletAddress = await downloadFromKV(streamId, transactionHash);

        console.log('Wallet address retrieved from KV storage:', walletAddress);
        return walletAddress;
    } catch (error) {
        console.error('Failed to retrieve wallet address from KV storage:', error);
        throw error;
    }
}
