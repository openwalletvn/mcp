import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, type Env } from '../lib/api.js';

export interface RankCardsInput {
    persona?: string;
    cards?: string[];
    intents?: string[];
    monthly_spend?: number;
    sort_by?: 'cashback' | 'annual_fee';
    limit?: number;
}

export async function executeRank(env: Env, input: RankCardsInput) {
    const res = await apiFetch(env, '/api/v1/cards/rank', {
        method: 'POST',
        body: JSON.stringify(input),
    });
    const json = await res.json() as { success: boolean; data: unknown; meta: unknown; error?: string };
    if (!json.success) throw new Error(json.error ?? 'Failed to rank cards');
    return { data: json.data, meta: json.meta };
}

export function registerRank(server: McpServer, env: Env) {
    server.registerTool(
        'rank',
        {
            title: 'Rank Cards for Spend',
            description: 'Rank cards by estimated cashback for a given spend profile. Provide intents (spend category slugs) and monthly_spend, or a persona shortcut. Returns ranked cards with cashback breakdown. Use intents tool to discover valid slugs.',
            inputSchema: z.object({
                intents: z.array(z.string()).optional().describe(
                    'Spend category slugs to rank against. Example: ["ecommerce","dining"]. Use intents tool for valid values.'
                ),
                monthly_spend: z.number().positive().optional().describe(
                    'Total monthly spend in VND across all intents. Default: 5000000'
                ),
                persona: z.string().optional().describe(
                    'Preset spend persona slug (e.g. "shopee", "traveler"). Expands to intents + card filter automatically.'
                ),
                cards: z.array(z.string()).optional().describe(
                    'Restrict ranking pool to these card IDs only.'
                ),
                sort_by: z.enum(['cashback', 'annual_fee']).optional().default('cashback').describe(
                    'Sort by estimated cashback (default) or annual fee.'
                ),
                limit: z.number().int().min(1).max(50).optional().default(5).describe('Max cards to return (1–50)'),
            }),
            annotations: { readOnlyHint: true, destructiveHint: false },
        },
        async (input) => {
            try {
                const data = await executeRank(env, input);
                return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
            } catch (err) {
                return { isError: true, content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
            }
        }
    );
}
