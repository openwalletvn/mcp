import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, stripCard, type Env } from '../lib/api.js';

export interface SearchCardsInput {
    q?: string;
    bank_id?: string;
    type?: string;
    network?: string;
    intent?: string;
    persona?: string;
    co_brand?: string;
    contactless?: string;
    tier?: string;
    network_tier?: string;
    metal?: string;
    for_business?: string;
    rule_channel?: string;
    rule_geography?: string;
    rule_intent?: string;
    limit: number;
}

export async function executeCards(env: Env, input: SearchCardsInput) {
    const { limit, ...filters } = input;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
        if (v !== undefined && v !== null) params.set(k, String(v));
    }
    const res = await apiFetch(env, `/api/v1/cards?${params}`);
    const json = await res.json() as { success: boolean; data: Record<string, unknown>[]; meta: unknown };
    if (!json.success) throw new Error('Failed to search cards');
    return { data: json.data.slice(0, limit).map(stripCard), meta: json.meta };
}

export function registerCards(server: McpServer, env: Env) {
    server.registerTool(
        'cards',
        {
            title: 'Search Cards',
            description: 'Browse cards by filter criteria — name query, bank, card type, payment network, spend intent, persona, or cashback rule attributes. Returns up to limit stripped card objects. For spend-based ranking, use rank instead.',
            inputSchema: z.object({
                q: z.string().optional().describe('Search by card name, ID, or bank name'),
                bank_id: z.string().optional().describe('Bank ID (e.g. vietcombank, techcombank, vpbank)'),
                type: z.enum(['credit', 'debit', 'prepaid', 'transit', 'atm', '2in1', 'co-branded']).optional().describe('Card type filter'),
                network: z.enum(['visa', 'mastercard', 'jcb', 'napas', 'amex', 'unionpay']).optional().describe('Payment network filter'),
                intent: z.string().optional().describe('Spend intent slug — use intents to see valid values'),
                persona: z.string().optional().describe('Preset persona slug (e.g. "shopee", "traveler") — applies bundled filter + intent set'),
                co_brand: z.string().optional().describe('Co-brand partner slug (e.g. "shopee", "grab", "highlands")'),
                contactless: z.string().optional().describe('Contactless standard (e.g. "visa_paywave", "mastercard_contactless")'),
                tier: z.string().optional().describe('Card tier (e.g. "standard", "gold", "platinum", "infinite")'),
                network_tier: z.string().optional().describe('Network tier (e.g. "classic", "signature", "infinite")'),
                metal: z.enum(['true', 'false']).optional().describe('Filter metal cards only'),
                for_business: z.enum(['true', 'false']).optional().describe('Filter business cards only'),
                rule_channel: z.string().optional().describe('Cards with cashback rules for this channel (e.g. "online", "offline")'),
                rule_geography: z.string().optional().describe('Cards with cashback rules for this geography (e.g. "domestic", "foreign")'),
                rule_intent: z.string().optional().describe('Cards with cashback rules matching this intent slug'),
                limit: z.number().int().min(1).max(20).default(5).describe('Max results to return'),
            }),
            annotations: { readOnlyHint: true, destructiveHint: false },
        },
        async (input) => {
            try {
                const result = await executeCards(env, input);
                return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
            } catch (err) {
                return { isError: true, content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
            }
        }
    );
}
