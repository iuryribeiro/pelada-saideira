'use client';

import { useState, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { fetchPerfil } from '@/services/jogadores.service';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

function AuthListener({ children }: { children: React.ReactNode }) {
  const { setSession, setProfile, setLoading, clear } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        try {
          const profile = await fetchPerfil(session.user.id);
          setProfile(profile);
        } catch {
          // profile might not exist yet
        }
      }
      setLoading(false);
      initialized.current = true;
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!initialized.current) return;
      setSession(session);
      if (session?.user) {
        try {
          const profile = await fetchPerfil(session.user.id);
          setProfile(profile);
        } catch {
          setProfile(null);
        }
      } else {
        clear();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthListener>{children}</AuthListener>
    </QueryClientProvider>
  );
}
