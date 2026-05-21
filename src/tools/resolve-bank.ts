import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, type Env } from '../lib/api.js';

export async function executeResolveBank(env: Env, query: string) {
    const res = await apiFetch(env, `/api/v1/banks?q=${encodeURIComponent(query)}`);
    const json = await res.json() as { success: boolean; data: Record<string, unknown>[] };
    if (!json.success) throw new Error('Failed to resolve bank');
    return json.data[0] ?? null;
}

export function registerResolveBank(server: McpServer, env: Env) {
    server.registerTool(
        'resolveBank',
        {
            title: 'Resolve Bank',
            description: 'Find a bank by name or alias (e.g. "vcb", "vietcombank", "a chau"). Returns the bank object, or null if not found. Use listBanks to browse all options.',
            inputSchema: z.object({
                query: z.string().describe('Bank name or alias to search for'),
            }),
            annotations: { readOnlyHint: true, destructiveHint: false },
        },
        async ({ query }) => {
            try {
                const data = await executeResolveBank(env, query);
                return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
            } catch (err) {
                return { isError: true, content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
            }
        }
    );
}
