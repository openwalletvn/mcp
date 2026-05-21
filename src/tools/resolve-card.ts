import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, type Env } from '../lib/api.js';

export async function executeResolveCard(env: Env, query: string) {
    const res = await apiFetch(env, `/api/v1/cards?q=${encodeURIComponent(query)}&limit=1`);
    const json = await res.json() as { success: boolean; data: { id: string; name: string; bank_id: string }[] };
    if (!json.success) throw new Error('Failed to resolve card');
    const first = json.data[0];
    return first ? { id: first.id, name: first.name, bank_id: first.bank_id } : null;
}

export function registerResolveCard(server: McpServer, env: Env) {
    server.registerTool(
        'resolveCard',
        {
            title: 'Resolve Card',
            description: 'Look up a card ID from a name or description (e.g. "techcombank black", "shopee vpbank"). Returns { id, name, bank_id }, or null if not found.',
            inputSchema: z.object({
                query: z.string().describe('Card name or description to search for'),
            }),
            annotations: { readOnlyHint: true, destructiveHint: false },
        },
        async ({ query }) => {
            try {
                const data = await executeResolveCard(env, query);
                return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
            } catch (err) {
                return { isError: true, content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
            }
        }
    );
}
