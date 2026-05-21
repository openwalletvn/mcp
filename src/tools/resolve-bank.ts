import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, type Env } from '../lib/api.js';

export async function executeResolveBank(env: Env, query: string) {
    const res = await apiFetch(env, `/api/v1/banks?q=${encodeURIComponent(query)}`);
    const json = await res.json() as { success: boolean; data: Record<string, unknown>[] };
    if (!json.success) throw new Error('Không thể tìm ngân hàng');
    return json.data[0] ?? null;
}

export function registerResolveBank(server: McpServer, env: Env) {
    server.registerTool(
        'resolveBank',
        {
            description: 'Tìm ngân hàng từ tên hoặc tên viết tắt. Hỗ trợ: "vcb", "a chau", "ngân hàng ngoại thương", v.v. Trả về null nếu không tìm thấy.',
            inputSchema: z.object({
                query: z.string().describe('Tên hoặc viết tắt ngân hàng'),
            }),
        },
        async ({ query }) => {
            const data = await executeResolveBank(env, query);
            return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
        }
    );
}
