import { NextRequest, NextResponse } from 'next/server';
import { getVoiceTranscript } from '@/lib/callmissed/voice';
import { CallMissedError } from '@/lib/callmissed/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: { message: 'Session ID is required.' } },
        { status: 400 }
      );
    }

    const transcript = await getVoiceTranscript(id, 'json');
    return NextResponse.json({ transcript });
  } catch (err: unknown) {
    if (err instanceof CallMissedError) {
      return NextResponse.json(
        {
          error: {
            message: err.message,
            code: err.code,
            details: err.details,
          },
        },
        { status: err.statusCode }
      );
    }

    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      { error: { message: `Failed to fetch transcript: ${message}` } },
      { status: 500 }
    );
  }
}
