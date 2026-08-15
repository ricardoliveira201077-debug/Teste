import { NextRequest, NextResponse } from "next/server";
import { manifest, baseUrl } from "@/lib/manifest";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Content-Type": "application/json" };

export const OPTIONS = () => new NextResponse(null, { status: 204, headers: CORS });

export function GET(req: NextRequest) {
  return NextResponse.json(manifest(baseUrl(req)), { headers: CORS });
}
