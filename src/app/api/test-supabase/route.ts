import { createServerComponentClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createServerComponentClient();
    
    // Test connection by getting session
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // Try to query the company table
    const { data: companies, error: companyError } = await supabase
      .from('company')
      .select('*')
      .limit(5);
    
    if (companyError) {
      return NextResponse.json({ success: false, error: companyError.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Successfully connected to Supabase',
      session: data,
      companies: companies
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
