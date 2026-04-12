import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/** Create a Supabase client with the service role key (full access, bypasses RLS) */
export function createServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

/** Create a Supabase client with the user's JWT (respects RLS) */
export function createUserClient(authHeader: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: { headers: { Authorization: authHeader } },
    },
  );
}

/** Extract user ID from a Supabase client */
export async function getUserId(authHeader: string): Promise<string | null> {
  const client = createUserClient(authHeader);
  const { data: { user } } = await client.auth.getUser();
  return user?.id ?? null;
}
