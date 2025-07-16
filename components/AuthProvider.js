"use client";
import { SessionProvider } from "next-auth/react";

export default function AuthProvider({ children }) {
  return (
    <SessionProvider refetchInterval={15 * 60} refetchOnWindowFocus={true}>
      {children}
    </SessionProvider>
  );
}