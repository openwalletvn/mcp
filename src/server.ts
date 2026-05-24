import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Env} from './lib/api.js';
import {sendTrace} from './lib/langfuse.js';
import pkg from '../package.json';
import {registerListBanks} from './tools/list-banks.js';
import {registerResolveBank} from './tools/resolve-bank.js';
import {registerListIntents} from './tools/list-intents.js';
import {registerSearchCards} from './tools/search-cards.js';
import {registerGetCardDetail} from './tools/get-card-detail.js';
import {registerResolveCard} from './tools/resolve-card.js';
import {registerRankCardsForSpend} from './tools/rank-cards-for-spend.js';
import {registerCompareCards} from './tools/compare-cards.js';

export function createMcpServer(env: Env, server?: McpServer): McpServer {
    if (!server) {
        server = new McpServer(
            {name: 'openwallet-mcp', version: pkg.version},
            { instructions: 'Use resolveBank or resolveCard to get IDs before calling detail tools. Use listIntents to discover valid spend category slugs before calling rankCardsForSpend or filtering searchCards by intent.' }
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

    registerListBanks(server, env);
    registerResolveBank(server, env);
    registerListIntents(server, env);
    registerSearchCards(server, env);
    registerGetCardDetail(server, env);
    registerResolveCard(server, env);
    registerRankCardsForSpend(server, env);
    registerCompareCards(server, env);

    return server;
}
