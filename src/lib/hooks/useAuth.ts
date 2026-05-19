'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

export type AuthUser = {
  id: string;
  pi_uid: string;
  pi_username?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const PI_SANDBOX = process.env.NEXT_PUBLIC_PI_SANDBOX === 'true';

async function piInitAndAuthenticate(): Promise<{ accessToken: string; user: { uid: string; username: string } }> {
  // Await Pi.init() as a Promise before calling authenticate
  await window.Pi.init({ version: '2.0', sandbox: PI_SANDBOX });

  return window.Pi.authenticate(['username'], (incompletePay) => {
    console.warn('[Pi] Incomplete payment found:', incompletePay);
  });
}

async function sendTokenToBackend(accessToken: string, piUser: { uid: string; username: string }) {
  const res = await fetch('/api/auth/pi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken, piUser }),
  });
  if (!res.ok) throw new Error(`Backend auth failed: ${res.status}`);
  return res.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check for an existing session first
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then(async (data) => {
        if (data?.user) {
          // Already have a valid session — no need to re-authenticate
          setUser(data.user);
          setLoading(false);
          return;
        }

        // 2. No session — attempt automatic Pi authentication
        if (typeof window === 'undefined' || !window.Pi) {
          // Not running inside Pi Browser; skip auto-auth
          setLoading(false);
          return;
        }

        try {
          const auth = await piInitAndAuthenticate();
          const { user: authedUser } = await sendTokenToBackend(auth.accessToken, auth.user);
          setUser(authedUser);
        } catch (err) {
          // Auto-auth failure is non-fatal; user can retry via the sign-in button
          console.warn('[Pi] Auto-authentication failed:', err);
        } finally {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  // Manual sign-in trigger (re-runs init + authenticate)
  const signIn = useCallback(async () => {
    if (typeof window === 'undefined' || !window.Pi) {
      alert('Pi Browser에서만 로그인할 수 있습니다');
      return;
    }
    setLoading(true);
    try {
      const auth = await piInitAndAuthenticate();
      const { user: authedUser } = await sendTokenToBackend(auth.accessToken, auth.user);
      setUser(authedUser);
    } catch (err) {
      console.error('[Pi] Sign in error:', err);
      alert('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    setUser(null);
  }, []);

  return React.createElement(
    AuthContext.Provider,
    { value: { user, loading, signIn, signOut } },
    children
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
