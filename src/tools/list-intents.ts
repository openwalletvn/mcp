import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, type Env } from '../lib/api.js';

export async function executeListIntents(env: Env) {
    const res = await apiFetch(env, '/api/v1/intents');
    const json = await res.json() as { success: boolean; data: unknown };
    if (!json.success) throw new Error('Không thể lấy danh sách intent');
    return json.data;
}

export function registerListIntents(server: McpServer, env: Env) {
    server.registerTool(
        'listIntents',
        {
            description: 'Liệt kê tất cả intent slug hợp lệ để dùng trong searchCards và rankCardsForSpend.',
            inputSchema: z.object({}),
        },
        async () => {
            const data = await executeListIntents(env);
            return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
        }
    );
}
