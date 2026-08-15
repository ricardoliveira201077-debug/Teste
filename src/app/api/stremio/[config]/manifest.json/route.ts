import { NextRequest, NextResponse } from "next/server";
import { getManifest, getBaseUrl } from "@/lib/manifest";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "*",
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
  await params;
  const baseUrl = getBaseUrl(request);

  const manifest = getManifest(baseUrl);
  // When configured, remove configurationRequired
  manifest.behaviorHints = { configurable: true };
  return NextResponse.json(manifest, { headers: corsHeaders() });
}
