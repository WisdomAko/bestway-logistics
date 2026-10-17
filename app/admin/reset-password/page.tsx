
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error || !data.session) {
        setMessage(
          'No valid password reset session found. Please request a new reset email.'
        );
      } else {
        setReady(true);
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return;

        if (session) {
          setReady(true);
          setMessage('');
        }
      }
    );

    checkSession();

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('');

    if (password.length < 8) {
      setMessage('Use at least 8 characters for your password.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('The passwords do not match.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Password updated successfully. Redirecting to login...');

    setTimeout(() => {
      router.replace('/admin/login');
    }, 2000);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="panel w-full max-w-md">
        <h1>Reset Admin Password</h1>
        <p className="muted">
          Choose a new password for your Bestway Logistics admin account.
        </p>

        <form onSubmit={handleSubmit} className="mt-6">
          <label htmlFor="password">New password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            placeholder="At least 8 characters"
          />

          <label htmlFor="confirmPassword">Confirm new password</label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
            placeholder="Enter the password again"
          />

          <button
            className="button mt-4"
            type="submit"
            disabled={!ready || loading}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        {message && <p className="mt-4">{message}</p>}

        <p className="mt-4">
          <a href="/admin/login">Back to admin login</a>
        </p>
      </div>
    </main>
  );
}
