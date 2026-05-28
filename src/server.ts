import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Env} from './lib/api.js';
import {sendTrace} from './lib/langfuse.js';
import pkg from '../package.json';
import {registerBanks} from './tools/list-banks.js';
import {registerFindBank} from './tools/find-bank.js';
import {registerIntents} from './tools/list-intents.js';
import {registerCards} from './tools/search-cards.js';
import {registerCard} from './tools/get-card-detail.js';
import {registerFindCard} from './tools/find-card.js';
import {registerRank} from './tools/rank-cards-for-spend.js';
import {registerCompare} from './tools/compare-cards.js';
import {registerCashback} from './tools/cashback-card.js';

export function createMcpServer(env: Env, server?: McpServer): McpServer {
    if (!server) {
        server = new McpServer(
            {name: 'openwallet-mcp', version: pkg.version},
            { instructions: 'Use findBank or findCard to get IDs before calling detail tools. Use intents to discover valid spend category slugs before calling rank or filtering cards by intent.' }
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalRegisterTool = (server.registerTool as any).bind(server);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (server as any).registerTool = (name: string, schema: any, handler: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return originalRegisterTool(name, schema, async (...args: any[]) => {
            const input = args[0];
            const start = Date.now();
            try {
                const result = await handler(...args);
                await sendTrace(env, {
                    name: `mcp:${name}`,
                    input,
                    output: result,
                    metadata: { latencyMs: Date.now() - start },
                });
                return result;
            } catch (err) {
                await sendTrace(env, {
                    name: `mcp:${name}`,
                    input,
                    level: 'ERROR',
                    statusMessage: String(err),
                    metadata: { latencyMs: Date.now() - start },
                });
                throw err;
            }
        });
    };

    registerBanks(server, env);
    registerFindBank(server, env);
    registerIntents(server, env);
    registerCards(server, env);
    registerCard(server, env);
    registerFindCard(server, env);
    registerRank(server, env);
    registerCompare(server, env);
    registerCashback(server, env);

    return server;
}
