import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, stripBank, type Env } from '../lib/api.js';

export async function executeBanks(env: Env) {
    const res = await apiFetch(env, '/api/v1/banks');
    const json = await res.json() as { success: boolean; data: Record<string, unknown>[] };
    if (!json.success) throw new Error('Failed to fetch bank list');
    return json.data.map(stripBank);
}

export function registerBanks(server: McpServer, env: Env) {
    server.registerTool(
        'banks',
        {
            title: 'List Banks',
            description: 'List all card-issuing banks in Vietnam. Returns id, name, full_name, link, and supported networks for each bank.',
            inputSchema: z.object({}),
            annotations: { readOnlyHint: true, destructiveHint: false },
        },
        async () => {
            try {
                const data = await executeBanks(env);
                return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
            } catch (err) {
                return { isError: true, content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
            }
        }
    );
}
