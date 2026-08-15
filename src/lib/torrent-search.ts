export interface TorrentResult {
  title: string;
  infoHash: string;
  seeders: number;
  leechers: number;
  sizeBytes: number;
  source: string;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "N/A";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

// Search TorrentsCSV API
async function searchTorrentCSV(query: string): Promise<TorrentResult[]> {
  try {
    const url = `https://torrents-csv.com/service/search?q=${encodeURIComponent(query)}&size=20&page=1`;
    const response = await fetch(url, {
      headers: { "User-Agent": "StremioRuTracker/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return [];
    const data = await response.json();
    const items = Array.isArray(data) ? data : (data.torrents || data.results || []);

    return items.map((item: Record<string, unknown>) => ({
      title: (item.name as string) || (item.title as string) || "",
      infoHash: ((item.infohash as string) || (item.info_hash as string) || "").toLowerCase(),
      seeders: Number(item.seeders) || 0,
      leechers: Number(item.leechers) || 0,
      sizeBytes: Number(item.size_bytes) || Number(item.size) || 0,
      source: "TorrentsCSV",
    })).filter((t: TorrentResult) => t.infoHash && t.seeders > 0);
  } catch (error) {
    console.error("TorrentCSV search error:", error);
    return [];
  }
}

// Search Knaben API
async function searchKnaben(query: string): Promise<TorrentResult[]> {
  try {
    const response = await fetch("https://api.knaben.org/v1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "StremioRuTracker/1.0",
      },
      body: JSON.stringify({
        search_type: "name",
        search_field: query,
        order_by: "seeders",
        order_direction: "desc",
        from: 0,
        size: 20,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return [];
    const data = await response.json();
    const hits = data.hits || [];

    return hits
      .filter((h: Record<string, unknown>) => {
        const title = ((h.title as string) || "").toLowerCase();
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 2);
        // At least half of query words should be in the title
        const matches = queryWords.filter((w) => title.includes(w));
        return matches.length >= Math.ceil(queryWords.length / 2);
      })
      .map((h: Record<string, unknown>) => ({
        title: (h.title as string) || "",
        infoHash: ((h.hash as string) || "").toLowerCase(),
        seeders: Number(h.seeders) || 0,
        leechers: Number(h.peers) || 0,
        sizeBytes: Number(h.bytes) || 0,
        source: (h.tracker as string) || "Knaben",
      }))
      .filter((t: TorrentResult) => t.infoHash && t.seeders > 0);
  } catch (error) {
    console.error("Knaben search error:", error);
    return [];
  }
}

// Combined search across multiple sources
export async function searchTorrents(query: string): Promise<TorrentResult[]> {
  const [csvResults, knabenResults] = await Promise.allSettled([
    searchTorrentCSV(query),
    searchKnaben(query),
  ]);

  const results: TorrentResult[] = [];
  const seenHashes = new Set<string>();

  // Merge results, dedup by infoHash
  const allResults = [
    ...(csvResults.status === "fulfilled" ? csvResults.value : []),
    ...(knabenResults.status === "fulfilled" ? knabenResults.value : []),
  ];

  // Sort by seeders
  allResults.sort((a, b) => b.seeders - a.seeders);

  for (const r of allResults) {
    const hash = r.infoHash.toLowerCase();
    if (seenHashes.has(hash)) continue;
    seenHashes.add(hash);
    results.push(r);
    if (results.length >= 25) break;
  }

  return results;
}

// Build a magnet URL from infoHash and title
export function buildMagnetUrl(infoHash: string, title: string): string {
  const trackers = [
    "udp://tracker.opentrackr.org:1337/announce",
    "udp://open.stealth.si:80/announce",
    "udp://tracker.torrent.eu.org:451/announce",
    "udp://exodus.desync.com:6969/announce",
    "udp://tracker.openbittorrent.com:6969/announce",
  ];
  const params = new URLSearchParams();
  params.set("xt", `urn:btih:${infoHash}`);
  params.set("dn", title);
  for (const tr of trackers) {
    params.append("tr", tr);
  }
  return `magnet:?${params.toString()}`;
}

export { formatSize };
