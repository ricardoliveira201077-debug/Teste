import { firefox, type BrowserContext, type Page } from "playwright-core";
import * as os from "os";
import * as path from "path";
import { injectSession, loadSession, saveSession } from "./session";

export const RUTRACKER_BASE =
  process.env.RUTRACKER_BASE || "https://rutracker.org/forum";

// Perfil persistente do Firefox: cookies (incl. cf_clearance e sessão) ficam
// gravados em disco entre reinícios do servidor.
const PROFILE_DIR =
  process.env.RUTRACKER_PROFILE_DIR ||
  path.join(os.homedir(), ".rutracker-addon", "ff-profile");

const g = globalThis as typeof globalThis & {
  __rtCtx?: BrowserContext;
  __rtCtxPromise?: Promise<BrowserContext>;
};

let loggedIn = false;
let loginExpiry = 0;
const SESSION_TTL = 25 * 60 * 1000;

async function launchContext(): Promise<BrowserContext> {
  const ctx = await firefox.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1280, height: 800 },
    locale: "ru-RU",
  });
  await injectSession(ctx).catch(() => {});
  return ctx;
}

export async function getContext(): Promise<BrowserContext> {
  if (g.__rtCtx) {
    const b = g.__rtCtx.browser();
    if (b && b.isConnected()) return g.__rtCtx;
    // contexto/browser fechado (ex.: utilizador fechou a janela) — recomeçar
    g.__rtCtx = undefined;
    g.__rtCtxPromise = undefined;
  }
  if (g.__rtCtxPromise) {
    try {
      return await g.__rtCtxPromise;
    } catch {
      g.__rtCtxPromise = undefined;
    }
  }
  g.__rtCtxPromise = launchContext().then((ctx) => {
    g.__rtCtx = ctx;
    return ctx;
  });
  return g.__rtCtxPromise;
}

/**
 * Reinjeta as cookies de sessão guardadas (a persistência do perfil não
 * mantém cookies adicionadas por addCookies, por isso fazemos a cada pedido).
 */
async function ensureSession(ctx: BrowserContext): Promise<void> {
  const session = loadSession();
  if (!session.length) return;
  await injectSession(ctx);
}

async function challenged(page: Page): Promise<boolean> {
  try {
    return await page.evaluate(() => {
      const t = document.title;
      return (
        /just a moment|один момент/i.test(t) ||
        (document.body?.innerText ?? "").includes("Один момент") ||
        document.querySelector("#cf-chl-widget") !== null
      );
    });
  } catch {
    return false;
  }
}

/**
 * Espera o desafio Cloudflare resolver (auto no browser real; se necessário o
 * utilizador clica no Turnstile na janela visível). Devolve true quando pronto.
 */
async function waitReady(page: Page, timeoutMs: number): Promise<boolean> {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (!(await challenged(page))) return true;
    await page.waitForTimeout(1500);
  }
  return !(await challenged(page));
}

/**
 * Abre um URL no Firefox persistente e devolve o HTML final (após resolver
 * desafio Cloudflare). Se o browser tiver sido fechado, relança e tenta de novo.
 */
async function openOnce(
  url: string,
  challengeTimeoutMs: number
): Promise<string | null> {
  const ctx = await getContext();
  await ensureSession(ctx);
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    const ok = await waitReady(page, challengeTimeoutMs);
    return ok ? await page.content() : null;
  } finally {
    await page.close().catch(() => {});
  }
}

export async function open(
  url: string,
  challengeTimeoutMs = 90_000
): Promise<string | null> {
  try {
    return await openOnce(url, challengeTimeoutMs);
  } catch (e) {
    if (/closed|disconnected/i.test(String((e as Error)?.message ?? e))) {
      console.error("browser fechado — a relançar...");
      g.__rtCtx = undefined;
      g.__rtCtxPromise = undefined;
      try {
        return await openOnce(url, challengeTimeoutMs);
      } catch (e2) {
        console.error("browser open error (retry):", e2);
        return null;
      }
    }
    console.error("browser open error:", e);
    return null;
  }
}

/**
 * Guarda as cookies de sessão (ex.: coladas pelo utilizador) no ficheiro.
 */
export async function setSessionCookies(
  cookies: { name: string; value: string; domain: string; path?: string }[]
): Promise<boolean> {
  if (!cookies.length) return false;
  saveSession(cookies);
  const ctx = await getContext();
  await injectSession(ctx);
  return true;
}

export function currentSessionCookies() {
  return loadSession();
}

