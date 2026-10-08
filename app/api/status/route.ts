import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.CALLMISSED_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey.trim().length > 0);

  return NextResponse.json({
    status: 'ok',
    configured: isConfigured,
    message: isConfigured
      ? 'CallMissed API is configured'
      : 'CALLMISSED_API_KEY is not set in environment variables',
  });
}
