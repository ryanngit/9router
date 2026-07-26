#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createJiti } from "jiti";

function definedEntries(value) {
  return Object.fromEntries(Object.entries(value || {}).filter(([, field]) => field !== undefined));
}

function profileFailureReason(extra, prefix = "profile") {
  const status = Number(extra?.profileStatus);
  if (Number.isInteger(status) && status >= 100 && status <= 599) return `${prefix}_http_${status}`;
  if (extra?.profileStatus === "request_failed") return `${prefix}_request_failed`;
  return `${prefix}_unavailable`;
}

export function parseClaudeProfileBackfillArgs(argv = process.argv.slice(2), cwd = process.cwd()) {
  const apply = argv.includes("--apply");
  const dataDirIndex = argv.indexOf("--data-dir");
  let dataDir = null;
  if (dataDirIndex !== -1) {
    const value = argv[dataDirIndex + 1];
    if (!value || value.startsWith("--")) throw new Error("--data-dir requires a path");
    dataDir = path.resolve(cwd, value);
  }
  if (!apply && !dataDir) {
    throw new Error("Claude profile backfill dry-run requires an explicit copied/offline --data-dir");
  }
  return { apply, dataDir };
}

export async function backfillClaudeProfiles({
  connections,
  resolveProxy,
  postExchange,
  refreshCredentials,
  mapTokens,
  updateConnection,
  adapter,
  apply = false,
}) {
  if (apply && adapter?.transactionScope === "process") {
    throw new Error("Claude profile backfill --apply requires a native process-safe database adapter; sql.js is unsupported");
  }
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
      let accessToken = connection.accessToken;
      let extra = await postExchange({ access_token: accessToken }, proxyOptions);
      if (
        !extra?.profile
        && apply
        && Number(extra?.profileStatus) === 401
        && connection.refreshToken
        && refreshCredentials
      ) {
        let refreshed;
        try {
          refreshed = await refreshCredentials(connection.refreshToken, null, proxyOptions);
        } catch {
          fail("profile_refresh_failed");
          continue;
        }
        if (!refreshed?.accessToken) {
          fail("profile_refresh_failed");
          continue;
        }

        const credentialUpdate = {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken || connection.refreshToken,
        };
        if (refreshed.expiresIn !== undefined) {
          credentialUpdate.expiresIn = refreshed.expiresIn;
          const expiresIn = Number(refreshed.expiresIn);
          if (Number.isFinite(expiresIn) && expiresIn > 0) {
            credentialUpdate.expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
          }
        } else if (refreshed.expiresAt) {
          credentialUpdate.expiresAt = refreshed.expiresAt;
        }
        await updateConnection(connection.id, credentialUpdate);

        accessToken = refreshed.accessToken;
        extra = await postExchange({ access_token: accessToken }, proxyOptions);
        if (!extra?.profile) {
          fail(profileFailureReason(extra, "profile_retry"));
          continue;
        }
      }
      if (!extra?.profile) {
        fail(profileFailureReason(extra));
        continue;
      }

      const mapped = mapTokens({ access_token: accessToken }, extra);
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
  const { apply, dataDir } = parseClaudeProfileBackfillArgs();
  if (dataDir) process.env.DATA_DIR = dataDir;
  const jiti = createJiti(import.meta.url, {
    alias: {
      "@": path.join(root, "src"),
      "open-sse": path.join(root, "open-sse"),
    },
  });
  const db = await jiti.import(path.join(root, "src/lib/db/index.js"));
  const { getAdapter } = await jiti.import(path.join(root, "src/lib/db/driver.js"));
  const { resolveConnectionProxyConfig } = await jiti.import(path.join(root, "src/lib/network/connectionProxy.js"));
  const { getProvider } = await jiti.import(path.join(root, "src/lib/oauth/providers.js"));
  const { refreshClaudeOAuthToken } = await jiti.import(path.join(root, "open-sse/services/tokenRefresh/providers.js"));
  const adapter = await getAdapter();

  const provider = getProvider("claude");
  const connections = await db.getProviderConnections({ provider: "claude" });
  const result = await backfillClaudeProfiles({
    connections,
    resolveProxy: resolveConnectionProxyConfig,
    postExchange: provider.postExchange,
    refreshCredentials: refreshClaudeOAuthToken,
    mapTokens: provider.mapTokens,
    updateConnection: db.updateProviderConnection,
    adapter,
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
