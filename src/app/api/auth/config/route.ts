import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    googleConfigured: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  });
}
