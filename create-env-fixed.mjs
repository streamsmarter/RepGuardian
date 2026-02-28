import { writeFileSync } from 'node:fs';

const envContent = `NEXT_PUBLIC_SUPABASE_URL=your_supabase_url\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`;

writeFileSync('.env.local', envContent);
console.log('Created .env.local file template with expected formatting.');
