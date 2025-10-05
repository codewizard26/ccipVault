import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

// Helper function to get 4-hour interval from timestamp
function get4HourInterval(timestamp: Date): string {
    const hour = timestamp.getHours();
    const date = timestamp.toISOString().split('T')[0];

    // Determine which 4-hour interval this hour belongs to
    let intervalStart: number;
    if (hour >= 0 && hour < 4) {
        intervalStart = 0;
    } else if (hour >= 4 && hour < 8) {
        intervalStart = 4;
    } else if (hour >= 8 && hour < 12) {
        intervalStart = 8;
    } else if (hour >= 12 && hour < 16) {
        intervalStart = 12;
    } else if (hour >= 16 && hour < 20) {
        intervalStart = 16;
    } else {
        intervalStart = 20;
    }

    return `${date} ${intervalStart.toString().padStart(2, '0')}:00`;
}

// GET /api/analytics - Get analytics data from vault_transactions table
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const timeRange = searchParams.get('timeRange') || '1M';

        // Calculate date range based on timeRange parameter
        const now = new Date();
        let startDate: Date;

        switch (timeRange) {
            case '1D':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '1W':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '1M':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '3M':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case 'All':
            default:
                startDate = new Date('2024-01-01'); // Start from beginning of year
                break;
        }

        // Get all transactions from database
        const allTransactions = await DatabaseService.getTransactions();

        // Filter transactions by date range
        const filteredTransactions = allTransactions.filter(tx =>
            new Date(tx.timestamp) >= startDate
        );

        // Calculate analytics data
        const analytics = calculateAnalytics(filteredTransactions);

        return NextResponse.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Analytics API error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}

function calculateAnalytics(transactions: any[]) {
    // Calculate basic metrics
    const totalDeposits = transactions
        .filter(tx => tx.transaction_type === 'deposit')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const totalWithdrawals = transactions
        .filter(tx => tx.transaction_type === 'withdraw')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const tvl = totalDeposits - totalWithdrawals;

    // Count unique depositors (assuming we can identify by transaction patterns)
    const uniqueDepositors = new Set(
        transactions
            .filter(tx => tx.transaction_type === 'deposit')
            .map(tx => tx.transaction_hash) // Using hash as proxy for user identification
    ).size;

    // Calculate daily data for charts
    const dailyData = calculateDailyData(transactions);

    // Calculate TVL growth data
    const tvlData = calculateTVLData(transactions);

    // Calculate deposits vs withdrawals data
    const depositsWithdrawalsData = calculateDepositsWithdrawalsData(transactions);

    // Calculate user distribution (simplified)
    const userDistribution = calculateUserDistribution(transactions);

    return {
        overview: {
            tvl,
            totalDeposits,
            totalWithdrawals,
            uniqueDepositors,
            currentAPY: 8.5 // Static for now, can be calculated from rebase data
        },
        charts: {
            tvlData,
            depositsWithdrawalsData,
            userDistribution,
            dailyData,
            rebaseTokenData: calculateRebaseTokenData(transactions)
        }
    };
}

function calculateDailyData(transactions: any[]) {
    const intervalMap = new Map();

    transactions.forEach(tx => {
        const timestamp = new Date(tx.timestamp);
        const timeInterval = get4HourInterval(timestamp);

        if (!intervalMap.has(timeInterval)) {
            intervalMap.set(timeInterval, { date: timeInterval, deposits: 0, withdrawals: 0 });
        }

        const intervalData = intervalMap.get(timeInterval);
        if (tx.transaction_type === 'deposit') {
            intervalData.deposits += parseFloat(tx.amount);
        } else {
            intervalData.withdrawals += parseFloat(tx.amount);
        }
    });

    return Array.from(intervalMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-180); // Last 30 days * 6 intervals per day = 180 intervals
}

