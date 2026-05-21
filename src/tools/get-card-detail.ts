import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, stripCard, type Env } from '../lib/api.js';

export async function executeGetCardDetail(env: Env, card_id: string) {
    const res = await apiFetch(env, `/api/v1/cards/${card_id}`);
    const json = await res.json() as { success: boolean; data: Record<string, unknown> };
    if (!json.success) throw new Error(`Không tìm thấy thẻ: ${card_id}`);
    return stripCard(json.data);
}

export function registerGetCardDetail(server: McpServer, env: Env) {
    server.registerTool(
        'getCardDetail',
        {
            description: 'Lấy thông tin chi tiết của một thẻ theo ID.',
            inputSchema: z.object({
                card_id: z.string().describe('ID thẻ ngân hàng'),
            }),
        },
        async ({ card_id }) => {
            const data = await executeGetCardDetail(env, card_id);
            return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
        }
    );
}
