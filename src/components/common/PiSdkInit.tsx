'use client';

import { useEffect } from 'react';

export default function PiSdkInit() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Pi) {
      try {
        window.Pi.init({
          version: '2.0',
          sandbox: process.env.NEXT_PUBLIC_PI_SANDBOX === 'true',
        });
      } catch (e) {
        console.warn('Pi SDK init failed:', e);
      }
    }
  }, []);

  return null;
}
