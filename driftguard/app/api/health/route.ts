import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      return NextResponse.json({ status: "error", backend: false });
    }
    const data = await res.json();
    return NextResponse.json({ status: "ok", backend: true, ...data });
  } catch {
    return NextResponse.json({ status: "ok", backend: false });
  }
}
