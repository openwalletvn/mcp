import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Env } from './lib/api.js';
import { registerListBanks } from './tools/list-banks.js';
import { registerResolveBank } from './tools/resolve-bank.js';
import { registerListIntents } from './tools/list-intents.js';
import { registerSearchCards } from './tools/search-cards.js';
import { registerGetCardDetail } from './tools/get-card-detail.js';
import { registerResolveCard } from './tools/resolve-card.js';
import { registerRankCardsForSpend } from './tools/rank-cards-for-spend.js';
import { registerCompareCards } from './tools/compare-cards.js';

export function createMcpServer(env: Env, server?: McpServer): McpServer {
    if (!server) {
        server = new McpServer(
            { name: 'openwallet-mcp', version: '0.1.0' },
            { instructions: 'Use resolveBank or resolveCard to get IDs before calling detail tools. Use listIntents to discover valid spend category slugs before calling rankCardsForSpend or filtering searchCards by intent.' }
        );
    }

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
