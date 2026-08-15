import { NextRequest, NextResponse } from "next/server";
import { baseUrl } from "@/lib/manifest";
export function GET(req: NextRequest) {
  return NextResponse.redirect(`${baseUrl(req)}/`, 302);
}
