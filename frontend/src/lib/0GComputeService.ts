import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import OpenAI from "openai";

// Official 0G Services from documentation
const OFFICIAL_PROVIDERS = {
    "gpt-oss-120b": "0xf07240Efa67755B5311bc75784a061eDB47165Dd",
    "deepseek-r1-70b": "0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3"
};

// Initialize 0G compute service
export class ZGComputeService {
    private broker: any;
    private wallet: ethers.Wallet;
    private provider: ethers.JsonRpcProvider;
    private openai: OpenAI | null = null;
    private currentProvider: string | null = null;
    private currentModel: string | null = null;

    constructor() {
        this.provider = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");

        // Check if private key is properly configured
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey || privateKey === "0xyour_private_key_here" || privateKey.includes("your_private_key")) {
            throw new Error("Private key not configured. Please set PRIVATE_KEY in your environment variables.");
        }

        this.wallet = new ethers.Wallet(privateKey, this.provider);
    }

    // Initialize the broker
    async initialize(): Promise<void> {
        try {
            console.log('Initializing 0G Compute service...');
            this.broker = await createZGComputeNetworkBroker(this.wallet);
            console.log('Broker created successfully');

            // Check balance
            const account = await this.broker.ledger.getLedger();
            console.log(`0G Compute Balance: ${ethers.formatEther(account.totalBalance)} OG`);

            // Try to use official providers first
            await this.tryOfficialProviders();
        } catch (error) {
            console.error('Failed to initialize 0G compute service:', error);
            throw error;
        }
    }

    // Try to connect to official providers
    private async tryOfficialProviders(): Promise<void> {
        for (const [model, providerAddress] of Object.entries(OFFICIAL_PROVIDERS)) {
            try {
                console.log(`Trying to connect to ${model} (${providerAddress})...`);

                // Acknowledge provider signer
                await this.broker.inference.acknowledgeProviderSigner(providerAddress);
                console.log(`Successfully acknowledged provider: ${model}`);

                // Get service metadata
                const { endpoint, model: serviceModel } = await this.broker.inference.getServiceMetadata(providerAddress);
                console.log(`Service endpoint: ${endpoint}, Model: ${serviceModel}`);

                // Set current provider and model
                this.currentProvider = providerAddress;
                this.currentModel = serviceModel;

                // Initialize OpenAI client
                this.openai = new OpenAI({
                    baseURL: endpoint,
                    apiKey: "", // Empty string for 0G compute
                    defaultHeaders: {} // Will be set per request
                });

                console.log(`Successfully connected to ${model} provider`);
                return; // Success, exit the loop
            } catch (error) {
                console.warn(`Failed to connect to ${model}:`, error);
                continue; // Try next provider
            }
        }

        // If all official providers fail, try listing services
        console.log('All official providers failed, trying to list available services...');
        try {
            const services = await this.broker.inference.listService();
            console.log('Available services:', services);

            if (services.length > 0) {
                const service = services[0];
                console.log(`Trying first available service: ${service.provider}`);

                await this.broker.inference.acknowledgeProviderSigner(service.provider);
                const { endpoint, model } = await this.broker.inference.getServiceMetadata(service.provider);

                this.currentProvider = service.provider;
                this.currentModel = model;

                this.openai = new OpenAI({
                    baseURL: endpoint,
                    apiKey: "",
                    defaultHeaders: {}
                });

                console.log('Successfully connected to first available service');
                return;
            }
        } catch (error) {
            console.error('Failed to list services:', error);
        }

        throw new Error('No 0G compute providers available');
    }


    // Generate AI analysis for vault data
    async generateVaultAnalysis(vaultData: {
        tvl: number;
        totalDeposits: number;
        totalWithdrawals: number;
        uniqueDepositors: number;
        currentAPY: number;
        recentTransactions: any[];
        timeRange: string;
    }): Promise<string> {
        const prompt = this.createAnalysisPrompt(vaultData);
        return await this.generateAIResponse(prompt);
    }

    // Ask a custom question about the vault
    async askVaultQuestion(question: string, vaultData: {
        tvl: number;
        totalDeposits: number;
        totalWithdrawals: number;
        uniqueDepositors: number;
        currentAPY: number;
        recentTransactions: any[];
        timeRange: string;
    }): Promise<string> {
        const prompt = this.createQuestionPrompt(question, vaultData);
        return await this.generateAIResponse(prompt);
    }

    // Generate AI response using 0G compute
    private async generateAIResponse(prompt: string): Promise<string> {
        if (!this.currentProvider || !this.currentModel) {
            throw new Error('0G compute service not initialized');
        }

        try {
            // Generate auth headers for this request
            const messages = [{ role: "user" as const, content: prompt }];
            const headers = await this.broker.inference.getRequestHeaders(
                this.currentProvider,
                JSON.stringify(messages)
            );

            // Get service metadata for endpoint
            const { endpoint } = await this.broker.inference.getServiceMetadata(this.currentProvider);

            // Create OpenAI client with headers for this request
            const openai = new OpenAI({
                baseURL: endpoint,
                apiKey: "", // Empty string for 0G compute
                defaultHeaders: headers
            });

            // Generate AI response
            const completion = await openai.chat.completions.create({
                messages: messages,
                model: this.currentModel,
                temperature: 0.7,
                max_tokens: 1000
            });

            const answer = completion.choices[0].message.content!;
            const chatID = completion.id;

            // Verify response (optional, only for verifiable services)
            try {
                const isValid = await this.broker.inference.processResponse(
                    this.currentProvider,
                    answer,
                    chatID
                );
                console.log('Response verification:', isValid);
            } catch (verifyError) {
                console.warn('Response verification failed:', verifyError);
            }

            return answer;
        } catch (error) {
            console.error('Failed to generate AI response:', error);
            throw error;
        }
    }

    // Create analysis prompt based on vault data
    private createAnalysisPrompt(vaultData: any): string {
        return `
You are a DeFi vault analyst. Analyze the following vault data and provide insights about growth, usage, APR, and investment recommendations.

Vault Data:
- Total Value Locked (TVL): $${vaultData.tvl.toLocaleString()}
- Total Deposits: $${vaultData.totalDeposits.toLocaleString()}
- Total Withdrawals: $${vaultData.totalWithdrawals.toLocaleString()}
- Unique Depositors: ${vaultData.uniqueDepositors}
- Current APY: ${vaultData.currentAPY}%
- Time Range: ${vaultData.timeRange}
- Recent Transactions: ${vaultData.recentTransactions.length} transactions

Please provide a comprehensive analysis covering:

1. **Growth Analysis**: 
   - How is the vault performing in terms of growth?
   - What are the key growth indicators?
   - Is the growth sustainable?

2. **Usage Patterns**:
   - What do the deposit/withdrawal patterns tell us?
   - How active are users?
   - What are the usage trends?

3. **APR Analysis**:
   - Is the current APY competitive?
   - How does it compare to market rates?
   - What factors affect the APY?

4. **Risk Assessment**:
   - What are the main risks?
   - How concentrated are the funds?
   - What should users be aware of?

5. **Investment Recommendation**:
   - Should users deposit more funds?
   - What's the optimal strategy?
   - Any warnings or opportunities?

Please provide actionable insights that help users make informed decisions. Keep the analysis professional but accessible.
        `.trim();
    }

    // Create question prompt based on user question and vault data
    private createQuestionPrompt(question: string, vaultData: any): string {
        return `
You are a DeFi vault analyst. A user has asked a specific question about their vault. Please provide a detailed, helpful answer based on the vault data provided.

User Question: "${question}"

Vault Data:
- Total Value Locked (TVL): $${vaultData.tvl.toLocaleString()}
- Total Deposits: $${vaultData.totalDeposits.toLocaleString()}
- Total Withdrawals: $${vaultData.totalWithdrawals.toLocaleString()}
- Unique Depositors: ${vaultData.uniqueDepositors}
- Current APY: ${vaultData.currentAPY}%
- Time Range: ${vaultData.timeRange}
- Recent Transactions: ${vaultData.recentTransactions.length} transactions

Please provide a comprehensive answer that:
1. Directly addresses the user's question
2. Uses the vault data to support your answer
3. Provides actionable insights when relevant
4. Explains any technical concepts clearly
5. Offers additional context that might be helpful

Keep your response professional, accurate, and focused on helping the user make informed decisions about their vault.
        `.trim();
    }


    // Get current balance
    async getBalance(): Promise<string> {
        try {
            const account = await this.broker.ledger.getLedger();
            return ethers.formatEther(account.totalBalance);
        } catch (error) {
            console.error('Failed to get balance:', error);
            throw error;
        }
    }

    // List available services
    async listServices(): Promise<any[]> {
        try {
            return await this.broker.inference.listService();
        } catch (error) {
            console.error('Failed to list services:', error);
            throw error;
        }
    }
}

// Singleton instance
let zgComputeService: ZGComputeService | null = null;

export async function getZGComputeService(): Promise<ZGComputeService> {
    if (!zgComputeService) {
        zgComputeService = new ZGComputeService();
        await zgComputeService.initialize();
    }
    return zgComputeService;
}
