import { createServerComponentClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createServerComponentClient();
    
    // Get user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      return NextResponse.json({ success: false, error: userError.message }, { status: 500 });
    }
    
    const user = userData.user;
    
    // Get company for this user
    const { data: company } = await supabase
      .from('company')
      .select('*')
      .eq('user_id', user?.id)
      .single();
    
    // Get all chats (no filter) to see what exists
    const { data: allChats, error: allChatsError } = await supabase
      .from('chat')
      .select('id, company_id, client_name, created_at')
      .limit(10);
    
    // Get chats for this company
    const { data: companyChats, error: companyChatsError } = await supabase
      .from('chat')
      .select('id, company_id, client_name, created_at')
      .eq('company_id', company?.id)
      .limit(10);
    
    // Get all messages to see what exists
    const { data: allMessages, error: allMessagesError } = await supabase
      .from('messages')
      .select('id, session_id, role, message, created_at')
      .limit(10);
    
    return NextResponse.json({ 
      success: true,
      user: { id: user?.id, email: user?.email },
      company: company ? { id: company.id, name: company.name } : null,
      allChats: { data: allChats, error: allChatsError?.message },
      companyChats: { data: companyChats, error: companyChatsError?.message },
      allMessages: { data: allMessages, error: allMessagesError?.message }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
