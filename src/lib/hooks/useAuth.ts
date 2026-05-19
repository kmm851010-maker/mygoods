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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setUser(data?.user || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const signIn = useCallback(async () => {
    if (typeof window === 'undefined' || !window.Pi) {
      alert('Pi Browser에서만 로그인할 수 있습니다');
      return;
    }
    setLoading(true);
    try {
      const auth = await window.Pi.authenticate(
        ['username'],
        async (incompletePay) => {
          // Handle incomplete payment if needed
          console.warn('Incomplete payment found:', incompletePay);
        }
      );

      const response = await fetch('/api/auth/pi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: auth.accessToken,
          piUser: auth.user,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        alert('로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      alert('로그인 중 오류가 발생했습니다.');
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
