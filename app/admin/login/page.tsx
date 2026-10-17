
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')


async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    alert(error.message)
    return
  }

  window.location.href = '/admin'
}



  return (
    <main className="min-h-screen flex items-center justify-center p-5">
      <div className="panel w-full max-w-md">
        <h1 className="text-3xl font-bold mb-3">Admin Login</h1>

        <p className="muted mb-6">
          Sign in to manage Bestway Logistics shipments.
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter admin email"
              autoComplete="username"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </div>

          <button className="button mt-2 w-full" type="submit">
            Sign In
          </button>
        </form>

        <p className="mt-5">
          <Link href="/">Back to shipment tracking</Link>
        </p>
      </div>
    </main>
  )
}