function calculateTVLData(transactions: any[]) {
    const dailyMap = new Map();
    let runningTVL = 0;

    // Sort transactions by date and time
    const sortedTransactions = transactions.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Process each transaction chronologically
    sortedTransactions.forEach(tx => {
        const timestamp = new Date(tx.timestamp);
        const timeInterval = get4HourInterval(timestamp);

        if (tx.transaction_type === 'deposit') {
            runningTVL += parseFloat(tx.amount);
        } else if (tx.transaction_type === 'withdraw') {
            runningTVL -= parseFloat(tx.amount);
        }

        // Store the running balance for this time interval
        dailyMap.set(timeInterval, {
            date: timeInterval,
            value: Math.max(0, runningTVL)
        });
    });

    // If no transactions, return empty array
    if (dailyMap.size === 0) {
        return [];
    }

    // Convert to array and sort by date
    const result = Array.from(dailyMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Fill in missing 4-hour intervals with the last known TVL value
    const filledResult = [];
    let lastTVL = 0;

    for (let i = 0; i < result.length; i++) {
        const current = result[i];
        lastTVL = current.value;
        filledResult.push(current);

        // Check if there's a gap to the next interval
        if (i < result.length - 1) {
            const currentTime = new Date(current.date);
            const nextTime = new Date(result[i + 1].date);
            const hoursDiff = Math.floor((nextTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60));

            // Fill gaps with 4-hour intervals
            for (let j = 4; j < hoursDiff; j += 4) {
                const fillTime = new Date(currentTime.getTime() + j * 60 * 60 * 1000);
                filledResult.push({
                    date: get4HourInterval(fillTime),
                    value: lastTVL
                });
            }
        }
    }

    return filledResult.slice(-30); // Last 30 days
}

function calculateDepositsWithdrawalsData(transactions: any[]) {
    const intervalMap = new Map();

    transactions.forEach(tx => {
        const timestamp = new Date(tx.timestamp);
        const timeInterval = get4HourInterval(timestamp);

        if (!intervalMap.has(timeInterval)) {
            intervalMap.set(timeInterval, { date: timeInterval, deposits: 0, withdrawals: 0 });
        }

        const intervalData = intervalMap.get(timeInterval);
        if (tx.transaction_type === 'deposit') {
            intervalData.deposits += parseFloat(tx.amount);
        } else {
            intervalData.withdrawals += parseFloat(tx.amount);
        }
    });

    return Array.from(intervalMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-42); // Last 7 days * 6 intervals per day = 42 intervals
}

function calculateUserDistribution(transactions: any[]) {
    // Simplified user distribution calculation
    // In a real scenario, you'd need wallet addresses to calculate this properly
    const totalTransactions = transactions.length;
    const depositTransactions = transactions.filter(tx => tx.transaction_type === 'deposit').length;
    const withdrawalTransactions = transactions.filter(tx => tx.transaction_type === 'withdraw').length;

    return [
        { name: "Deposits", value: Math.round((depositTransactions / totalTransactions) * 100) },
        { name: "Withdrawals", value: Math.round((withdrawalTransactions / totalTransactions) * 100) }
    ];
}

function calculateRebaseTokenData(transactions: any[]) {
    const dailyMap = new Map();
    let runningTokenSupply = 0;
    let runningTVL = 0;

    // Sort transactions by date and time
    const sortedTransactions = transactions.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Process each transaction chronologically
    sortedTransactions.forEach(tx => {
        const timestamp = new Date(tx.timestamp);
        const timeInterval = get4HourInterval(timestamp);

        if (tx.transaction_type === 'deposit') {
            runningTokenSupply += parseFloat(tx.amount);
        } else if (tx.transaction_type === 'withdraw') {
            runningTokenSupply -= parseFloat(tx.amount);
        }

        // Store the running balance for this time interval
        dailyMap.set(timeInterval, {
            date: timeInterval,
            supply: Math.max(0, runningTokenSupply) // Token supply (cumulative deposits - withdrawals)
        });
    });

    // If no transactions, return empty array
    if (dailyMap.size === 0) {
        return [];
    }

    // Convert to array and sort by date
    const result = Array.from(dailyMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Fill in missing 4-hour intervals with the last known values
    const filledResult = [];
    let lastSupply = 0;

    for (let i = 0; i < result.length; i++) {
        const current = result[i];
        lastSupply = current.supply;
        filledResult.push(current);

        // Check if there's a gap to the next interval
        if (i < result.length - 1) {
            const currentTime = new Date(current.date);
            const nextTime = new Date(result[i + 1].date);
            const hoursDiff = Math.floor((nextTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60));

            // Fill gaps with 4-hour intervals
            for (let j = 4; j < hoursDiff; j += 4) {
                const fillTime = new Date(currentTime.getTime() + j * 60 * 60 * 1000);
                filledResult.push({
                    date: get4HourInterval(fillTime),
                    supply: lastSupply
                });
            }
        }
    }

    return filledResult.slice(-30); // Last 30 days
}
