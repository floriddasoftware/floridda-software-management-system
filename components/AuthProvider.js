"use client"
import { SessionProvider } from 'next-auth/react'
import React from 'react'

const AuthProvider = ({children}) => {
  return (
    <main>
        <SessionProvider>{children}</SessionProvider>
    </main>
  )
}

export default AuthProvider;