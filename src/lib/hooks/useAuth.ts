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

/** Poll until window.Pi is available (script loaded) or timeout. */
function waitForPiSDK(timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Pi) return resolve(true);

    const deadline = Date.now() + timeoutMs;
    const id = setInterval(() => {
      if (window.Pi) {
        clearInterval(id);
        resolve(true);
      } else if (Date.now() >= deadline) {
        clearInterval(id);
        resolve(false);
      }
    }, 50);
  });
}

async function piInitAndAuthenticate() {
  // Pi.init() returns a Promise in SDK v2 — await it before authenticate
  await window.Pi.init({ version: '2.0', sandbox: PI_SANDBOX });
  return window.Pi.authenticate(['username', 'payments'], (incompletePay) => {
    if (!incompletePay) return;
    fetch('/api/payments/incomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentId: incompletePay.identifier,
        txid: incompletePay.transaction?.txid,
      }),
    }).catch((err) => console.error('[Pi] Incomplete payment handler failed:', err));
  });
}

async function sendTokenToBackend(
  accessToken: string,
  piUser: { uid: string; username: string }
) {
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
    // Wait for the Pi SDK script to finish loading, then authenticate.
    // waitForPiSDK resolves false in a regular browser (no window.Pi).
    waitForPiSDK().then(async (hasPi) => {
      if (!hasPi) {
        // Not Pi Browser — restore session from cookie only
        const data = await fetch('/api/auth/me')
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);
        setUser(data?.user || null);
        setLoading(false);
        return;
      }

      // Pi Browser confirmed — Pi.authenticate() must be called now
      try {
        const auth = await piInitAndAuthenticate();
        const { user: authedUser } = await sendTokenToBackend(auth.accessToken, auth.user);
        setUser(authedUser);
      } catch (err) {
        console.error('[Pi] Authentication error:', err);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const signIn = useCallback(async () => {
    const hasPi = await waitForPiSDK(3000);
    if (!hasPi) {
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
