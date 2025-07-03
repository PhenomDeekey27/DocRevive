import { NextRequest, NextResponse } from 'next/server';
import ConvertAPI from 'convertapi';
import { Readable } from 'stream';

const convertapi = new ConvertAPI(process.env.CONVERTAPI_SECRET!);

// Explicit type for ResultFile's fileInfo
type ConvertAPIFileInfo = {
  FileName: string;
  FileExt: string;
  FileSize: number;
  FileId: string;
  Url: string;
};

type ResultFile = {
  fileInfo?: ConvertAPIFileInfo;
};

export async function POST(req: NextRequest) {
  try {
    if (!process.env.CONVERTAPI_SECRET) {
      console.error('CONVERTAPI_SECRET is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = Readable.from(buffer);

    console.log('File Size:', buffer.length);

    const uploadResult = await convertapi.upload(stream, file.name);
    console.log('Upload Result:', uploadResult);

    const result = await convertapi.convert('txt', { File: uploadResult }, 'pdf');

    // ✅ Explicitly cast files
    const resultFiles = result.files as ResultFile[];
    console.log('ConvertAPI Result Files:', resultFiles);

    const fileUrl = resultFiles?.[0]?.fileInfo?.Url;
    if (!fileUrl) {
      throw new Error('No valid file URL returned in conversion result');
    }

    console.log('Fetching URL:', fileUrl);

    const res = await fetch(fileUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch converted file: ${res.status} ${res.statusText}`);
    }

    const fileContent = await res.text();
    console.log('Fetched Content Length:', fileContent.length);

    return NextResponse.json({ text: fileContent });
  } catch (error: any) {
    console.error('ConvertAPI PDF to text error:', error.message, error.stack);
    if (error.response) {
      console.error('ConvertAPI Response:', error.response.data);
    }
    return NextResponse.json(
      { error: 'Failed to convert PDF to text', details: error.message },
      { status: 500 }
    );
  }
}
