import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// updateSession is called by the root proxy.ts on every request.
// It refreshes the Supabase auth token and writes it back to both
// the request (for Server Components) and the response (for the browser).
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Do NOT put this client in a global variable — always create a fresh one per request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Do not run any code between createServerClient and getClaims().
  // getClaims() validates the JWT signature every time — unlike getSession() it cannot be spoofed.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // Redirect unauthenticated users away from protected routes
  const { pathname } = request.nextUrl;
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/pricing");

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: return supabaseResponse as-is.
  // If you create a new NextResponse, copy the cookies:
  //   myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  return supabaseResponse;
}
