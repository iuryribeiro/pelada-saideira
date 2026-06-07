'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { Home, Users, Bell, DollarSign, Trophy } from 'lucide-react';

const tabs = [
  { href: '/home', label: 'Início', icon: Home },
  { href: '/pelada', label: 'Pelada', icon: Trophy },
  { href: '/avisos', label: 'Avisos', icon: Bell },
  { href: '/jogadores', label: 'Jogadores', icon: Users },
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/login');
    }
  }, [session, isLoading, router]);

  if (isLoading) return <FullPageSpinner />;
  if (!session) return null;

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-gray-50 flex flex-col relative">
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-200 safe-bottom z-40">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                  isActive ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-xs font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
