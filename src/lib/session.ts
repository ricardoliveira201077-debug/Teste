import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import type { BrowserContext } from "playwright-core";

const SESSION_FILE =
  process.env.RUTRACKER_SESSION_FILE ||
  path.join(os.homedir(), ".rutracker-addon", "session.json");

export interface SessionCookie {
  name: string;
  value: string;
  domain: string;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
}

export function loadSession(): SessionCookie[] {
  try {
    if (!fs.existsSync(SESSION_FILE)) return [];
    const raw = JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"));
    return Array.isArray(raw) ? raw : [];
  } catch (e) {
    console.error("loadSession error:", e);
    return [];
  }
}

export function saveSession(cookies: SessionCookie[]): void {
  try {
    fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });
    fs.writeFileSync(SESSION_FILE, JSON.stringify(cookies, null, 2));
  } catch (e) {
    console.error("saveSession error:", e);
  }
}

/** Injeta as cookies de sessão guardadas num contexto. */
export async function injectSession(ctx: BrowserContext): Promise<void> {
  const cookies = loadSession();
  if (!cookies.length) return;
  await ctx.addCookies(
    cookies.map((c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path ?? "/",
      httpOnly: c.httpOnly ?? false,
      secure: c.secure ?? true,
      sameSite: "Lax" as const,
    }))
  );
}

/** Verdadeiro se existir uma sessão guardada com bb_session/bb_data. */
export function hasSession(): boolean {
  return loadSession().some(
    (c) => c.name === "bb_session" || c.name === "bb_data"
  );
}