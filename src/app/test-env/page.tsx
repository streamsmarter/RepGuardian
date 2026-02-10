'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';

export default function TestEnvPage() {
  const [envVars, setEnvVars] = useState({
    url: 'Checking...',
    key: 'Checking...'
  });
  
  useEffect(() => {
    // Access environment variables directly
    setEnvVars({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (hidden for security)' : 'Not set'
    });
  }, []);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Environment Variables:</h2>
        <div>
          <div className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_URL: {envVars.url}</div>
          <div className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY: {envVars.key}</div>
        </div>
      </div>
      
      <div className="mt-4">
        <p>If the environment variables are showing as "Not set", please make sure:</p>
        <ol className="list-decimal pl-5 mt-2">
          <li>Your .env.local file exists in the project root</li>
          <li>The file contains the correct variables without any typos</li>
          <li>The development server was restarted after creating/updating the .env.local file</li>
        </ol>
      </div>
    </div>
  );
}
