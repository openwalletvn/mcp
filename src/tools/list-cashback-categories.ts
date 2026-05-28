import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, type Env } from '../lib/api.js';

export async function executeCashbackCategories(env: Env) {
    const res = await apiFetch(env, '/api/v1/cashback-categories');
    const json = await res.json() as { success: boolean; data: unknown };
    if (!json.success) throw new Error('Failed to fetch cashback categories');
    return json.data;
}

export function registerCashbackCategories(server: McpServer, env: Env) {
    server.registerTool(
        'cashbackCategories',
        {
            title: 'List Cashback Categories',
            description: 'List all cashback category definitions. Cashback categories group related spend intents and describe how cashback rules apply across them.',
            inputSchema: z.object({}),
            annotations: { readOnlyHint: true, destructiveHint: false },
        },
        async () => {
            try {
                const data = await executeCashbackCategories(env);
                return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
            } catch (err) {
                return { isError: true, content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
            }
        }
    );
}
