# Debug Notes

## 2026-05-22 — Inspector 401 on mcp.openwallet.vn

**Symptom:** `https://inspector.openwallet.vn` → 401; could not connect to MCP server.

**Root cause:** Commit `157036c` (multi-key auth rewrite) dropped the inspector origin bypass that `67ce0a5` had added. Auth check ran for all non-localhost origins including inspector.

**Fix (`src/index.ts`):**
- Added `isInspector = origin === 'https://inspector.openwallet.vn'`
- Changed `if (!isLocalhost)` → `if (!isLocalhost && !isInspector)`
- Committed as `fe71d15`

**Secondary:** `worker-configuration.d.ts` was stale (referenced old `MCP_API_KEY`). Fixed by running `npx wrangler types` — file is gitignored so no commit needed.
