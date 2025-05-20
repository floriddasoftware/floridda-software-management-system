import { NextResponse } from "next/server";

export async function middleware(request) {
  const path = request.nextUrl.pathname;

  const protectedRoutes = {
    "/dashboard": ["admin", "salesperson"],
    "/products": ["admin"],
    "/sales": ["admin", "salesperson"],
    "/add": ["admin"],
  };

  const isProtected = Object.keys(protectedRoutes).some((route) =>
    path.startsWith(route)
  );

  if (path === "/unauthorized" || path === "/login") {
    return NextResponse.next();
  }

  if (isProtected) {
    const authResponse = await fetch(
      `${request.nextUrl.origin}/api/auth-check`,
      {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      }
    );
    const authData = await authResponse.json();

    if (!authData.authenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const allowedRoles = protectedRoutes[
      Object.keys(protectedRoutes).find((route) => path.startsWith(route))
    ];

    if (!allowedRoles.includes(authData.role)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/products/:path*", "/sales/:path*", "/add/:path*"],
};