/**
 * Abort k6 runs that would accidentally target production.
 */
export function isProductionUrl(url) {
  const environment = (__ENV.SOROSCAN_ENVIRONMENT || "").toLowerCase();
  if (environment === "production" || environment === "prod") {
    return true;
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch (err) {
    return false;
  }

  const host = (parsed.hostname || "").toLowerCase();
  if (!host) {
    return false;
  }
  if (["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(host)) {
    return false;
  }
  if (host.endsWith(".localhost") || host.endsWith(".local")) {
    return false;
  }

  const defaults = [
    "soroscan.io",
    "www.soroscan.io",
    "api.soroscan.io",
    "indexer.soroscan.io",
  ];
  const extra = (__ENV.SOROSCAN_PRODUCTION_HOSTS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const blocked = defaults.concat(extra);
  if (blocked.includes(host)) {
    return true;
  }

  const labels = host.split(".");
  return labels.includes("prod") || labels.includes("production");
}

export function assertSafeTarget(url) {
  const allow = (__ENV.ALLOW_PRODUCTION_LOAD || "").toLowerCase();
  if (isProductionUrl(url) && allow !== "true" && allow !== "1" && allow !== "yes") {
    throw new Error(
      `Refusing to send load at production target ${url}. ` +
        "Use a local/staging BASE_URL or set ALLOW_PRODUCTION_LOAD=true."
    );
  }
}
