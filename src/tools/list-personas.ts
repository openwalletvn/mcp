import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, type Env } from '../lib/api.js';

export async function executePersonas(env: Env) {
    const res = await apiFetch(env, '/api/v1/personas');
    const json = await res.json() as { success: boolean; data: unknown };
    if (!json.success) throw new Error('Failed to fetch personas');
    return json.data;
}

export function registerPersonas(server: McpServer, env: Env) {
    server.registerTool(
        'personas',
        {
            title: 'List Personas',
            description: 'List all preset spend personas (e.g. shopee, traveler, commuter). Each persona bundles a card filter and ranked intent set. Use a persona slug in rank or cards tools instead of specifying intents manually.',
            inputSchema: z.object({}),
            annotations: { readOnlyHint: true, destructiveHint: false },
        },
        async () => {
            try {
                const data = await executePersonas(env);
                return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
            } catch (err) {
                return { isError: true, content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
            }
        }
    );
}
