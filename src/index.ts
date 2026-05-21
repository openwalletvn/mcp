import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createMcpServer } from './server.js';
import type { Env } from './lib/api.js';

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        // Auth
        const key = request.headers.get('x-mcp-key') ?? request.headers.get('authorization')?.replace('Bearer ', '');
        if (!key || key !== env.MCP_API_KEY) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Health check
        if (request.method === 'GET' && new URL(request.url).pathname === '/') {
            return new Response(JSON.stringify({ name: 'openwallet-mcp', version: '0.1.0', tools: 8 }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // MCP — stateless: new server + transport per request
        const server = createMcpServer(env);
        const transport = new WebStandardStreamableHTTPServerTransport({
            sessionIdGenerator: undefined, // stateless
        });
        await server.connect(transport);

        try {
            return await transport.handleRequest(request);
        } finally {
            await server.close();
        }
    },
} satisfies ExportedHandler<Env>;
