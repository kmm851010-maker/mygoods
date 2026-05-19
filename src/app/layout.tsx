import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/hooks/useAuth';
import PiSdkInit from '@/components/common/PiSdkInit';

export const metadata: Metadata = {
  title: 'mygoods - 우리 동네 중고거래',
  description: 'Pi 코인으로 거래하는 위치 기반 중고거래 플랫폼',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'mygoods',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="h-full bg-white text-gray-900 antialiased font-sans">
        <AuthProvider>
          <PiSdkInit />
          <div className="max-w-lg mx-auto h-full relative">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
