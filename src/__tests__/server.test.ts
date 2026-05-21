import { describe, it, expect } from 'vitest';
import { createMcpServer } from '../server.ts';

const mockEnv = {
    MCP_API_KEY: 'test-key',
    OPENWALLET_API_KEY: 'api-key',
    OPENWALLET_API_URL: 'http://api.test',
};

const EXPECTED_TOOLS = [
    'listBanks',
    'resolveBank',
    'listIntents',
    'searchCards',
    'getCardDetail',
    'resolveCard',
    'rankCardsForSpend',
    'compareCards',
];

describe('MCP server', () => {
    it('registers exactly 8 tools', () => {
        const server = createMcpServer(mockEnv);
        const registered = Object.keys((server as any)._registeredTools ?? {});
        expect(registered).toHaveLength(8);
    });

    it('registers all expected tool names', () => {
        const server = createMcpServer(mockEnv);
        const registered = Object.keys((server as any)._registeredTools ?? {});
        for (const name of EXPECTED_TOOLS) {
            expect(registered).toContain(name);
        }
    });
});
