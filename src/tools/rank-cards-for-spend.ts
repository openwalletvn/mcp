import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, type Env } from '../lib/api.js';

export interface RankCardsInput {
    spend: Record<string, number>;
    limit: number;
    type?: string;
}

export async function executeRankCardsForSpend(env: Env, input: RankCardsInput) {
    const res = await apiFetch(env, '/api/v1/cards/rank', {
        method: 'POST',
        body: JSON.stringify(input),
    });
    const json = await res.json() as { success: boolean; data: unknown; error?: string };
    if (!json.success) throw new Error(json.error ?? 'Không thể xếp hạng thẻ');
    return json.data;
}

export function registerRankCardsForSpend(server: McpServer, env: Env) {
    server.registerTool(
        'rankCardsForSpend',
        {
            description: 'CÔNG CỤ CHÍNH để tư vấn thẻ tốt nhất cho chi tiêu. Dùng khi người dùng hỏi "thẻ nào hoàn tiền tốt", "thẻ nào tốt nhất cho chi tiêu X". Xếp hạng tất cả thẻ theo hồ sơ chi tiêu thực tế. spend phải có ít nhất một key với giá trị > 0.',
            inputSchema: z.object({
                spend: z.record(z.string(), z.number()).describe(
                    'Hồ sơ chi tiêu: key là intent slug, value là VND/tháng. Ví dụ: {"ecommerce":5000000,"dining":2000000}'
                ),
                limit: z.number().int().min(1).max(10).default(3),
                type: z.enum(['credit', 'debit']).optional(),
            }),
        },
        async (input) => {
            const data = await executeRankCardsForSpend(env, input);
            return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
        }
    );
}
