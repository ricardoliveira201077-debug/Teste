import { NextRequest, NextResponse } from "next/server";
import { baseUrl } from "@/lib/manifest";

// GET /api/stremio/configure → redirect to homepage
export function GET(req: NextRequest) {
  return NextResponse.redirect(`${baseUrl(req)}/`, 302);
}
