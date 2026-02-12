import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[send-message] Received body:", body);

    if (!body) {
      return NextResponse.json({ error: "Missing body" }, { status: 400 });
    }

    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    console.log("[send-message] N8N_WEBHOOK_URL:", n8nUrl ? "set" : "NOT SET");
    
    if (!n8nUrl) {
      return NextResponse.json({ error: "N8N_WEBHOOK_URL not set" }, { status: 500 });
    }

    console.log("[send-message] Calling webhook...");
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
    console.log("[send-message] Response status:", r.status);
    console.log("[send-message] Response body:", text);

    if (!r.ok) {
      console.log("[send-message] Request failed with status:", r.status);
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
  } catch (err: any) {
    return NextResponse.json(
      { error: "Proxy error", message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
