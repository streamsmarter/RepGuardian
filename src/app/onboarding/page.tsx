'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserComponentClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserCircle } from 'lucide-react';

export default function OnboardingPage() {
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const supabase = createBrowserComponentClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Check if user already has an app_user record (already onboarded)
      const { data: appUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .single();
      
      if (appUser) {
        // Already onboarded, redirect to dashboard
        router.push('/app');
        return;
      }
      
      setIsCheckingAuth(false);
    };
    
    checkAuth();
  }, [supabase, router]);

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!companyName.trim()) {
      toast.error('Please enter your company name');
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      console.log('=== ONBOARDING DEBUG ===');
      console.log('User:', user?.id, user?.email);
      console.log('User error:', userError);
      
      if (!user) {
        toast.error('Please log in first');
        router.push('/login');
        return;
      }

      // Create the company first
      console.log('Creating company with:', { name: companyName.trim(), user_id: user.id });
      const { data: company, error: companyError } = await supabase
        .from('company')
        .insert({
          name: companyName.trim(),
          user_id: user.id,
          payment_plan: 'free',
          crm_type: 'vagaro',
        } as any)
        .select()
        .single();

      console.log('Company result:', company);
      console.log('Company error:', companyError);

      if (companyError) {
        console.error('Company creation error:', JSON.stringify(companyError, null, 2));
        throw new Error(companyError.message || 'Failed to create company');
      }

      if (!company) {
        throw new Error('Company was not created');
      }

      // Create the app_user record
      const appUserData = {
        user_id: user.id,
        company_id: (company as any).id,
        role: 'owner',
        name: fullName.trim(),
      };
      console.log('Creating app_user with:', appUserData);
      
      const { data: appUserResult, error: appUserError } = await supabase
        .from('app_user')
        .insert(appUserData as any)
        .select();

      console.log('App user result:', appUserResult);
      console.log('App user error:', appUserError);

      if (appUserError) {
        console.error('App user creation error:', JSON.stringify(appUserError, null, 2));
        // Try to clean up the company if app_user creation fails
        await supabase.from('company').delete().eq('id', (company as any).id);
        throw new Error(appUserError.message || appUserError.code || 'Failed to create user profile. Check RLS policies for app_user table.');
      }

      console.log('=== ONBOARDING SUCCESS ===');
      toast.success('Welcome to RepGuardian!');
      router.push('/app');
      router.refresh();
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error(error.message || 'Failed to complete setup');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <UserCircle className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Complete your profile</CardTitle>
          <CardDescription>
            Tell us a bit about yourself and your company
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleOnboarding}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium leading-none">
                Your Name
              </label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isLoading}
                className="w-full"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="companyName" className="text-sm font-medium leading-none">
                Company Name
              </label>
              <Input
                id="companyName"
                type="text"
                placeholder="Acme Inc."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                disabled={isLoading}
                className="w-full"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Get Started'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
