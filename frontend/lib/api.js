const productionApiUrl = "https://nirikshan-production.up.railway.app";

export function getApiUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const isBrowser = typeof window !== "undefined";
  const isLocalBrowser = isBrowser
    && ["localhost", "127.0.0.1"].includes(window.location.hostname);

  if (configuredUrl && (!isBrowser || isLocalBrowser || !configuredUrl.includes("localhost"))) {
    return configuredUrl.replace(/\/+$/, "");
  }

  return productionApiUrl;
}
