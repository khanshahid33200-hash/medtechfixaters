import { createServerClient, type CookieOptions } from "@supabase/ssr";

const supabaseUrl = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) || "";
const supabaseKey = (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY)) || "";

export const createClient = (request: any, responseObj?: any) => {
  let supabaseResponse = responseObj || {
    headers: new Headers(),
    cookies: {
      set: () => {},
    }
  };

  const supabase = createServerClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder-key',
    {
      cookies: {
        getAll() {
          return request?.cookies?.getAll ? request.cookies.getAll() : []
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (request?.cookies?.set) {
              request.cookies.set(name, value)
            }
            if (supabaseResponse?.cookies?.set) {
              supabaseResponse.cookies.set(name, value, options)
            }
          })
        },
      },
    },
  );

  return { supabase, response: supabaseResponse }
};
