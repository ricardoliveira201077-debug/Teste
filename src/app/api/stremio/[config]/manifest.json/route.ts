import { NextRequest, NextResponse } from "next/server";
import { getManifest } from "@/lib/manifest";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ config: string }> }
) {
  const { config } = await params;
  void config; // config is present but we just return manifest

  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || "localhost:3000";
  const baseUrl = `${proto}://${host}`;
  
  const manifest = getManifest(baseUrl);
  manifest.behaviorHints = { configurable: true };
  return NextResponse.json(manifest, { headers: corsHeaders() });
}
