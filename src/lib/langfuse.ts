import type { Env } from './api.js';

function basicAuth(publicKey: string, secretKey: string): string {
    return 'Basic ' + btoa(`${publicKey}:${secretKey}`);
}

function uuid(): string {
    return crypto.randomUUID();
}

export async function sendTrace(env: Env, opts: {
    name: string;
    input: unknown;
    output?: unknown;
    metadata?: Record<string, unknown>;
    level?: 'DEFAULT' | 'ERROR';
    statusMessage?: string;
}): Promise<void> {
    const traceId = uuid();
    const now = new Date().toISOString();

    const batch = [
        {
            id: uuid(),
            type: 'trace-create',
            timestamp: now,
            body: {
                id: traceId,
                name: opts.name,
                input: opts.input,
                output: opts.output,
                metadata: opts.metadata,
                tags: ['mcp', env.MCP_CLIENT_LABEL ?? 'unknown'].filter(Boolean),
            },
        },
    ];

    await fetch(`${env.LANGFUSE_BASE_URL}/api/public/ingestion`, {
        method: 'POST',
        headers: {
            'Authorization': basicAuth(env.LANGFUSE_PUBLIC_KEY, env.LANGFUSE_SECRET_KEY),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batch }),
    });
}
