# Debug Notes

## 2026-05-22 — Inspector 401 on mcp.openwallet.vn

**Symptom:** `https://inspector.openwallet.vn` → 401; could not connect to MCP server.

**Root cause:** Commit `157036c` (multi-key auth rewrite) dropped the inspector origin bypass that `67ce0a5` had added. Auth check ran for all non-localhost origins including inspector.

**Fix (`src/index.ts`):**
- Added `isInspector = origin === 'https://inspector.openwallet.vn'`
- Changed `if (!isLocalhost)` → `if (!isLocalhost && !isInspector)`
- Committed as `fe71d15`

**Secondary:** `worker-configuration.d.ts` was stale (referenced old `MCP_API_KEY`). Fixed by running `npx wrangler types` — file is gitignored so no commit needed.

## 2026-06-06 — CI pnpm build scripts blocked + CF Pages workspace error

**Symptom:** `ERR_PNPM_IGNORED_BUILDS` for `esbuild`, `sharp`, `workerd` in GitHub Actions CI.

**Root cause:** pnpm v11 moved config from `pnpm.yaml` → `pnpm-workspace.yaml` and renamed `onlyBuiltDependencies` → `allowBuilds`. Old `pnpm.yaml` was silently ignored.

**Fix:**
- Delete `pnpm.yaml`
- Create `pnpm-workspace.yaml` with:
  ```yaml
  packages: []
  allowBuilds:
    esbuild: true
    sharp: true
    workerd: true
  ```
- `packages: []` required — CF Pages errors with `packages field missing or empty` if omitted

**Secondary:** CI used `version: latest` for pnpm → pin to major version (e.g. `version: 11`) to avoid surprise breaks on pnpm major bumps.

---

## 2026-06-06 — Deploy blocked by removed Durable Object class

**Symptom:** Cloudflare deploy fails with `code: 10064` — script no longer exports class `OpenWalletMCP` which existing DOs depend on.

**Root cause:** Refactor removed the DO class without adding a migration.

**Fix:** Add to `wrangler.toml`:
```toml
[[migrations]]
tag = "v1-delete-do"
deleted_classes = ["OpenWalletMCP"]
```

**Rule:** Any time a Durable Object class is renamed or removed, add a `[[migrations]]` entry before deploying.

---

## 2026-06-06 — Free-tier quota exhaustion from DO SQLite writes

**Symptom:** Cloudflare free-tier DO SQLite row write quota exceeded. Caused by SSE reconnect loop — local dev MCP client pointed at prod URL (`mcp.openwallet.vn`), triggering repeated DO instantiation and SQLite writes on every reconnect.

**Root cause:** `McpAgent` (from `agents` package) uses Durable Objects with SQLite storage to maintain session state. MCP clients poll/reconnect aggressively → each reconnect = new DO instance = SQLite writes → quota blown fast.

**Fix (commit `a134e57`):** Replace `McpAgent` DO with stateless Cloudflare Worker using `WebStandardStreamableHTTPServerTransport` with `sessionIdGenerator: undefined`. No session state needed — all tools are pure API proxies.
- Removed `agents` dep entirely
- Removed `[[durable_objects]]` and `[[migrations]]` from `wrangler.toml`
- New transport created per request, discarded after

**Rule:** Never point local MCP client at prod URL during dev — use `wrangler dev` local instance (`http://localhost:8001`). Stateless transport eliminates the quota issue entirely but the principle holds.
