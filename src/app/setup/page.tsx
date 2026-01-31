'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserComponentClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function SetupPage() {
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const supabase = createBrowserComponentClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      
      // Check if user already has a company
      const { data: company } = await supabase
        .from('company')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1)
        .single();
      
      if (company) {
        router.push('/app');
        return;
      }
      
      setIsCheckingAuth(false);
    };
    
    checkAuth();
  }, [supabase, router]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      toast.error('Please enter a company name');
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please log in first');
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('company')
        .insert({
          name: companyName.trim(),
          user_id: session.user.id,
          payment_plan: 'free',
          crm_type: 'vagaro',
        } as any)
        .select()
        .single();

      if (error) {
        console.error('Full error:', JSON.stringify(error, null, 2));
        throw new Error(error.message || error.code || 'Failed to create company. Please check RLS policies in Supabase.');
      }

      if (!data) {
        throw new Error('Company was not created. Please check RLS policies in Supabase.');
      }

      toast.success('Company created successfully!');
      router.push('/app');
      router.refresh();
    } catch (error: any) {
      console.error('Setup error:', error);
      toast.error(error.message || 'Failed to create company');
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
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Welcome to RepGuardian</CardTitle>
          <CardDescription>Let's set up your company to get started</CardDescription>
        </CardHeader>
        <form onSubmit={handleSetup}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="companyName" className="text-sm font-medium leading-none">
                Company Name
              </label>
              <Input
                id="companyName"
                type="text"
                placeholder="Your Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                disabled={isLoading}
                className="w-full"
                autoFocus
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating company...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
