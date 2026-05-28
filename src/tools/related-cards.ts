import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, stripCard, type Env } from '../lib/api.js';

export async function executeRelatedCards(env: Env, card_id: string) {
    const res = await apiFetch(env, `/api/v1/cards/${encodeURIComponent(card_id)}/related`);
    const json = await res.json() as { success: boolean; data: Record<string, unknown>[]; meta: unknown };
    if (!json.success) throw new Error(`Failed to fetch related cards for: ${card_id}`);
    return { data: json.data.map(stripCard), meta: json.meta };
}

export function registerRelatedCards(server: McpServer, env: Env) {
    server.registerTool(
        'relatedCards',
        {
            title: 'Get Related Cards',
            description: 'Get cards related to a given card — same bank, same co-brand partner, or similar intent profile. Use findCard to get the card ID first.',
            inputSchema: z.object({
                card_id: z.string().describe('Card ID to find related cards for. Use findCard to get IDs from card names.'),
            }),
            annotations: { readOnlyHint: true, destructiveHint: false },
        },
        async ({ card_id }) => {
            try {
                const data = await executeRelatedCards(env, card_id);
                return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
            } catch (err) {
                return { isError: true, content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
            }
        }
    );
}
