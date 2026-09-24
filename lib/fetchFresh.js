// A `fetch()` wrapper for every call this app makes to its own API.
//
// The server already answers with `Cache-Control: no-store` (see
// middleware.js), which is correct and sufficient for a normal browser —
// but a guest or admin on a mobile connection can sit behind a carrier or
// VPN transparent proxy that caches GET responses by URL regardless of
// what headers the origin server sends. That layer is outside anything
// this app controls, and it reproduced exactly this way: a genuinely fresh
// page load, in a brand-new tab, still showed a stale order status,
// while a differently-shaped URL (a status filter) came back correct —
// consistent with a URL-keyed cache holding an old response for the
// frequently-hit, parameter-less endpoint.
//
// The one thing guaranteed to defeat a URL-keyed cache is a URL that is
// never the same twice. Every call through here gets a cache-busting query
// param on top of `cache: "no-store"` (which only helps with the browser's
// own cache, not anything upstream of it).
export function fetchFresh(url, options) {
  const bust = `${url.includes("?") ? "&" : "?"}_=${Date.now()}`;
  return fetch(`${url}${bust}`, { cache: "no-store", ...options });
}
