import { NextResponse } from "next/server";

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  console.log(`Middleware checking path: ${path}`);

  const protectedRoutes = {
    "/dashboard": ["admin", "salesperson"],
    "/products": ["admin"],
    "/sales": ["admin", "salesperson"],
    "/add": ["admin"],
    "/branches": ["admin"],
  };

  if (path === "/unauthorized" || path === "/login") {
    console.log("Allowing access to /unauthorized or /login");
    return NextResponse.next();
  }

  const isProtected = Object.keys(protectedRoutes).some((route) =>
    path.startsWith(route)
  );

  if (isProtected) {
    console.log("Path is protected, checking authentication...");
    const authResponse = await fetch(
      `${request.nextUrl.origin}/api/auth-check`,
      {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      }
    );
    const authData = await authResponse.json();
    console.log(`Auth check result: ${JSON.stringify(authData)}`);

    if (!authData.authenticated) {
      console.log("User not authenticated, redirecting to /unauthorized");
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    const allowedRoles =
      protectedRoutes[
        Object.keys(protectedRoutes).find((route) => path.startsWith(route))
      ];
    if (!allowedRoles.includes(authData.role)) {
      console.log(
        `Role ${authData.role} not allowed for ${path}, redirecting to /unauthorized`
      );
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    console.log(`Access granted for role: ${authData.role}`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/products/:path*",
    "/sales/:path*",
    "/add/:path*",
    "/branches/:path*",
  ],
};