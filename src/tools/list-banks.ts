import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, type Env } from '../lib/api.js';

export async function executeListBanks(env: Env) {
    const res = await apiFetch(env, '/api/v1/banks');
    const json = await res.json() as { success: boolean; data: Record<string, unknown>[] };
    if (!json.success) throw new Error('Không thể lấy danh sách ngân hàng');
    return json.data.map(({ id, name, full_name, link, networks }) => ({ id, name, full_name, link, networks }));
}

export function registerListBanks(server: McpServer, env: Env) {
    server.registerTool(
        'listBanks',
        {
            description: 'Liệt kê tất cả ngân hàng phát hành thẻ tại Việt Nam.',
            inputSchema: z.object({}),
        },
        async () => {
            const data = await executeListBanks(env);
            return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
        }
    );
}
