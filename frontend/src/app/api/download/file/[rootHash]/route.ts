import { NextRequest, NextResponse } from 'next/server';
import { downloadFile } from '@/lib/UploadDataToStorage';
import { readFile, unlink, mkdir } from 'fs/promises';
import path from 'path';

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

        const outputFileName = fileName || `download-${Date.now()}.bin`;
        const tempDir = path.join(process.cwd(), 'temp');
        await mkdir(tempDir, { recursive: true });
        const tempOutputPath = path.join(tempDir, outputFileName);

        // Download the file using your existing function
        await downloadFile(rootHash, tempOutputPath);

        // Read file and send as response
        const fileBuffer = await readFile(tempOutputPath);

        // Clean up temporary file
        await unlink(tempOutputPath);

        // Return file as response (convert Buffer -> Uint8Array)
        return new NextResponse(new Uint8Array(fileBuffer), {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${outputFileName}"`,
            },
        });
    } catch (error) {
        console.error('File download error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}