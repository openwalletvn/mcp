import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, type Env } from '../lib/api.js';

type CardSlim = { id: string; name: string; bank_id: string };
const MAX_CANDIDATES = 5;

export async function executeResolveCard(env: Env, query: string) {
    const res = await apiFetch(env, `/api/v1/cards?q=${encodeURIComponent(query)}`);
    const json = await res.json() as { success: boolean; data: CardSlim[]; meta: { filtered: number } };
    if (!json.success) throw new Error('Failed to resolve card');
    const { data } = json;
    if (data.length === 0) return null;
    if (data.length === 1) return { id: data[0].id, name: data[0].name, bank_id: data[0].bank_id, confidence: 'exact' as const };
    return {
        confidence: 'ambiguous' as const,
        message: `"${query}" matched ${data.length} cards. Ask the user which card they mean.`,
        matches: data.slice(0, MAX_CANDIDATES).map(c => ({ id: c.id, name: c.name, bank_id: c.bank_id })),
    };
}

export function registerResolveCard(server: McpServer, env: Env) {
    server.registerTool(
        'resolveCard',
        {
            title: 'Resolve Card',
            description: 'Look up a card ID from a name or description (e.g. "techcombank black", "shopee vpbank"). Returns { id, name, bank_id, confidence: "exact" } when unambiguous, or { confidence: "ambiguous", matches, message } when multiple cards match — in that case, present the matches to the user and ask them to clarify.',
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
