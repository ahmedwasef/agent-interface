'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, sessionExpiry, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Allow the login page without auth
    if (pathname === '/login') return;

    // Check session expiry
    if (sessionExpiry && Date.now() > sessionExpiry) {
      logout();
      router.replace('/login');
      return;
    }

    if (!currentUser) {
      router.replace('/login');
    }
  }, [currentUser, sessionExpiry, pathname, router, logout]);

  // Don't block the login page
  if (pathname === '/login') return <>{children}</>;

  // While redirecting, show nothing (or a spinner)
  if (!currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
