export interface StremioManifest {
  id: string;
  version: string;
  name: string;
  description: string;
  logo?: string;
  resources: (string | { name: string; types: string[]; idPrefixes?: string[] })[];
  types: string[];
  catalogs: { type: string; id: string; name: string; extra?: { name: string; isRequired?: boolean }[] }[];
  idPrefixes: string[];
  behaviorHints?: Record<string, boolean>;
}

export function baseUrl(req: Request): string {
  const host = req.headers.get("host") ?? "localhost:3000";
  const local = host.startsWith("localhost") || host.startsWith("127.");
  return `${local ? "http" : "https"}://${host}`;
}

export function manifest(base: string): StremioManifest {
  return {
    id: "org.stremio.rutracker",
    version: "1.0.0",
    name: "RuTracker",
    description:
      "Streams do RuTracker.org — Cinema HD 1080p. Requer conta RuTracker.",
    logo: `${base}/logo.svg`,
    resources: [
      { name: "stream", types: ["movie", "series"], idPrefixes: ["tt"] },
      { name: "catalog", types: ["movie", "series"] },
    ],
    types: ["movie", "series"],
    catalogs: [
      {
        type: "movie",
        id: "rutracker-search",
        name: "RuTracker",
        extra: [{ name: "search", isRequired: true }],
      },
      {
        type: "series",
        id: "rutracker-search",
        name: "RuTracker",
        extra: [{ name: "search", isRequired: true }],
      },
    ],
    idPrefixes: ["tt"],
    behaviorHints: { configurable: true, configurationRequired: true },
  };
}

// ─── Config encoding ────────────────────────────────────────────────────────

export interface AddonConfig {
  username: string;
  password: string;
}

export function encodeConfig(c: AddonConfig): string {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}

export function decodeConfig(s: string): AddonConfig | null {
  try {
    // support both base64 and base64url
    const json = Buffer.from(s, "base64url").toString("utf-8");
    const parsed = JSON.parse(json);
    if (parsed.username && parsed.password) return parsed;
    // fallback: try standard base64
    const json2 = Buffer.from(s, "base64").toString("utf-8");
    const p2 = JSON.parse(json2);
    if (p2.username && p2.password) return p2;
    return null;
  } catch {
    return null;
  }
}
