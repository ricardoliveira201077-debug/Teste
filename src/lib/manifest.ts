export interface StremioManifest {
  id: string;
  version: string;
  name: string;
  description: string;
  logo?: string;
  background?: string;
  resources: string[];
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

export function getManifest(baseUrl: string): StremioManifest {
  return {
    id: "org.stremio.rutracker",
    version: "1.0.0",
    name: "RuTracker",
    description:
      "Pesquise filmes e séries no RuTracker.org - O maior tracker de torrents da Rússia. Requer conta no RuTracker.",
    logo: `${baseUrl}/logo.svg`,
    resources: ["stream"],
    types: ["movie", "series"],
    catalogs: [],
    idPrefixes: ["tt"],
    behaviorHints: {
      configurable: true,
      configurationRequired: true,
    },
  };
}
