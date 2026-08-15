import * as cheerio from "cheerio";

export interface RuTrackerTorrent {
  id: string;
  title: string;
  size: string;
  sizeBytes: number;
  seeds: number;
  leeches: number;
  category: string;
  url: string;
  magnetLink?: string;
  infoHash?: string;
}

const RUTRACKER_URL = "https://rutracker.org";
const RUTRACKER_FORUM = `${RUTRACKER_URL}/forum`;

export class RuTrackerClient {
  private cookies: string[] = [];
  private isLoggedIn = false;

  async login(username: string, password: string): Promise<boolean> {
    try {
      const formData = new URLSearchParams();
      formData.append("login_username", username);
      formData.append("login_password", password);
      formData.append("login", "Вход");

      const response = await fetch(`${RUTRACKER_FORUM}/login.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        body: formData.toString(),
        redirect: "manual",
      });

      const setCookies = response.headers.getSetCookie?.() || [];
      if (setCookies.length > 0) {
        this.cookies = setCookies.map((c) => c.split(";")[0]);
      }

      // Check if we got the session cookie
      const cookieStr = this.cookies.join("; ");
      this.isLoggedIn =
        cookieStr.includes("bb_session") || cookieStr.includes("bb_data");

      // If redirect, follow it to confirm login
      if (response.status === 302 || response.status === 301) {
        this.isLoggedIn = true;
      }

      return this.isLoggedIn;
    } catch (error) {
      console.error("RuTracker login error:", error);
      return false;
    }
  }

  async search(query: string): Promise<RuTrackerTorrent[]> {
    try {
      const formData = new URLSearchParams();
      formData.append("nm", query);
      // Forum IDs for movies and series
      // 22 - Movies (foreign), 7 - Movies (russian), 
      // 189 - Series (foreign), 9 - Series (russian)
      // Leave empty to search all categories

      const response = await fetch(`${RUTRACKER_FORUM}/tracker.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Cookie: this.cookies.join("; "),
        },
        body: formData.toString(),
      });

      const html = await response.text();
      return this.parseSearchResults(html);
    } catch (error) {
      console.error("RuTracker search error:", error);
      return [];
    }
  }

  private parseSearchResults(html: string): RuTrackerTorrent[] {
    const $ = cheerio.load(html);
    const torrents: RuTrackerTorrent[] = [];

    $("#tor-tbl tbody tr").each((_, row) => {
      try {
        const $row = $(row);

        const titleLink = $row.find("td.t-title-col a.tLink");
        const title = titleLink.text().trim();
        const href = titleLink.attr("href") || "";
        const idMatch = href.match(/t=(\d+)/);
        const id = idMatch ? idMatch[1] : "";

        if (!id || !title) return;

        const sizeEl = $row.find("td.tor-size a, td.tor-size u");
        const sizeBytes = parseInt(sizeEl.attr("data-ts_text") || "0", 10);
        const sizeText = sizeEl.text().trim() || formatBytes(sizeBytes);

        const seedsEl = $row.find("td.seed b, td:nth-child(7) b");
        const seeds = parseInt(seedsEl.text().trim() || "0", 10);

        const leechesEl = $row.find("td.leech b, td:nth-child(8) b");
        const leeches = parseInt(leechesEl.text().trim() || "0", 10);

        const category = $row.find("td.f-name-col a").text().trim();

        // Try to extract magnet link directly
        const magnetEl = $row.find("a[href^='magnet:']");
        const magnetLink = magnetEl.attr("href") || undefined;

        torrents.push({
          id,
          title,
          size: sizeText,
          sizeBytes,
          seeds,
          leeches,
          category,
          url: `${RUTRACKER_FORUM}/viewtopic.php?t=${id}`,
          magnetLink,
        });
      } catch {
        // Skip malformed rows
      }
    });

    // Sort by seeds descending
    return torrents.sort((a, b) => b.seeds - a.seeds);
  }

  async getMagnetLink(torrentId: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${RUTRACKER_FORUM}/viewtopic.php?t=${torrentId}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Cookie: this.cookies.join("; "),
          },
        }
      );

      const html = await response.text();
      const $ = cheerio.load(html);

      // Find magnet link on the page
      const magnetLink = $('a[href^="magnet:"]').first().attr("href");
      return magnetLink || null;
    } catch (error) {
      console.error("RuTracker getMagnetLink error:", error);
      return null;
    }
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

// Extract info hash from magnet link
export function extractInfoHash(magnetLink: string): string | null {
  const match = magnetLink.match(/btih:([a-fA-F0-9]{40})/i);
  if (match) return match[1].toLowerCase();

  const base32Match = magnetLink.match(/btih:([A-Z2-7]{32})/i);
  if (base32Match) {
    // Convert base32 to hex
    try {
      return base32ToHex(base32Match[1]);
    } catch {
      return null;
    }
  }
  return null;
}

function base32ToHex(base32: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const char of base32.toUpperCase()) {
    const val = alphabet.indexOf(char);
    if (val === -1) throw new Error("Invalid base32");
    bits += val.toString(2).padStart(5, "0");
  }
  let hex = "";
  for (let i = 0; i + 4 <= bits.length; i += 4) {
    hex += parseInt(bits.substring(i, i + 4), 2).toString(16);
  }
  return hex;
}

// Singleton instance management
let clientInstance: RuTrackerClient | null = null;
let lastCredentials = "";

export async function getRuTrackerClient(
  username: string,
  password: string
): Promise<RuTrackerClient> {
  const credKey = `${username}:${password}`;
  if (clientInstance && lastCredentials === credKey) {
    return clientInstance;
  }

  const client = new RuTrackerClient();
  await client.login(username, password);
  clientInstance = client;
  lastCredentials = credKey;
  return client;
}
