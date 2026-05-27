import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, type Env } from '../lib/api.js';

export interface RankCardsInput {
    spend: Record<string, number>;
    limit: number;
    type?: string;
}

export async function executeRank(env: Env, input: RankCardsInput) {
    const res = await apiFetch(env, '/api/v1/cards/rank', {
        method: 'POST',
        body: JSON.stringify(input),
    });
    const json = await res.json() as { success: boolean; data: unknown; error?: string };
    if (!json.success) throw new Error(json.error ?? 'Failed to rank cards');
    return json.data;
}

export function registerRank(server: McpServer, env: Env) {
    server.registerTool(
        'rank',
        {
            title: 'Rank Cards for Spend',
            description: 'Rank all cards by estimated cashback for a given monthly spend profile. Returns up to limit cards sorted by total benefit, with per-intent and total cashback breakdown. spend must have at least one key with a value > 0. Use intents to discover valid spend category slugs.',
            inputSchema: z.object({
                spend: z.record(z.string(), z.number()).describe(
                    'Monthly spend profile: keys are intent slugs, values are VND/month. Example: {"ecommerce":5000000,"dining":2000000}'
                ),
                limit: z.number().int().min(1).max(10).default(3).describe('Max cards to return'),
                type: z.enum(['credit', 'debit']).optional().describe('Filter by card type'),
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
