export interface StremioManifest {
  id: string;
  version: string;
  name: string;
  description: string;
  logo?: string;
  background?: string;
  resources: (string | { name: string; types: string[]; idPrefixes?: string[] })[];
  types: string[];
  catalogs: StremioManifestCatalog[];
  idPrefixes: string[];
  behaviorHints?: Record<string, boolean>;
}

export interface StremioManifestCatalog {
  type: string;
  id: string;
  name: string;
  extra?: Array<{ name: string; isRequired?: boolean }>;
}

export function getBaseUrl(request: Request): string {
  const host = request.headers.get("host") || "localhost:3000";
  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const proto = isLocalhost ? "http" : "https";
  return `${proto}://${host}`;
}

export function getManifest(baseUrl: string): StremioManifest {
  return {
    id: "org.stremio.torrentfinder",
    version: "1.0.0",
    name: "Torrent Finder",
    description:
      "Pesquise filmes e séries com torrents de múltiplas fontes (1337x, TPB, RuTracker, e mais). Sem necessidade de conta.",
    logo: `${baseUrl}/logo.svg`,
    resources: [
      {
        name: "stream",
        types: ["movie", "series"],
        idPrefixes: ["tt"],
      },
      {
        name: "catalog",
        types: ["movie", "series"],
      },
    ],
    types: ["movie", "series"],
    catalogs: [
      {
        type: "movie",
        id: "torrentfinder-search",
        name: "Torrent Finder",
        extra: [
          { name: "search", isRequired: true },
          { name: "skip", isRequired: false },
        ],
      },
      {
        type: "series",
        id: "torrentfinder-search",
        name: "Torrent Finder",
        extra: [
          { name: "search", isRequired: true },
          { name: "skip", isRequired: false },
        ],
      },
    ],
    idPrefixes: ["tt"],
    behaviorHints: {
      configurable: false,
    },
  };
}
