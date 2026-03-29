import { NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const REVIEW_REPLY_WEBHOOK_URL =
  process.env.REVIEW_REPLY_WEBHOOK_URL ??
  "https://apex-art.app.n8n.cloud/webhook/review_reply";

type ReviewReplyType = "ai" | "human";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

    const reviewId = typeof body.review_id === "string" ? body.review_id.trim() : "";
    const companyId = typeof body.company_id === "string" ? body.company_id.trim() : "";
    const replyText = typeof body.reply_text === "string" ? body.reply_text : "";
    const reviewType = body.review_type === "ai" || body.review_type === "human"
      ? (body.review_type as ReviewReplyType)
      : null;

    if (!reviewId) {
      return NextResponse.json({ error: "review_id is required" }, { status: 400 });
    }

    if (!companyId) {
      return NextResponse.json({ error: "company_id is required" }, { status: 400 });
    }

    if (!reviewType) {
      return NextResponse.json({ error: "review_type must be ai or human" }, { status: 400 });
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

    let authorizedCompanyId = (ownedCompany as { id: string } | null)?.id ?? null;

    if (!authorizedCompanyId) {
      const { data: appUser } = await supabase
        .from("app_user")
        .select("company_id")
        .eq("user_id", user.id)
        .maybeSingle();

      authorizedCompanyId = (appUser as { company_id: string } | null)?.company_id ?? null;
    }

    if (!authorizedCompanyId || authorizedCompanyId !== companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: review, error: reviewError } = await supabase
      .from("review")
      .select("id")
      .eq("id", reviewId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (reviewError) {
      return NextResponse.json({ error: "Failed to validate review" }, { status: 500 });
    }

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const response = await fetch(REVIEW_REPLY_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reply_text: replyText,
        review_id: reviewId,
        company_id: companyId,
        review_type: reviewType,
      }),
      cache: "no-store",
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        { error: "review reply webhook failed", status: response.status, body: text },
        { status: 502 }
      );
    }

    try {
      return NextResponse.json(JSON.parse(text));
    } catch {
      return NextResponse.json({ reply_text: text });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Proxy error", message }, { status: 500 });
  }
}
