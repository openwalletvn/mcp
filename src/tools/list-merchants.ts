import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, type Env } from '../lib/api.js';

export async function executeMerchants(env: Env) {
    const res = await apiFetch(env, '/api/v1/merchants');
    const json = await res.json() as { success: boolean; data: unknown };
    if (!json.success) throw new Error('Failed to fetch merchants');
    return json.data;
}

export function registerMerchants(server: McpServer, env: Env) {
    server.registerTool(
        'merchants',
        {
            title: 'List Merchants',
            description: 'List all merchant definitions — brand names mapped to their spend intent slugs. Useful for resolving "which intent does Shopee map to?" before calling rank or cards.',
            inputSchema: z.object({}),
            annotations: { readOnlyHint: true, destructiveHint: false },
        },
        async () => {
            try {
                const data = await executeMerchants(env);
                return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
            } catch (err) {
                return { isError: true, content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
            }
        }
    );
}
