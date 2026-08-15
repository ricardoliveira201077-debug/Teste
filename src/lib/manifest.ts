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
  // Always use HTTPS in production, HTTP only for localhost
  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const proto = isLocalhost ? "http" : "https";
  return `${proto}://${host}`;
}

export function getManifest(baseUrl: string): StremioManifest {
  return {
    id: "org.stremio.rutracker",
    version: "1.0.0",
    name: "RuTracker",
    description:
      "Pesquise filmes e séries no RuTracker.org. Requer conta no RuTracker.",
    logo: `${baseUrl}/logo.svg`,
    resources: [
      "stream",
      {
        name: "catalog",
        types: ["movie", "series"],
      },
    ],
    types: ["movie", "series"],
    catalogs: [
      {
        type: "movie",
        id: "rutracker-search",
        name: "RuTracker",
        extra: [
          { name: "search", isRequired: true },
          { name: "skip", isRequired: false },
        ],
      },
      {
        type: "series",
        id: "rutracker-search",
        name: "RuTracker",
        extra: [
          { name: "search", isRequired: true },
          { name: "skip", isRequired: false },
        ],
      },
    ],
    idPrefixes: ["tt"],
    behaviorHints: {
      configurable: true,
      configurationRequired: true,
    },
  };
}
