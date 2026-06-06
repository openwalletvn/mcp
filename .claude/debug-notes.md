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
