import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiFetch, type Env } from '../lib/api.js';

export async function executeIntentGroups(env: Env) {
    const res = await apiFetch(env, '/api/v1/intent-groups');
    const json = await res.json() as { success: boolean; data: unknown };
    if (!json.success) throw new Error('Failed to fetch intent groups');
    return json.data;
}

export function registerIntentGroups(server: McpServer, env: Env) {
    server.registerTool(
        'intentGroups',
        {
            title: 'List Intent Groups',
            description: 'List the hierarchical intent group tree — top-level spend categories (e.g. "shopping", "travel") and their child intent slugs. Use to understand how intents are organized before calling rank or filtering cards.',
            inputSchema: z.object({}),
            annotations: { readOnlyHint: true, destructiveHint: false },
        },
        async () => {
            try {
                const data = await executeIntentGroups(env);
                return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
            } catch (err) {
                return { isError: true, content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
            }
        }
    );
}
