
'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    alert('Login authentication is not connected yet. Please set up Supabase authentication before signing in.')
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="panel w-full max-w-md">
        <h1>Admin Login</h1>
        <p className="muted">
          Sign in to manage Bestway Logistics shipments.
        </p>

        <form onSubmit={handleLogin} className="mt-6">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter admin email"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />

          <button className="button" type="submit">
            Sign In
          </button>
        </form>

        <p className="mt-4">
          <Link href="/">Back to shipment tracking</Link>
        </p>
      </div>
    </main>
  )
}
