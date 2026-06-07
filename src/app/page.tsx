'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { FullPageSpinner } from '@/components/ui/Spinner';

export default function RootPage() {
  const router = useRouter();
  const { session, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;
    if (session) {
      router.replace('/home');
    } else {
      router.replace('/login');
    }
  }, [session, isLoading, router]);

  return <FullPageSpinner />;
}
