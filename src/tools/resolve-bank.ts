import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, stripBank, type Env } from '../lib/api.js';

const MAX_CANDIDATES = 5;

export async function executeFindBank(env: Env, query: string) {
    const res = await apiFetch(env, `/api/v1/banks?q=${encodeURIComponent(query)}`);
    const json = await res.json() as { success: boolean; data: Record<string, unknown>[] };
    if (!json.success) throw new Error('Failed to resolve bank');
    const { data } = json;
    if (data.length === 0) return null;
    if (data.length === 1) return { ...stripBank(data[0]), confidence: 'exact' as const };
    return {
        confidence: 'ambiguous' as const,
        message: `"${query}" matched ${data.length} banks. Ask the user which bank they mean.`,
        matches: data.slice(0, MAX_CANDIDATES).map(stripBank),
    };
}

export function registerFindBank(server: McpServer, env: Env) {
    server.registerTool(
        'findBank',
        {
            title: 'Find Bank',
            description: 'Find a bank by name or alias (e.g. "vcb", "vietcombank", "a chau"). Returns the bank object with confidence: "exact" when unambiguous, or { confidence: "ambiguous", matches, message } when multiple banks match — in that case, present the matches to the user and ask them to clarify. Returns null if not found. Use banks to browse all options.',
            inputSchema: z.object({
                query: z.string().describe('Bank name or alias to search for'),
            }),
            annotations: { readOnlyHint: true, destructiveHint: false },
        },
        async ({ query }) => {
            try {
                const data = await executeFindBank(env, query);
                return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
            } catch (err) {
                return { isError: true, content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
            }
        }
    );
}
