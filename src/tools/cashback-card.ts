import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, type Env } from '../lib/api.js';

export interface CashbackCardInput {
    card_id: string;
    intents?: string[];
    monthly_spend?: number;
    spend_profile?: Record<string, number>;
}

export async function executeCashback(env: Env, { card_id, ...body }: CashbackCardInput) {
    const res = await apiFetch(env, `/api/v1/cards/${encodeURIComponent(card_id)}/cashback`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
    const json = await res.json() as { success: boolean; data: unknown; error?: string };
    if (!json.success) throw new Error(json.error ?? 'Failed to compute cashback');
    return json.data;
}

export function registerCashback(server: McpServer, env: Env) {
    server.registerTool(
        'cashback',
        {
            title: 'Get Card Cashback',
            description: 'Compute estimated cashback for a single card given a spend profile. Uses the card\'s own intents by default; pass intents to override. Use findCard to get the card ID.',
            inputSchema: z.object({
                card_id: z.string().describe('Card ID to compute cashback for. Use findCard to get IDs from card names.'),
                intents: z.array(z.string()).optional().describe('Spend intent slugs to compute cashback for. Defaults to the card\'s own intents.'),
                monthly_spend: z.number().positive().optional().describe('Total monthly spend in VND. Default: 5000000'),
                spend_profile: z.record(z.string(), z.number()).optional().describe(
                    'Explicit per-intent spend amounts in VND. Overrides monthly_spend distribution. Example: {"ecommerce":3000000,"dining":1000000}'
                ),
            }),
            annotations: { readOnlyHint: true, destructiveHint: false },
        },
        async (input) => {
            try {
                const data = await executeCashback(env, input);
                return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
            } catch (err) {
                return { isError: true, content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
            }
        }
    );
}
