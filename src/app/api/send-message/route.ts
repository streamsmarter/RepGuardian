import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body) {
      return NextResponse.json({ error: "Missing body" }, { status: 400 });
    }

    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    
    if (!n8nUrl) {
      return NextResponse.json({ error: "N8N_WEBHOOK_URL not set" }, { status: 500 });
    }

    const r = await fetch(n8nUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { "x-webhook-secret": process.env.N8N_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await r.text();

    if (!r.ok) {
      return NextResponse.json(
        { error: "n8n request failed", status: r.status, body: text },
        { status: 502 }
      );
    }

    try {
      return NextResponse.json(JSON.parse(text));
    } catch {
      return new NextResponse(text, { status: 200 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Proxy error", message },
      { status: 500 }
    );
  }
}
