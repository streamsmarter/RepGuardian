import { createServerComponentClient } from './supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Database } from './types/database.types';
import { User } from '@supabase/supabase-js';

type Company = Database['public']['Tables']['company']['Row'];
type AppUser = Database['public']['Tables']['app_user']['Row'] & { company: Company };

export type CompanyContextType = {
  user: User;
  company_id: string;
  company: Company;
  role: string;
};

export async function getCompanyContext(): Promise<CompanyContextType> {
  const supabase = await createServerComponentClient();
  
  // Check if user is authenticated (use getUser() for secure server-side validation)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    redirect('/login');
  }
  
  // Primary mapping: company.user_id = auth.user.id
  const { data: companyData, error: companyError } = await supabase
    .from('company')
    .select('*')
    .eq('user_id', user.id)
    .limit(1)
    .single();
  
  if (companyData) {
    return {
      user,
      company_id: (companyData as any).id as string,
      company: companyData as Company,
      role: 'owner'
    };
  }
  
  // Secondary mapping: app_user.user_id = auth.user.id -> company_id
  const { data: appUserData, error: appUserError } = await supabase
    .from('app_user')
    .select('*, company:company(*)')
    .eq('user_id', user.id)
    .limit(1)
    .single();
  
  if (appUserData) {
    const userData = appUserData as unknown as AppUser;
    return {
      user,
      company_id: userData.company_id,
      company: userData.company,
      role: userData.role
    };
  }
  
  // No company found, redirect to onboarding
  redirect('/onboarding');
}

// Get all companies for the current user (for company switcher)
export async function getUserCompanies() {
  const supabase = await createServerComponentClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return [];
  }
  
  // Get owned company
  const { data: ownedCompany } = await supabase
    .from('company')
    .select('*')
    .eq('user_id', user.id);
  
  // Get companies where user is a member
  const { data: memberCompanies } = await supabase
    .from('app_user')
    .select('*, company:company(*)')
    .eq('user_id', user.id);
  
  const companies = [
    ...((ownedCompany || []) as Company[]).map(company => ({
      ...company,
      role: 'owner'
    })),
    ...((memberCompanies || []) as unknown as AppUser[]).map(appUser => ({
      ...appUser.company,
      role: appUser.role
    }))
  ];
  
  return companies;
}

// Set active company in cookie
export async function setActiveCompany(companyId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: 'active_company_id',
    value: companyId,
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

// Get active company from cookie
export async function getActiveCompanyFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('active_company_id')?.value;
}
