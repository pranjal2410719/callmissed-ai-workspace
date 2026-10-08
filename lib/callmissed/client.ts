const CALLMISSED_BASE_URL = process.env.CALLMISSED_BASE_URL || 'https://api.callmissed.com/v1';

export class CallMissedError extends Error {
  statusCode: number;
  code?: string;
  details?: unknown;

  constructor(message: string, statusCode: number = 500, code?: string, details?: unknown) {
    super(message);
    this.name = 'CallMissedError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function getCallMissedApiKey(): string {
  const apiKey = process.env.CALLMISSED_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new CallMissedError(
      'CallMissed API key is not configured. Please set the CALLMISSED_API_KEY environment variable on your server.',
      500,
      'missing_api_key'
    );
  }
  return apiKey.trim();
}

export async function callMissedFetch<T>(
  endpoint: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    stream?: boolean;
  } = {}
): Promise<T> {
  const apiKey = getCallMissedApiKey();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${CALLMISSED_BASE_URL}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body !== undefined) {
    fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network request failed';
    throw new CallMissedError(`Failed to connect to CallMissed API: ${message}`, 502, 'network_error');
  }

  if (!response.ok) {
    let errorData: Record<string, unknown> | null = null;
    try {
      errorData = (await response.json()) as Record<string, unknown>;
    } catch {
      // response is not JSON
    }

    const errObj = errorData?.error as Record<string, unknown> | undefined;
    const errorMessage =
      (typeof errObj?.message === 'string' ? errObj.message : null) ||
      (typeof errorData?.message === 'string' ? errorData.message : null) ||
      `CallMissed API error (${response.status}: ${response.statusText})`;
    const errorCode =
      (typeof errObj?.code === 'string' ? errObj.code : null) ||
      (typeof errorData?.code === 'string' ? errorData.code : null) ||
      'api_error';

    throw new CallMissedError(errorMessage, response.status, errorCode, errorData);
  }

  if (options.stream) {
    return response as unknown as T;
  }

  return (await response.json()) as T;
}
