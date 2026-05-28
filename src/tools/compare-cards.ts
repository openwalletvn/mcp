import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, type Env } from '../lib/api.js';

export interface CompareCardsInput {
    card_ids: string[];
    intents?: string[];
    monthly_spend?: number;
}

export async function executeCompare(env: Env, input: CompareCardsInput) {
    const res = await apiFetch(env, '/api/v1/cards/compare', {
        method: 'POST',
        body: JSON.stringify(input),
    });
    const json = await res.json() as { success: boolean; data: unknown; error?: string };
    if (!json.success) throw new Error(json.error ?? 'Failed to compare cards');
    return json.data;
}

export function registerCompare(server: McpServer, env: Env) {
    server.registerTool(
        'compare',
        {
            title: 'Compare Cards',
            description: 'Compare 2–3 cards side-by-side by their IDs. Optionally provide intents and monthly_spend to include a cashback comparison. Use findCard to get IDs from card names.',
            inputSchema: z.object({
                card_ids: z.array(z.string()).min(2).max(3).describe('List of card IDs to compare (2–3 cards). Use findCard to look up IDs.'),
                intents: z.array(z.string()).optional().describe('Spend intent slugs to compute cashback comparison. Use intents tool for valid values.'),
                monthly_spend: z.number().positive().optional().describe('Total monthly spend in VND for cashback comparison. Default: 5000000'),
            }),
            annotations: { readOnlyHint: true, destructiveHint: false },
        },
        async ({ card_ids, intents, monthly_spend }) => {
            try {
                const data = await executeCompare(env, { card_ids, intents, monthly_spend });
                return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
            } catch (err) {
                return { isError: true, content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}. Use findCard to find valid IDs.` }] };
            }
        }
    );
}
