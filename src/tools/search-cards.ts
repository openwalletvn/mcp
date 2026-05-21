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
    if (!json.success) throw new Error('Không thể tìm thẻ');
    return json.data.slice(0, limit).map(stripCard);
}

export function registerSearchCards(server: McpServer, env: Env) {
    server.registerTool(
        'searchCards',
        {
            description: 'Tìm kiếm thẻ theo bộ lọc. Dùng để tìm thẻ theo ngân hàng, loại, mạng lưới, hoặc mục đích sử dụng. KHÔNG dùng để tư vấn thẻ tốt nhất cho chi tiêu — dùng rankCardsForSpend thay thế.',
            inputSchema: z.object({
                q: z.string().optional().describe('Tìm theo tên thẻ, ID hoặc ngân hàng'),
                bank_id: z.string().optional().describe('ID ngân hàng (ví dụ: vietcombank, techcombank, vpbank)'),
                type: z.enum(['credit', 'debit', 'prepaid', 'transit', 'atm', '2in1', 'co-branded']).optional(),
                network: z.enum(['visa', 'mastercard', 'jcb', 'napas', 'amex', 'unionpay']).optional(),
                intent: z.string().optional().describe('Intent slug (dùng listIntents để xem danh sách hợp lệ)'),
                limit: z.number().int().min(1).max(20).default(5),
            }),
        },
        async (input) => {
            const data = await executeSearchCards(env, input);
            return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
        }
    );
}
