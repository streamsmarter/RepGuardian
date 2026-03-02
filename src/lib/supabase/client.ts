import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../types/database.types';
import { getSupabaseAnonKey, getSupabaseUrl } from '../env';

export const createBrowserComponentClient = () => {
  return createBrowserClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey()
  );
};
