import { NextRequest, NextResponse } from "next/server";
import { manifest, baseUrl } from "@/lib/manifest";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Content-Type": "application/json" };
export const OPTIONS = () => new NextResponse(null, { status: 204, headers: CORS });

export async function GET(req: NextRequest, { params }: { params: Promise<{ config: string }> }) {
  await params;
  const m = manifest(baseUrl(req));
  m.behaviorHints = { configurable: true };          // configured → not required
  return NextResponse.json(m, { headers: CORS });
}
