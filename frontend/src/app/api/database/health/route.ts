import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET() {
  try {
    const isConnected = await DatabaseService.testConnection();
    
    return NextResponse.json({
      success: true,
      connected: isConnected,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        connected: false,
        error: 'Database connection failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
