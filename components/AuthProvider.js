"use client";
import { SessionProvider } from "next-auth/react";
import React, { useEffect } from "react";
import { signOut } from "next-auth/react";

const AuthProvider = ({ children }) => {
  useEffect(() => {
    let timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        signOut({ callbackUrl: "/login" });
      }, 30 * 60 * 1000);
    };

    const events = ["mousemove", "keydown", "scroll", "click"];
    events.forEach(event => {
      window.addEventListener(event, resetTimeout);
    });
    
    resetTimeout();
    
    return () => {
      clearTimeout(timeout);
      events.forEach(event => {
        window.removeEventListener(event, resetTimeout);
      });
    };
  }, []);

  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      {children}
    </SessionProvider>
  );
};

export default AuthProvider;