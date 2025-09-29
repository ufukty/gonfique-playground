export interface Env {
  ASSETS: Fetcher;
}

const PAGES_HOSTNAME = "gonfique.pages.dev";
const CANONICAL_HOSTNAME = "gonfique.com";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname === PAGES_HOSTNAME) {
      url.hostname = CANONICAL_HOSTNAME;
      url.protocol = "https:";
      return Response.redirect(url.toString(), 308);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status === 404 && request.method === "GET" && !url.pathname.includes(".")) {
      const indexUrl = new URL("/index.html", url.origin);
      return env.ASSETS.fetch(new Request(indexUrl.toString(), request));
    }

    return assetResponse;
  },
};
