import { describe, it, expect, vi, afterEach } from 'vitest';
import { executeCard } from '../../tools/get-card-detail.ts';

const mockEnv = { MCP_API_KEY: 'k', OPENWALLET_API_KEY: 'k', OPENWALLET_API_URL: 'http://api.test' } as unknown as import('../../lib/api.ts').Env;

const MOCK_CARD = {
    id: 'techcombank-spark',
    name: 'Techcombank Spark',
    bank_id: 'techcombank',
    card_network: 'visa',
    fees: { annual: 0 },
    image: 'should-be-stripped',
    sources: 'should-be-stripped',
};

afterEach(() => vi.restoreAllMocks());

describe('executeCard', () => {
    it('fetches card by ID and strips heavy fields', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: true, data: MOCK_CARD }))
        ));
        const result = await executeCard(mockEnv, 'techcombank-spark');
        expect(result).toHaveProperty('id', 'techcombank-spark');
        expect(result).toHaveProperty('fees');
        expect(result).not.toHaveProperty('image');
        expect(result).not.toHaveProperty('sources');
        const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(url).toContain('/api/v1/cards/techcombank-spark');
    });

    it('throws on API failure', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: false }))
        ));
        await expect(executeCard(mockEnv, 'nonexistent-card')).rejects.toThrow('Card not found');
    });
});
