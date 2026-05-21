import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, stripCard, type Env } from '../lib/api.js';

export async function executeCompareCards(env: Env, card_ids: string[]) {
    return Promise.all(
        card_ids.map(async (id) => {
            const res = await apiFetch(env, `/api/v1/cards/${id}`);
            const json = await res.json() as { success: boolean; data: Record<string, unknown> };
            if (!json.success) throw new Error(`Không tìm thấy thẻ: ${id}`);
            return stripCard(json.data);
        })
    );
}

export function registerCompareCards(server: McpServer, env: Env) {
    server.registerTool(
        'compareCards',
        {
            description: 'So sánh nhiều thẻ cùng lúc theo danh sách ID.',
            inputSchema: z.object({
                card_ids: z.array(z.string()).min(2).max(4).describe('Danh sách ID thẻ cần so sánh (2–4 thẻ)'),
            }),
        },
        async ({ card_ids }) => {
            const data = await executeCompareCards(env, card_ids);
            return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
        }
    );
}
