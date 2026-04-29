import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard"];

export async function proxy(request: NextRequest) {
  if (!isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const session = await getSession(request);

  if (session) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*"]
};

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

async function getSession(request: NextRequest): Promise<boolean> {
  const authUrl =
    process.env.NEXT_PUBLIC_REQLENS_API_URL ?? "http://localhost:3001";

  try {
    const response = await fetch(`${authUrl}/api/auth/get-session`, {
      cache: "no-store",
      headers: {
        cookie: request.headers.get("cookie") ?? ""
      }
    });

    if (!response.ok) {
      return false;
    }

    return Boolean(await response.json());
  } catch {
    return false;
  }
}
