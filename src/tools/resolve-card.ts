import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, type Env } from '../lib/api.js';

export async function executeResolveCard(env: Env, query: string) {
    const res = await apiFetch(env, `/api/v1/cards?q=${encodeURIComponent(query)}&limit=1`);
    const json = await res.json() as { success: boolean; data: { id: string; name: string; bank_id: string }[] };
    if (!json.success) throw new Error('Không thể tìm thẻ');
    const first = json.data[0];
    return first ? { id: first.id, name: first.name, bank_id: first.bank_id } : null;
}

export function registerResolveCard(server: McpServer, env: Env) {
    server.registerTool(
        'resolveCard',
        {
            description: 'Tìm ID thẻ từ tên hoặc mô tả. Ví dụ: "thẻ đen techcombank", "shopee vpbank". Trả về null nếu không tìm thấy.',
            inputSchema: z.object({
                query: z.string().describe('Tên hoặc mô tả thẻ'),
            }),
        },
        async ({ query }) => {
            const data = await executeResolveCard(env, query);
            return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
        }
    );
}
