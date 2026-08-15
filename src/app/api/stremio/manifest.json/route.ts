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

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  return NextResponse.json(getManifest(baseUrl), { headers: corsHeaders() });
}
