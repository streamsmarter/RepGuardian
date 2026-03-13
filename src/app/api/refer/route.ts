import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const WEBHOOK_URL = 'https://apex-art.app.n8n.cloud/webhook/ref_receiver';

// E.164 format: + followed by 10-15 digits
const E164_REGEX = /^\+[1-9]\d{9,14}$/;

// Sanitize and validate phone number in E.164 format
function validateE164(phone: string): string | null {
  // Must be a string
  if (typeof phone !== 'string') return null;
  
  // Remove any whitespace
  const cleaned = phone.trim();
  
  // Validate E.164 format
  if (!E164_REGEX.test(cleaned)) return null;
  
  return cleaned;
}

// Sanitize refcode - only allow alphanumeric, dashes, underscores
function sanitizeRefcode(refcode: string): string | null {
  if (typeof refcode !== 'string') return null;
  const cleaned = refcode.trim();
  if (!/^[a-zA-Z0-9_-]+$/.test(cleaned)) return null;
  if (cleaned.length > 100) return null;
  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone_number, refcode } = body;

    // Validate and sanitize phone number (must be E.164 format)
    const validatedPhone = validateE164(phone_number);
    if (!validatedPhone) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Validate and sanitize refcode
    const validatedRefcode = sanitizeRefcode(refcode);
    if (!validatedRefcode) {
      return NextResponse.json(
        { error: 'Invalid refcode format' },
        { status: 400 }
      );
    }

    const supabase = await createServerComponentClient();

    // Look up the link by refcode using RPC function (bypasses RLS)
    const { data: rpcData, error: rpcError } = await (supabase
      .rpc as any)('get_link_by_refcode', { ref_code: validatedRefcode });

    if (rpcError) {
      console.error('Error fetching link:', rpcError);
      return NextResponse.json(
        { error: 'Failed to validate refcode' },
        { status: 500 }
      );
    }

    const result = rpcData?.[0] as { company_id: string; booking_link: string } | undefined;

    if (!result?.company_id) {
      return NextResponse.json(
        { error: 'Invalid refcode' },
        { status: 404 }
      );
    }

    const bookingLink = result.booking_link;

    if (!bookingLink) {
      return NextResponse.json(
        { error: 'No booking link configured for this company' },
        { status: 404 }
      );
    }

    // Send data to webhook (fire and forget, don't block the response)
    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: validatedPhone,
        refcode: validatedRefcode,
      }),
    }).catch((err) => {
      console.error('Webhook error:', err);
    });

    return NextResponse.json({
      success: true,
      booking_link: bookingLink,
    });
  } catch (error: unknown) {
    console.error('Refer API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
