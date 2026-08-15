import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/manifest";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Content-Type": "application/json",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

// GET /api/stremio/configure → redirect to the configuration page
export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  return NextResponse.redirect(`${baseUrl}/`, { status: 302 });
}

// POST /api/stremio/configure → generate config
export async function POST(request: NextRequest) {
  const headers = corsHeaders();

  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400, headers }
      );
    }

    const config = Buffer.from(
      JSON.stringify({ username, password })
    ).toString("base64");

    const baseUrl = getBaseUrl(request);

    return NextResponse.json(
      {
        config,
        manifestUrl: `${baseUrl}/api/stremio/${config}/manifest.json`,
        installUrl: `stremio://${request.headers.get("host") || "localhost:3000"}/api/stremio/${config}/manifest.json`,
      },
      { headers }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400, headers }
    );
  }
}
