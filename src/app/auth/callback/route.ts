import { createServerComponentClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createServerComponentClient();
    await supabase.auth.exchangeCodeForSession(code);
    
    // Check if user has completed onboarding (has an app_user record)
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .single();
      
      // If no app_user record, redirect to onboarding
      if (!appUser) {
        return NextResponse.redirect(new URL('/onboarding', requestUrl.origin));
      }
    }
  }

  return NextResponse.redirect(new URL('/app', requestUrl.origin));
}
