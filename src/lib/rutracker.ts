import * as cheerio from "cheerio";
import {
  RUTRACKER_BASE,
  open,
  login as browserLogin,
  checkRuTracker as checkBrowser,
  isLoggedIn,
} from "./browser";

export { RUTRACKER_BASE };

// Último fetch para diagnóstico (usado pela route /test?action=search)
let lastFetchInfo: { url?: string; ok?: boolean; len?: number; torTbl?: boolean; challenge?: boolean } | undefined;

export function lastFetch() {
  return lastFetchInfo;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function login(
  username: string,
  password: string
): Promise<boolean> {
  return browserLogin(username, password);
}

export async function checkRuTracker() {
  return checkBrowser();
}

export interface RuTrackerTorrent {
  id: string;
  title: string;
  size: string;
  sizeBytes: number;
  seeds: number;
  leeches: number;
  category: string;
  magnetLink?: string;
  infoHash?: string;
}

/**
 * Search RuTracker.
 * @param forumIds  – e.g. ["22"] for Зарубежное кино (HD Видео)
 * @param only1080  – keep only results whose title contains "1080"
 */
export async function search(
  query: string,
  opts: { forumIds?: string[]; only1080?: boolean } = {}
): Promise<RuTrackerTorrent[]> {
  const params = new URLSearchParams();
  params.set("nm", query);
  if (opts.forumIds?.length) {
    for (const f of opts.forumIds) params.append("f[]", f);
  }

  const url = `${RUTRACKER_BASE}/tracker.php?${params}`;
  const html = await open(url);
  if (!html) {
    lastFetchInfo = { url, ok: false };
    return [];
  }
  lastFetchInfo = {
    url,
    ok: true,
    len: html.length,
    torTbl: html.includes("tor-tbl"),
    challenge: html.includes("Один момент") || html.includes("Just a moment"),
  };

  return parseResults(html, opts.only1080 ?? false);
}

export async function getMagnet(torrentId: string): Promise<string | null> {
  const html = await open(`${RUTRACKER_BASE}/viewtopic.php?t=${torrentId}`);
  if (!html) return null;
  const $ = cheerio.load(html);
  return $('a[href^="magnet:"]').first().attr("href") ?? null;
}

export { isLoggedIn };

// ─── HTML parser ────────────────────────────────────────────────────────────

function parseResults(html: string, only1080: boolean): RuTrackerTorrent[] {
  const $ = cheerio.load(html);
  const rows: RuTrackerTorrent[] = [];

  $("#tor-tbl tbody tr").each((_, el) => {
    try {
      const $r = $(el);
      const link = $r.find("a.tLink");
      const title = link.text().trim();
      const href = link.attr("href") ?? "";
      const id = href.match(/t=(\d+)/)?.[1] ?? "";
      if (!id || !title) return;

      if (only1080) {
        const lo = title.toLowerCase();
        if (
          !lo.includes("1080") &&
          !lo.includes("fullhd") &&
          !lo.includes("full hd") &&
          !lo.includes("4k") &&
          !lo.includes("2160") &&
          !lo.includes("uhd")
        )
          return;
      }

      const sizeTd = $r.find("td.tor-size");
      const sizeBytes = parseInt(
        sizeTd.attr("data-ts_text") ??
          sizeTd.find("u, a").attr("data-ts_text") ??
          "0",
        10
      );

      const seeds = parseInt(
        $r.find("td b.seedmed").first().text().trim() ||
          $r.find("td.seed").first().text().trim() ||
          "0",
        10
      );
      const leeches = parseInt(
        $r.find("td.leechmed").first().text().trim() ||
          $r.find("td.leech").first().text().trim() ||
          "0",
        10
      );

      const category = $r.find("td.f-name-col a").text().trim();

      rows.push({
        id,
        title,
        size: fmtBytes(sizeBytes),
        sizeBytes,
        seeds,
        leeches,
        category,
      });
    } catch {
      /* skip */
    }
  });

  return rows.sort((a, b) => b.seeds - a.seeds);
}

// ─── Util ───────────────────────────────────────────────────────────────────

function fmtBytes(b: number): string {
  if (b <= 0) return "N/A";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / 1024 ** i).toFixed(1)} ${u[i]}`;
}

export function extractInfoHash(magnet: string): string | null {
  const hex = magnet.match(/btih:([a-fA-F0-9]{40})/i);
  if (hex) return hex[1].toLowerCase();
  const b32 = magnet.match(/btih:([A-Z2-7]{32})/i);
  if (b32) {
    const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = "";
    for (const c of b32[1].toUpperCase()) {
      const v = alpha.indexOf(c);
      if (v < 0) return null;
      bits += v.toString(2).padStart(5, "0");
    }
    let h = "";
    for (let i = 0; i + 4 <= bits.length; i += 4)
      h += parseInt(bits.slice(i, i + 4), 2).toString(16);
    return h;
  }
  return null;
}