import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/UploadDataToStorage';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({
                success: false,
                error: 'File is required'
            }, { status: 400 });
        }

        console.log('Uploading file:', file.name);

        // Create temp directory if it doesn't exist
        const tempDir = path.join(process.cwd(), 'temp');
        await mkdir(tempDir, { recursive: true });

        // Save file temporarily
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const tempFilePath = path.join(tempDir, `${Date.now()}-${file.name}`);
        await writeFile(tempFilePath, buffer);

        // Upload using your existing function
        const result = await uploadFile(tempFilePath);

        // Clean up temporary file
        await unlink(tempFilePath);

        return NextResponse.json({
            success: true,
            result: {
                rootHash: result.rootHash,
                txHash: result.txHash,
                originalName: file.name,
                size: file.size
            }
        });
    } catch (error) {
        console.error('File upload error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}
