import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, type Env } from '../lib/api.js';

export async function executeListIntents(env: Env) {
    const res = await apiFetch(env, '/api/v1/intents');
    const json = await res.json() as { success: boolean; data: unknown };
    if (!json.success) throw new Error('Failed to fetch intents');
    return json.data;
}

export function registerListIntents(server: McpServer, env: Env) {
    server.registerTool(
        'listIntents',
        {
            title: 'List Intents',
            description: 'List all valid spend intent slugs. Use these slugs as keys in rankCardsForSpend.spend or as the intent filter in searchCards.',
            inputSchema: z.object({}),
            annotations: { readOnlyHint: true, destructiveHint: false },
        },
        async () => {
            try {
                const data = await executeListIntents(env);
                return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
            } catch (err) {
                return { isError: true, content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
            }
        }
    );
}
