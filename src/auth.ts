export interface McpKey {
    key: string;
    expires: string;
    label: string;
}

export function validateKey(key: string | null | undefined, keysJson: string): { valid: boolean; label?: string } {
    if (!key) return { valid: false };

    let keys: McpKey[];
    try {
        keys = JSON.parse(keysJson);
    } catch {
        return { valid: false };
    }

    const match = keys.find(k => k.key === key);
    if (!match) return { valid: false };

    if (new Date() > new Date(match.expires)) return { valid: false };

    return { valid: true, label: match.label };
}
