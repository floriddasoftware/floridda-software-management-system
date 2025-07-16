import { NextResponse } from "next/server";
import { auth } from "@/auth";

const protectedRoutes = {
  "/dashboard": ["admin", "salesperson"],
  "/products": ["admin"],
  "/sales": ["admin", "salesperson"],
  "/add": ["admin"],
  "/branches": ["admin"],
};

export async function middleware(request) {
  const path = request.nextUrl.pathname;

  if (["/login", "/unauthorized"].includes(path)) {
    return NextResponse.next();
  }

  const session = await auth();
  const role = session?.user?.role || "guest";

  const matchedRoute = Object.keys(protectedRoutes).find((route) =>
    path.startsWith(route)
  );

  if (!matchedRoute) {
    return NextResponse.next();
  }

  const allowedRoles = protectedRoutes[matchedRoute];

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!allowedRoles.includes(role)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
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