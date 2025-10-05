import { NextRequest, NextResponse } from 'next/server';
import { getZGComputeService } from '@/lib/0GComputeService';
import { DatabaseService } from '@/lib/database';

// POST /api/ai-analysis - Generate AI analysis for vault data or answer questions
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { timeRange = '1M', question } = body;

        // Get vault data from database
        const allTransactions = await DatabaseService.getTransactions();

        // Calculate basic metrics
        const totalDeposits = allTransactions
            .filter(tx => tx.transaction_type === 'deposit')
            .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

        const totalWithdrawals = allTransactions
            .filter(tx => tx.transaction_type === 'withdraw')
            .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

        const tvl = totalDeposits - totalWithdrawals;

        // Count unique depositors
        const uniqueDepositors = new Set(
            allTransactions
                .filter(tx => tx.transaction_type === 'deposit')
                .map(tx => tx.transaction_hash)
        ).size;

        // Get recent transactions (last 10)
        const recentTransactions = allTransactions
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);

        // Prepare vault data for AI analysis
        const vaultData = {
            tvl,
            totalDeposits,
            totalWithdrawals,
            uniqueDepositors,
            currentAPY: 8.5, // Static for now
            recentTransactions: recentTransactions.map(tx => ({
                type: tx.transaction_type,
                amount: parseFloat(tx.amount),
                timestamp: tx.timestamp,
                hash: tx.transaction_hash
            })),
            timeRange
        };

        // Generate AI analysis using 0G compute
        const zgService = await getZGComputeService();

        let analysis: string;
        if (question) {
            // Answer user's question
            analysis = await zgService.askVaultQuestion(question, vaultData);
        } else {
            // Generate full analysis
            analysis = await zgService.generateVaultAnalysis(vaultData);
        }

        return NextResponse.json({
            success: true,
            data: {
                analysis,
                vaultData,
                question: question || null,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('AI Analysis API error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate AI analysis'
        }, { status: 500 });
    }
}

// GET /api/ai-analysis - Get 0G compute service status
export async function GET(request: NextRequest) {
    try {
        const zgService = await getZGComputeService();
        const balance = await zgService.getBalance();
        const services = await zgService.listServices();

        return NextResponse.json({
            success: true,
            data: {
                balance,
                servicesCount: services.length,
                services: services.map(service => ({
                    provider: service.provider,
                    serviceType: service.serviceType,
                    model: service.model,
                    verifiability: service.verifiability,
                    inputPrice: service.inputPrice.toString(),
                    outputPrice: service.outputPrice.toString()
                }))
            }
        });
    } catch (error) {
        console.error('AI Analysis status error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get AI analysis status'
        }, { status: 500 });
    }
}
