#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createJiti } from "jiti";

function definedEntries(value) {
  return Object.fromEntries(Object.entries(value || {}).filter(([, field]) => field !== undefined));
}

export async function backfillClaudeProfiles({
  connections,
  resolveProxy,
  postExchange,
  mapTokens,
  updateConnection,
  apply = false,
}) {
  const result = {
    scanned: connections.length,
    eligible: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    failureReasons: {},
  };
  const fail = (reason) => {
    result.failed += 1;
    result.failureReasons[reason] = (result.failureReasons[reason] || 0) + 1;
  };

  for (const connection of connections) {
    const placeholderName = !connection.name || /^Account \d+$/i.test(connection.name);
    const needsIdentity = !connection.email || !connection.providerSpecificData?.accountId || placeholderName;
    if (connection.provider !== "claude" || connection.authType !== "oauth" || !connection.accessToken || !needsIdentity) {
      result.skipped += 1;
      continue;
    }
    result.eligible += 1;

    try {
      const proxyOptions = await resolveProxy(connection.providerSpecificData);
      if (proxyOptions?.proxyUnavailable === true || proxyOptions?.source === "unavailable") {
        fail("proxy_unavailable");
        continue;
      }
      const extra = await postExchange({ access_token: connection.accessToken }, proxyOptions);
      if (!extra?.profile) {
        fail("profile_unavailable");
        continue;
      }

      const mapped = mapTokens({ access_token: connection.accessToken }, extra);
      const providerSpecificData = {
        ...(connection.providerSpecificData || {}),
        ...definedEntries(mapped.providerSpecificData),
      };
      const preferredName = mapped.email
        || mapped.displayName
        || providerSpecificData.accountId?.slice(0, 8)
        || connection.name;
      const update = {
        ...(placeholderName && preferredName ? { name: preferredName } : {}),
        ...(mapped.email ? { email: mapped.email } : {}),
        ...(mapped.displayName ? { displayName: mapped.displayName } : {}),
        providerSpecificData,
      };
      if (apply) await updateConnection(connection.id, update);
      result.updated += 1;
    } catch {
      fail("unexpected");
    }
  }

  return result;
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const dataDirIndex = process.argv.indexOf("--data-dir");
  if (dataDirIndex !== -1) {
    const value = process.argv[dataDirIndex + 1];
    if (!value || value.startsWith("--")) throw new Error("--data-dir requires a path");
    process.env.DATA_DIR = path.resolve(value);
  }
  const apply = process.argv.includes("--apply");
  const jiti = createJiti(import.meta.url, {
    alias: {
      "@": path.join(root, "src"),
      "open-sse": path.join(root, "open-sse"),
    },
  });
  const db = await jiti.import(path.join(root, "src/lib/db/index.js"));
  const { resolveConnectionProxyConfig } = await jiti.import(path.join(root, "src/lib/network/connectionProxy.js"));
  const { getProvider } = await jiti.import(path.join(root, "src/lib/oauth/providers.js"));
  await db.initDb();

  const provider = getProvider("claude");
  const connections = await db.getProviderConnections({ provider: "claude" });
  const result = await backfillClaudeProfiles({
    connections,
    resolveProxy: resolveConnectionProxyConfig,
    postExchange: provider.postExchange,
    mapTokens: provider.mapTokens,
    updateConnection: db.updateProviderConnection,
    apply,
  });
  process.stdout.write(
    `Claude profile backfill: mode=${apply ? "apply" : "dry-run"} scanned=${result.scanned} eligible=${result.eligible} updated=${result.updated} skipped=${result.skipped} failed=${result.failed} failure_reasons=${Object.entries(result.failureReasons).map(([reason, count]) => `${reason}:${count}`).join(",") || "none"}\n`,
  );
  if (result.failed > 0) process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  await main();
}
