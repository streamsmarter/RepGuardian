import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const ENV_PATH = '.env.local';
const force = process.argv.includes('--force');

const template = [
  'NEXT_PUBLIC_SUPABASE_URL=',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY=',
  'N8N_WEBHOOK_URL=',
  'N8N_WEBHOOK_SECRET=',
].join('\n');

if (existsSync(ENV_PATH) && !force) {
  const current = readFileSync(ENV_PATH, 'utf8');
  const hasSupabaseValues =
    /NEXT_PUBLIC_SUPABASE_URL\s*=\s*\S+/m.test(current) &&
    /NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*\S+/m.test(current);

  if (hasSupabaseValues) {
    console.log('Skipped: .env.local already has Supabase values. Use --force only if you want to overwrite it.');
    process.exit(0);
  }

  console.log('Skipped: .env.local already exists. Use --force to overwrite it.');
  process.exit(0);
}

writeFileSync(ENV_PATH, `${template}\n`);
console.log('Created .env.local template with empty values. Fill in your real credentials before running the app.');
