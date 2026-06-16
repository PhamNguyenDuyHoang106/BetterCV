import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/dashboard";

    // Reconstruct the proper public origin using headers to prevent redirecting to http or internal container names
    const host = request.headers.get("host") || "bettercv.click";
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const publicOrigin = `${protocol}://${host}`;

    if (code) {
      const cookieStore = cookies();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Missing Supabase configuration variables in Next.js server runtime.");
        return NextResponse.redirect(
          `${publicOrigin}/auth?error=${encodeURIComponent("Missing Supabase configuration on server")}`,
        );
      }

      const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(
              cookiesToSet: {
                name: string;
                value: string;
                options?: Parameters<typeof cookieStore.set>[2];
              }[],
            ) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options),
                );
              } catch {
                /* set from Server Component */
              }
            },
          },
        },
      );

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("Supabase exchangeCodeForSession error:", error.message);
        return NextResponse.redirect(
          `${publicOrigin}/auth?error=${encodeURIComponent(error.message)}`,
        );
      }
    }

    return NextResponse.redirect(
      `${publicOrigin}/auth/callback/success?next=${encodeURIComponent(next)}`,
    );
  } catch (err) {
    console.error("Unhandled error in auth callback route handler:", err);
    const host = request.headers.get("host") || "bettercv.click";
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const publicOrigin = `${protocol}://${host}`;
    const errorMsg = err instanceof Error ? err.message : "Unknown auth callback error";
    return NextResponse.redirect(
      `${publicOrigin}/auth?error=${encodeURIComponent(errorMsg)}`,
    );
  }
}
