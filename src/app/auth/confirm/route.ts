import { createServerComponentClient } from '@/lib/supabase/server';
import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/command-center';

  if (token_hash && type) {
    const supabase = await createServerComponentClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Redirect to the appropriate page based on type
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/reset-password', origin));
      }
      return NextResponse.redirect(new URL(next, origin));
    }

    // If there's an error, redirect to an error page or login with error message
    console.error('OTP verification error:', error.message);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, origin)
    );
  }

  // If no token_hash or type, redirect to home
  return NextResponse.redirect(new URL('/', origin));
}
