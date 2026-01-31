'use client';

import { useState, useEffect } from 'react';
import { createBrowserComponentClient } from '@/lib/supabase/client';

export default function TestConnection() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  
  useEffect(() => {
    const testConnection = async () => {
      try {
        const supabase = createBrowserComponentClient();
        
        // Test connection by getting session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setStatus('error');
          setMessage(`Auth error: ${error.message}`);
          return;
        }
        
        // Try to query the company table
        const { data: companyData, error: companyError } = await supabase
          .from('company')
          .select('*')
          .limit(5);
        
        if (companyError) {
          setStatus('error');
          setMessage(`Database error: ${companyError.message}`);
          return;
        }
        
        setCompanies(companyData || []);
        setStatus('success');
        setMessage('Successfully connected to Supabase');
      } catch (error: any) {
        setStatus('error');
        setMessage(`Unexpected error: ${error.message}`);
      }
    };
    
    testConnection();
  }, []);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      <div className="mb-4">
        <div className="font-semibold">Status:</div>
        <div className={
          status === 'loading' ? 'text-blue-500' :
          status === 'success' ? 'text-green-500' : 'text-red-500'
        }>
          {status.toUpperCase()}
        </div>
      </div>
      
      <div className="mb-4">
        <div className="font-semibold">Message:</div>
        <div>{message}</div>
      </div>
      
      {status === 'success' && (
        <div>
          <div className="font-semibold mb-2">Companies found:</div>
          {companies.length === 0 ? (
            <div>No companies found</div>
          ) : (
            <ul className="list-disc pl-5">
              {companies.map((company) => (
                <li key={company.id}>
                  {company.name} (ID: {company.id})
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Environment Variables:</h2>
        <div>
          <div className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Not set'}</div>
          <div className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Not set'}</div>
        </div>
      </div>
    </div>
  );
}