/**
 * Lê as cookies atuais do perfil (após login manual na janela do Firefox) e
 * grava-as no ficheiro de sessão. Devolve true se existir sessão (bb_session).
 */
export async function refreshSession(): Promise<boolean> {
  const ctx = await getContext();
  try {
    // navega uma página para garantir cookies/sessão atualizadas
    const page = await ctx.newPage();
    await page
      .goto(`${RUTRACKER_BASE}/index.php`, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      })
      .catch(() => {});
    await waitReady(page, 30_000).catch(() => {});
    await page.close().catch(() => {});

    const cookies = await ctx.cookies(`https://${new URL(RUTRACKER_BASE).host}`);
    saveSession(
      cookies.map((c) => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
        httpOnly: c.httpOnly,
        secure: c.secure,
      }))
    );
    const ok = cookies.some(
      (c) => c.name === "bb_session" || c.name === "bb_data"
    );
    if (ok) {
      loggedIn = true;
      loginExpiry = Date.now() + SESSION_TTL;
    }
    return ok;
  } catch (e) {
    console.error("refreshSession error:", e);
    return false;
  }
}

/**
 * Faz login no RuTracker via formulário real (cookies persistem no perfil).
 */
export async function login(
  username: string,
  password: string
): Promise<boolean> {
  if (loggedIn && Date.now() < loginExpiry) return true;
  if (loadSession().some((c) => c.name === "bb_session" || c.name === "bb_data")) {
    loggedIn = true;
    loginExpiry = Date.now() + SESSION_TTL;
    return true;
  }

  const ctx = await getContext();
  const page = await ctx.newPage();
  try {
    await page.goto(`${RUTRACKER_BASE}/login.php`, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });
    if (!(await waitReady(page, 60_000))) {
      console.error("login: Cloudflare challenge unresolved");
      return false;
    }

    // já autenticado no perfil?
    const cookies = await ctx.cookies(RUTRACKER_BASE);
    const hasSession =
      cookies.some((c) => c.name === "bb_session") ||
      cookies.some((c) => c.name === "bb_data");

    if (hasSession) {
      loggedIn = true;
      loginExpiry = Date.now() + SESSION_TTL;
      return true;
    }

    const u = page.locator('input[name="login_username"]');
    if (!(await u.count())) {
      console.error("login: form não encontrado");
      return false;
    }
    await u.fill(username);
    await page
      .locator('input[name="login_password"]')
      .fill(password);
    await page.locator('input[type="submit"]').first().click();
    await page
      .waitForLoadState("domcontentloaded", { timeout: 45_000 })
      .catch(() => {});
    await waitReady(page, 60_000);

    const cookies2 = await ctx.cookies(RUTRACKER_BASE);
    loggedIn =
      cookies2.some((c) => c.name === "bb_session") ||
      cookies2.some((c) => c.name === "bb_data") ||
      !(await page.content()).includes("login_username");
    loginExpiry = Date.now() + SESSION_TTL;
    return loggedIn;
  } catch (e) {
    console.error("login error:", e);
    return false;
  } finally {
    await page.close().catch(() => {});
  }
}

export function isLoggedIn(): boolean {
  return loggedIn && Date.now() < loginExpiry;
}

/**
 * Abre a página de login do RuTracker numa janela do Firefox do perfil,
 * mantendo-a aberta para o utilizador entrar manualmente (cookies persistem).
 */
export async function openLoginPage(): Promise<boolean> {
  const ctx = await getContext();
  try {
    const page = await ctx.newPage();
    await page.goto(`${RUTRACKER_BASE}/login.php`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    // desafio Cloudflare: resolver automaticamente ou deixar o utilizador clicar
    waitReady(page, 30_000).catch(() => {});
    return true;
  } catch (e) {
    console.error("openLoginPage error:", e);
    return false;
  }
}

export async function checkRuTracker(): Promise<{
  ok: boolean;
  challenged: boolean;
  loggedIn: boolean;
}> {
  try {
    const ctx = await getContext();
    const page = await ctx.newPage();
    try {
      await page.goto(`${RUTRACKER_BASE}/index.php`, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      const still = await waitReady(page, 10_000);
      const html = await page.content();
      const hasSessionFile = loadSession().some(
        (c) => c.name === "bb_session" || c.name === "bb_data"
      );
      return {
        ok: still && html.length > 0,
        challenged: !still,
        loggedIn: isLoggedIn() || hasSessionFile,
      };
    } finally {
      await page.close().catch(() => {});
    }
  } catch (e) {
    console.error("checkRuTracker error:", e);
    return { ok: false, challenged: false, loggedIn: isLoggedIn() };
  }
}