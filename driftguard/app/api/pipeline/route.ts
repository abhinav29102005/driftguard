import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const res = await fetch(`${BACKEND_URL}/run-pipeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Backend unavailable";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
