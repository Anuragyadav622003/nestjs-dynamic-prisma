// frontend/src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center animate-pulse">
            <div className="w-10 h-10 bg-white/20 rounded-lg animate-spin"></div>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">DataForge</h2>
          <p className="text-slate-400">Redirecting to your destination...</p>
        </div>
      </div>
    </div>
  );
}