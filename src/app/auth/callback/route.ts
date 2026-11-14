import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next') || '/owner';
  // Strictly enforce safe internal redirect path (no protocol, no double slashes)
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/owner';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Ensure profile exists for this authenticated user
      const { user } = data;
      const { data: existingProfile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (profileFetchError) {
        console.error('Failed to query user profile in auth callback:', profileFetchError.message);
        return NextResponse.redirect(`${origin}/login?error=profile_fetch_failed`);
      }

      if (!existingProfile) {
        const { error: profileInsertError } = await supabase.from('profiles').insert({
          auth_user_id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Restaurant Owner',
          phone: user.phone || null,
          role: 'restaurant_owner',
        });

        if (profileInsertError) {
          console.error('Failed to create user profile in auth callback:', profileInsertError.message);
          return NextResponse.redirect(`${origin}/login?error=profile_creation_failed`);
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Auth error return to login
  return NextResponse.redirect(`${origin}/login?error=auth_exchange_failed`);
}

