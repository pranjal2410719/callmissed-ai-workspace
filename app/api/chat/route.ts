import { NextRequest, NextResponse } from 'next/server';
import { createChatCompletion, createChatStream } from '@/lib/callmissed/chat';
import { CallMissedError } from '@/lib/callmissed/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, model, temperature, max_tokens, stream } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: { message: 'Messages array is required and must not be empty.' } },
        { status: 400 }
      );
    }

    // Streaming mode
    if (stream) {
      const upstreamResponse = await createChatStream({
        messages,
        model,
        temperature,
        max_tokens,
      });

      return new Response(upstreamResponse.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    // Standard JSON mode
    const completion = await createChatCompletion({
      messages,
      model,
      temperature,
      max_tokens,
    });

    return NextResponse.json(completion);
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
      { error: { message: `Chat request failed: ${message}` } },
      { status: 500 }
    );
  }
}
