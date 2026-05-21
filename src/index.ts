import { McpAgent } from 'agents/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createMcpServer } from './server.js';
import type { Env } from './lib/api.js';

export class OpenWalletMCP extends McpAgent<Env> {
    server = new McpServer(
        { name: 'openwallet-mcp', version: '0.1.0' },
        { instructions: 'Use resolveBank or resolveCard to get IDs before calling detail tools. Use listIntents to discover valid spend category slugs before calling rankCardsForSpend or filtering searchCards by intent.' }
    );

    async init() {
        createMcpServer(this.env, this.server);
    }
}

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

        // Health check
        if (url.pathname === '/health') {
            return new Response(JSON.stringify({ name: 'openwallet-mcp', version: '0.1.0' }), {
                headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
            });
        }

        // Auth (skip on localhost for inspector dev)
        const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
        const isInspector = request.headers.get('origin') === 'https://inspector.openwallet.vn';
        if (!isLocalhost && !isInspector) {
            const key = request.headers.get('x-mcp-key') ?? request.headers.get('authorization')?.replace('Bearer ', '');
            if (!key || key !== env.MCP_API_KEY) {
                return new Response(JSON.stringify({ error: 'Forbidden' }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
                });
            }
        }

        // MCP via McpAgent (handles sessions + SSE)
        const response = await OpenWalletMCP.serve('/').fetch(request, env, ctx);
        const headers = new Headers(response.headers);
        for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
        return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    },
} satisfies ExportedHandler<Env>;
