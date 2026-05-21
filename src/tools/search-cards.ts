import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, stripCard, type Env } from '../lib/api.js';

export interface SearchCardsInput {
    q?: string;
    bank_id?: string;
    type?: string;
    network?: string;
    intent?: string;
    limit: number;
}

export async function executeSearchCards(env: Env, input: SearchCardsInput) {
    const { q, bank_id, type, network, intent, limit } = input;
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (bank_id) params.set('bank_id', bank_id);
    if (type) params.set('type', type);
    if (network) params.set('network', network);
    if (intent) params.set('intent', intent);
    const res = await apiFetch(env, `/api/v1/cards?${params}`);
    const json = await res.json() as { success: boolean; data: Record<string, unknown>[] };
    if (!json.success) throw new Error('Failed to search cards');
    return json.data.slice(0, limit).map(stripCard);
}

export function registerSearchCards(server: McpServer, env: Env) {
    server.registerTool(
        'searchCards',
        {
            title: 'Search Cards',
            description: 'Browse cards by filter criteria — name query, bank, card type, payment network, or spend intent. Returns up to limit stripped card objects. For spend-based ranking, use rankCardsForSpend instead.',
            inputSchema: z.object({
                q: z.string().optional().describe('Search by card name, ID, or bank name'),
                bank_id: z.string().optional().describe('Bank ID (e.g. vietcombank, techcombank, vpbank)'),
                type: z.enum(['credit', 'debit', 'prepaid', 'transit', 'atm', '2in1', 'co-branded']).optional().describe('Card type filter'),
                network: z.enum(['visa', 'mastercard', 'jcb', 'napas', 'amex', 'unionpay']).optional().describe('Payment network filter'),
                intent: z.string().optional().describe('Spend intent slug — use listIntents to see valid values'),
                limit: z.number().int().min(1).max(20).default(5).describe('Max results to return'),
            }),
            annotations: { readOnlyHint: true, destructiveHint: false },
        },
        async (input) => {
            try {
                const data = await executeSearchCards(env, input);
                return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
            } catch (err) {
                return { isError: true, content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
            }
        }
    );
}
