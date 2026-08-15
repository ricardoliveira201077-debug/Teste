import { NextRequest, NextResponse } from "next/server";
import { openLoginPage, refreshSession } from "@/lib/browser";

const CORS = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

export async function GET(req: NextRequest) {
  const action = new URL(req.url).searchParams.get("action");
  if (action === "refresh") {
    const ok = await refreshSession();
    return NextResponse.json({ ok, loggedIn: ok }, { headers: CORS });
  }
  const ok = await openLoginPage();
  return NextResponse.json({ ok }, { headers: CORS });
}
export const OPTIONS = () => new NextResponse(null, { status: 204, headers: CORS });