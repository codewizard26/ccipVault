import { ZgFile, Indexer } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Network Constants
const RPC_URL = 'https://evmrpc-testnet.0g.ai/';

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

export async function uploadFile(filePath: string) {
    // Get signer and indexer instances
    const signer = getSigner();
    const indexer = await getIndexer();

    // Create file object from file path
    const file = await ZgFile.fromFilePath(filePath);

    // Generate Merkle tree for verification
    const [tree, treeErr] = await file.merkleTree();
    if (treeErr !== null) {
        throw new Error(`Error generating Merkle tree: ${treeErr}`);
    }

    // Get root hash for future reference
    console.log("File Root Hash:", tree?.rootHash());

    try {
        // Upload to network
        const [tx, uploadErr] = await indexer.upload(file, RPC_URL, signer as any);
        if (uploadErr !== null) {
            throw new Error(`Upload error: ${uploadErr}`);
        }

        console.log("Upload successful! Transaction:", tx);

        // Always close the file when done
        await file.close();

        return { rootHash: tree?.rootHash(), txHash: tx };
    } catch (error) {
        // Always close the file even if upload fails
        await file.close();

        // Provide more specific error message for indexer issues
        if (error instanceof Error && error.message.includes('Cannot read properties of null')) {
            throw new Error('0g indexer service is currently unavailable. The indexer service may be down or experiencing issues. Please try again later or check the 0g network status.');
        }

        throw error;
    }
}

export async function downloadFile(rootHash: string, outputPath: string) {
    // Get indexer instance
    const indexer = await getIndexer();

    // withProof = true enables Merkle proof verification
    const err = await indexer.download(rootHash, outputPath, true);
    if (err !== null) {
        throw new Error(`Download error: ${err}`);
    }
    console.log("Download successful!");
}

// New function to upload JSON data
export async function uploadJsonData(
    jsonData: any,
    fileName: string = 'data.json'
) {
    // Ensure temp directory exists (use serverless-safe tmp dir)
    const tempDir = path.join(process.env.TMPDIR || os.tmpdir(), '0g-temp');
    await fs.mkdir(tempDir, { recursive: true });

    const tempFilePath = path.join(tempDir, `${Date.now()}-${fileName}`);

    try {
        // Convert JSON data to string with pretty formatting
        const jsonString = JSON.stringify(jsonData, null, 2);

        // Write JSON data to temporary file
        await fs.writeFile(tempFilePath, jsonString, 'utf-8');
        console.log(`JSON data written to temporary file: ${tempFilePath}`);

        // Upload the file using your existing function
        const result = await uploadFile(tempFilePath);

        // Clean up temporary file
        await fs.unlink(tempFilePath);
        console.log(`Temporary file cleaned up: ${tempFilePath}`);

        return {
            ...result,
            fileName: fileName,
            size: Buffer.byteLength(jsonString, 'utf-8')
        };
    } catch (error) {
        // Ensure cleanup even if upload fails
        try {
            await fs.unlink(tempFilePath);
        } catch (cleanupError) {
            console.warn(`Failed to cleanup temporary file: ${tempFilePath}`);
        }
        throw error;
    }
}

// Function to download and parse JSON data
export async function downloadJsonData(
    rootHash: string,
    outputFileName: string = 'downloaded-data.json'
): Promise<any> {
    // Ensure temp directory exists (use serverless-safe tmp dir)
    const tempDir = path.join(process.env.TMPDIR || os.tmpdir(), '0g-temp');
    await fs.mkdir(tempDir, { recursive: true });

    const tempOutputPath = path.join(tempDir, `${Date.now()}-${outputFileName}`);

    try {
        // Download the file
        await downloadFile(rootHash, tempOutputPath);

        // Read and parse the JSON file
        const fileContent = await fs.readFile(tempOutputPath, 'utf-8');
        const jsonData = JSON.parse(fileContent);

        // Clean up temporary file
        await fs.unlink(tempOutputPath);
        console.log(`Downloaded JSON file cleaned up: ${tempOutputPath}`);

        console.log("JSON download and parse successful!");
        return jsonData;
    } catch (error) {
        // Ensure cleanup
        try {
            await fs.unlink(tempOutputPath);
        } catch (cleanupError) {
            console.warn(`Failed to cleanup downloaded file: ${tempOutputPath}`);
        }
        throw error;
    }
}

// Function to upload transaction data to 0G storage
export async function uploadTransactionData(
    transactionData: {
        transactionType: string;
        transactionHash: string;
        amount: string;
        walletAddress: string;
        chainId?: number;
        timestamp?: string;
    }
) {
    try {
        // Create a comprehensive transaction record
        const fullTransactionData = {
            ...transactionData,
            timestamp: transactionData.timestamp || new Date().toISOString(),
            chainId: transactionData.chainId || 16602, // Default to 0G testnet
            version: '1.0',
            type: 'vault_transaction'
        };

        const fileName = `transaction-${transactionData.transactionHash}-${Date.now()}.json`;

        console.log('Uploading transaction data to 0G storage:', {
            transactionHash: transactionData.transactionHash,
            fileName
        });

        const result = await uploadJsonData(fullTransactionData, fileName);

        console.log('Transaction data uploaded to 0G storage successfully:', result);
        return result;
    } catch (error) {
        console.error('Failed to upload transaction data to 0G storage:', error);
        throw error;
    }
}