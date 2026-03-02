const missingEnvMessage = (name: string, fallbackName: string) =>
  `Missing Supabase environment variable: expected ${name} (or fallback ${fallbackName}).`;

export function getSupabaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

  if (!value) {
    throw new Error(missingEnvMessage('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'));
  }

  return value;
}

export function getSupabaseAnonKey(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!value) {
    throw new Error(missingEnvMessage('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY'));
  }

  return value;
}
