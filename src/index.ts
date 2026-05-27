import { McpAgent } from 'agents/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createMcpServer } from './server.js';
import type { Env } from './lib/api.js';
import { validateKey } from './auth.js';
import pkg from '../package.json';

export class OpenWalletMCP extends McpAgent<Env> {
    server = new McpServer(
        { name: 'openwallet-mcp', version: pkg.version },
        { instructions: 'Use findBank or findCard to get IDs before calling detail tools. Use intents to discover valid spend category slugs before calling rank or filtering cards by intent.' }
    );

    async init() {
        createMcpServer(this.env, this.server);
    }
}

const ALLOWED_PATHS = new Set(['/', '/health', '/sse', '/message', '/badge']);

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
};

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        // CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: CORS_HEADERS });
        }

        const url = new URL(request.url);
        // Allowlist check – block unknown paths before auth
        if (!ALLOWED_PATHS.has(url.pathname)) {
            return new Response(null, { status: 404 });
        }

        // Health check — no auth required
        if (url.pathname === '/health') {
            let api = false;
            try {
                const apiRes = await fetch(`${env.OPENWALLET_API_URL}/health`, {
                    signal: AbortSignal.timeout(3000),
                });
                api = apiRes.ok;
            } catch {
                api = false;
            }
            return new Response(JSON.stringify({ name: 'openwallet-mcp', version: pkg.version, api }), {
                headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
            });
        }

        // Badge — no auth, for shields.io endpoint badge
        if (url.pathname === '/badge') {
            return new Response(
                JSON.stringify({
                    schemaVersion: 1,
                    label: `MCP v${pkg.version}`,
                    message: 'online',
                    color: 'brightgreen',
                    cacheSeconds: 60,
                }),
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'public, max-age=60, s-maxage=60',
                        ...CORS_HEADERS,
                    },
                }
            );
        }

        // Auth — skip on localhost (wrangler dev only)
        const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
        const rawKey = request.headers.get('x-mcp-key') ?? request.headers.get('authorization')?.replace('Bearer ', '');

        if (!isLocalhost) {
            const result = validateKey(rawKey, env.MCP_KEYS ?? '[]');
            if (!result.valid) {
                return new Response(JSON.stringify({ error: 'Invalid or missing API key' }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
                });
            }

            env.MCP_CLIENT_LABEL = result.label ?? 'unknown';
            console.log(JSON.stringify({ key: result.label!, path: url.pathname }));
            env.ANALYTICS?.writeDataPoint({
                blobs: [result.label!, url.pathname],
                indexes: [result.label!],
            });
        }

        // MCP via McpAgent (handles sessions + SSE)
        const response = await OpenWalletMCP.serve('/').fetch(request, env, ctx);
        const headers = new Headers(response.headers);
        for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
        return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    },
} satisfies ExportedHandler<Env>;
