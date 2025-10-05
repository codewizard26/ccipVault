import { NextRequest, NextResponse } from 'next/server';
import { uploadJsonData } from '@/lib/UploadDataToStorage';

export async function POST(request: NextRequest) {
    try {
        const { data, fileName } = await request.json();

        if (!data) {
            return NextResponse.json({
                success: false,
                error: 'JSON data is required'
            }, { status: 400 });
        }

        console.log('Uploading JSON data:', { fileName: fileName || 'data.json' });

        const result = await uploadJsonData(
            data,
            fileName || `data-${Date.now()}.json`
        );

        return NextResponse.json({
            success: true,
            result: {
                rootHash: result.rootHash,
                txHash: result.txHash,
                fileName: result.fileName,
                size: result.size
            }
        });
    } catch (error) {
        console.error('JSON upload error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}