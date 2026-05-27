import { describe, it, expect, vi, afterEach } from 'vitest';
import { executeCompare } from '../../tools/compare-cards.ts';

const mockEnv = { MCP_API_KEY: 'k', OPENWALLET_API_KEY: 'k', OPENWALLET_API_URL: 'http://api.test' } as unknown as import('../../lib/api.ts').Env;

afterEach(() => vi.restoreAllMocks());

describe('executeCompare', () => {
    it('fetches each card in parallel and strips heavy fields', async () => {
        const cards = [
            { id: 'techcombank-spark', name: 'Spark', bank_id: 'techcombank', image: 'strip-me', sources: [] },
            { id: 'vpbank-flex', name: 'Flex', bank_id: 'vpbank', image: 'strip-me', sources: [] },
        ];
        let callCount = 0;
        vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
            const card = cards[callCount++];
            return Promise.resolve(new Response(JSON.stringify({ success: true, data: card })));
        }));

        const result = await executeCompare(mockEnv, ['techcombank-spark', 'vpbank-flex']);
        expect(result).toHaveLength(2);
        expect(result[0]).not.toHaveProperty('image');
        expect(result[0]).not.toHaveProperty('sources');
        expect(result[0]).toHaveProperty('id');
        expect((fetch as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(2);
    });

    it('throws if one card not found', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: false }))
        ));
        await expect(
            executeCompare(mockEnv, ['bad-id', 'also-bad'])
        ).rejects.toThrow();
    });
});
