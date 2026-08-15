import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/manifest";

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  return NextResponse.redirect(`${baseUrl}/`, { status: 302 });
}
