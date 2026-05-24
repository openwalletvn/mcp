export interface AnalyticsEngineDataset {
    writeDataPoint(event: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void;
}

export interface Env {
    MCP_KEYS: string;
    OPENWALLET_API_KEY: string;
    OPENWALLET_API_URL: string;
    ANALYTICS: AnalyticsEngineDataset;
}

export async function apiFetch(env: Env, path: string, options?: RequestInit): Promise<Response> {
    const url = `${env.OPENWALLET_API_URL}${path}`;
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'X-OpenWallet-Key': env.OPENWALLET_API_KEY,
            ...(options?.headers ?? {}),
        },
    });
}

const CARD_FIELDS = [
    'id', 'name', 'bank_id', 'card_network', 'card_tier', 'card_type', 'co_brand',
    'status', 'currency', 'statement_date', 'interest_free_days', 'card_link',
    'is_metal', 'for_business', 'intents', 'contactless_methods',
    'fees', 'cashback', 'description', 'score', '_source',
];

const BANK_FIELDS = [
    'id', 'name', 'full_name', 'link', 'stats', 'networks', '_source',
];

export function stripCard(card: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(CARD_FIELDS.filter(k => k in card).map(k => [k, card[k]]));
}

export function stripBank(bank: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(BANK_FIELDS.filter(k => k in bank).map(k => [k, bank[k]]));
}
