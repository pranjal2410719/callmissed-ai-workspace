import { NextRequest, NextResponse } from 'next/server';
import { generateImage, getImageHistory } from '@/lib/callmissed/image';
import { CallMissedError } from '@/lib/callmissed/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, model, size, negative_prompt, seed, n } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return NextResponse.json(
        { error: { message: 'Prompt is required.' } },
        { status: 400 }
      );
    }

    const result = await generateImage({
      prompt: prompt.trim(),
      model: model || 'flux-2-klein-9b',
      size: size || '1024x1024',
      negative_prompt,
      seed,
      n: n ?? 1,
      response_format: 'b64_json',
    });

    return NextResponse.json(result);
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
      { error: { message: `Image generation failed: ${message}` } },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const history = await getImageHistory(limit);
    return NextResponse.json(history);
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

    const message = err instanceof Error ? err.message : 'Failed to fetch history';
    return NextResponse.json(
      { error: { message } },
      { status: 500 }
    );
  }
}
