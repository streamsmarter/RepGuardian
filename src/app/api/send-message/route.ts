import { NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Missing body" }, { status: 400 });
    }

    const { chat_id, message, ...rest } = body as Record<string, unknown>;

    if (typeof chat_id !== "string" || chat_id.trim().length === 0) {
      return NextResponse.json({ error: "chat_id is required" }, { status: 400 });
    }

    if (typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const supabase = await createServerComponentClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: ownedCompany } = await supabase
      .from("company")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    let companyId = ownedCompany?.id ?? null;

    if (!companyId) {
      const { data: appUser } = await supabase
        .from("app_user")
        .select("company_id")
        .eq("user_id", user.id)
        .maybeSingle();

      companyId = appUser?.company_id ?? null;
    }

    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 403 });
    }

    const { data: chat, error: chatError } = await supabase
      .from("chat")
      .select("id")
      .eq("id", chat_id.trim())
      .eq("company_id", companyId)
      .maybeSingle();

    if (chatError) {
      return NextResponse.json({ error: "Failed to validate chat" }, { status: 500 });
    }

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
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
      body: JSON.stringify({
        ...rest,
        chat_id: chat_id.trim(),
        message: message.trim(),
      }),
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
