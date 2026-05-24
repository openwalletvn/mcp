import { describe, it, expect, vi, afterEach } from 'vitest';
import { executeSearchCards } from '../../tools/search-cards.ts';

const mockEnv = { MCP_API_KEY: 'k', OPENWALLET_API_KEY: 'k', OPENWALLET_API_URL: 'http://api.test' } as unknown as import('../../lib/api.ts').Env;

const MOCK_CARD = {
    id: 'techcombank-spark',
    name: 'Techcombank Spark',
    bank_id: 'techcombank',
    image: 'should-be-stripped',
    sources: 'should-be-stripped',
};

afterEach(() => vi.restoreAllMocks());

describe('executeSearchCards', () => {
    it('strips heavy fields from card data', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: true, data: [MOCK_CARD] }))
        ));
        const result = await executeSearchCards(mockEnv, { limit: 5 });
        expect(result[0]).not.toHaveProperty('image');
        expect(result[0]).not.toHaveProperty('sources');
        expect(result[0]).toHaveProperty('id', 'techcombank-spark');
    });

    it('respects limit', async () => {
        const cards = Array.from({ length: 10 }, (_, i) => ({ id: `card-${i}`, name: `Card ${i}`, bank_id: 'test' }));
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: true, data: cards }))
        ));
        const result = await executeSearchCards(mockEnv, { limit: 3 });
        expect(result).toHaveLength(3);
    });

    it('passes bank_id and intent as query params', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: true, data: [] }))
        ));
        await executeSearchCards(mockEnv, { bank_id: 'vpbank', intent: 'shopee', limit: 5 });
        const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(url).toContain('bank_id=vpbank');
        expect(url).toContain('intent=shopee');
    });
});
