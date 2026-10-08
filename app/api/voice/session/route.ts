import { NextRequest, NextResponse } from 'next/server';
import { createVoiceSession } from '@/lib/callmissed/voice';
import { CallMissedError } from '@/lib/callmissed/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { system_prompt, greeting, voice, language, llm_model, max_duration_seconds } = body;

    const session = await createVoiceSession({
      system_prompt,
      greeting,
      voice,
      language,
      llm_model,
      max_duration_seconds: max_duration_seconds || 600,
    });

    // Return the media connection data to the client.
    // The raw API key is never sent to the browser.
    return NextResponse.json({
      id: session.id,
      wsUrl: session.ws_url,
      token: session.token,
      status: session.status,
      config: session.config,
    });
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
      { error: { message: `Failed to create voice session: ${message}` } },
      { status: 500 }
    );
  }
}
