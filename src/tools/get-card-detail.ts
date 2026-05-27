import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, stripCard, type Env } from '../lib/api.js';

export async function executeCard(env: Env, card_id: string) {
    const res = await apiFetch(env, `/api/v1/cards/${card_id}`);
    const json = await res.json() as { success: boolean; data: Record<string, unknown> };
    if (!json.success) throw new Error(`Card not found: ${card_id}`);
    return stripCard(json.data);
}

export function registerCard(server: McpServer, env: Env) {
    server.registerTool(
        'card',
        {
            title: 'Get Card Detail',
            description: 'Fetch full details for a single card by its ID. If you only have a card name, use findCard to get the ID first.',
            inputSchema: z.object({
                card_id: z.string().describe('Card ID to fetch'),
            }),
            annotations: { readOnlyHint: true, destructiveHint: false },
        },
        async ({ card_id }) => {
            try {
                const data = await executeCard(env, card_id);
                return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
            } catch (err) {
                return { isError: true, content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}. Use findCard to find a valid ID.` }] };
            }
        }
    );
}
