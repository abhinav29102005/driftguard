import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/results`, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: "Backend returned error" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Backend unavailable";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
