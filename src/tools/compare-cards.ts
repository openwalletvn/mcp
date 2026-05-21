import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, stripCard, type Env } from '../lib/api.js';

export async function executeCompareCards(env: Env, card_ids: string[]) {
    return Promise.all(
        card_ids.map(async (id) => {
            const res = await apiFetch(env, `/api/v1/cards/${id}`);
            const json = await res.json() as { success: boolean; data: Record<string, unknown> };
            if (!json.success) throw new Error(`Card not found: ${id}`);
            return stripCard(json.data);
        })
    );
}

export function registerCompareCards(server: McpServer, env: Env) {
    server.registerTool(
        'compareCards',
        {
            title: 'Compare Cards',
            description: 'Fetch and compare 2–4 cards side-by-side by their IDs. Returns an array of stripped card objects in the same order as card_ids. Use resolveCard to get IDs from card names.',
            inputSchema: z.object({
                card_ids: z.array(z.string()).min(2).max(4).describe('List of card IDs to compare (2–4 cards)'),
            }),
            annotations: { readOnlyHint: true, destructiveHint: false },
        },
        async ({ card_ids }) => {
            try {
                const data = await executeCompareCards(env, card_ids);
                return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
            } catch (err) {
                return { isError: true, content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}. Use resolveCard to find valid IDs.` }] };
            }
        }
    );
}
