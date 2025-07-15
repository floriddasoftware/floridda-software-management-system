import { NextResponse } from "next/server";

export async function middleware(request) {
  const path = request.nextUrl.pathname;

  const protectedRoutes = {
    "/dashboard": ["admin", "salesperson"], 
    "/products": ["admin"],
    "/sales": ["admin", "salesperson"],
    "/add": ["admin"],
  };

  if (path === "/unauthorized" || path === "/login") {
    return NextResponse.next();
  }

  const isProtected = Object.keys(protectedRoutes).some((route) =>
    path.startsWith(route)
  );

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
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    const allowedRoles =
      protectedRoutes[
        Object.keys(protectedRoutes).find((route) => path.startsWith(route))
      ];
    if (!allowedRoles.includes(authData.role)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/products/:path*",
    "/sales/:path*",
    "/add/:path*",
  ],
};