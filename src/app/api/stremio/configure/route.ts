import { NextRequest, NextResponse } from "next/server";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

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

    // Encode config
    const config = Buffer.from(
      JSON.stringify({ username, password })
    ).toString("base64");

    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host") || "localhost:3000";
    const baseUrl = `${proto}://${host}`;

    return NextResponse.json(
      {
        config,
        manifestUrl: `${baseUrl}/api/stremio/${config}/manifest.json`,
        installUrl: `stremio://${host}/api/stremio/${config}/manifest.json`,
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
