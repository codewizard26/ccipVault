import { NextRequest, NextResponse } from 'next/server';
import { downloadJsonData } from '@/lib/UploadDataToStorage';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ rootHash: string }> }
) {
    try {
        const { rootHash } = await context.params;
        const { searchParams } = new URL(request.url);
        const fileName = searchParams.get('fileName');

        if (!rootHash) {
            return NextResponse.json({
                success: false,
                error: 'Root hash is required'
            }, { status: 400 });
        }

        console.log('Downloading JSON data with root hash:', rootHash);

        const data = await downloadJsonData(
            rootHash,
            fileName || `download-${Date.now()}.json`
        );

        return NextResponse.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('JSON download error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}