import { NextRequest, NextResponse } from 'next/server';
import ConvertAPI from 'convertapi';
import { Readable } from 'stream';

const convertapi = new ConvertAPI(process.env.CONVERTAPI_SECRET!);

export async function POST(req: NextRequest) {
  try {
    // Verify environment variable
    if (!process.env.CONVERTAPI_SECRET) {
      console.error('CONVERTAPI_SECRET is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    // Convert File to Readable Stream
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = Readable.from(buffer);

    // Log file size for debugging
    console.log('File Size:', buffer.length);

    // Upload the stream to ConvertAPI
    const uploadResult = await convertapi.upload(stream, file.name);

    // Log upload result
    console.log('Upload Result:', uploadResult);

    // Convert PDF to text
    const result = await convertapi.convert('txt', { File: uploadResult }, 'pdf');

    // Log conversion result
    console.log('ConvertAPI Result Files:', result.files);

    // Validate the URL
    const fileUrl = result.files[0]?.fileInfo?.Url;
    if (!fileUrl) {
      throw new Error('No URL returned in conversion result');
    }

    console.log('Fetching URL:', fileUrl);

    // Fetch the converted file content with error handling
    const res = await fetch(fileUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch converted file: ${res.status} ${res.statusText}`);
    }

    const fileContent = await res.text();

    // Log content length for debugging
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