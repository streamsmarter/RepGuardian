'use client';

import { useState, useEffect } from 'react';
import { createBrowserComponentClient } from '@/lib/supabase/client';

export default function SupaTest() {
  const [status, setStatus] = useState('Loading...');
  const [error, setError] = useState('');
  const [envVars, setEnvVars] = useState({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set'
  });
  
  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createBrowserComponentClient();
        
        // Test connection
        const { data, error } = await supabase.from('company').select('count');
        
        if (error) {
          setStatus('Error');
          setError(error.message);
        } else {
          setStatus('Connected!');
        }
      } catch (err: any) {
        setStatus('Error');
        setError(err.message);
      }
    }
    
    testConnection();
  }, []);
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Supabase Connection Test</h1>
      <div>
        <strong>Status:</strong> {status}
      </div>
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      <div style={{ marginTop: '20px' }}>
        <strong>Environment Variables:</strong>
        <pre>
          NEXT_PUBLIC_SUPABASE_URL: {envVars.url}<br />
          NEXT_PUBLIC_SUPABASE_ANON_KEY: {envVars.key}
        </pre>
      </div>
    </div>
  );
}
