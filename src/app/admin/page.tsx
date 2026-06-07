'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { useProximoJogo } from '@/hooks/usePelada';
import { usePresencas } from '@/hooks/usePresencas';
import { FullPageSpinner } from '@/components/ui/Spinner';
import {
  ArrowLeft,
  Settings,
  UserCheck,
  Users,
  Shuffle,
  CircleDot,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

const adminMenuItems = [
  {
    href: '/admin/editar-pelada',
    icon: Settings,
    label: 'Editar Pelada',
    description: 'Configurações e criar novos jogos',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    href: '/admin/aprovar-avulsos',
    icon: UserCheck,
    label: 'Aprovar Avulsos',
    description: 'Gerenciar solicitações pendentes',
    color: 'bg-yellow-100 text-yellow-600',
    badge: true,
  },
  {
    href: '/admin/gerenciar-jogadores',
    icon: Users,
    label: 'Gerenciar Jogadores',
    description: 'Editar perfis e cadastrar novos',
    color: 'bg-green-100 text-green-600',
  },
  {
    href: '/admin/sorteio-times',
    icon: Shuffle,
    label: 'Sorteio de Times',
    description: 'Dividir jogadores em times',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    href: '/admin/tampinha',
    icon: CircleDot,
    label: 'Tampinha',
    description: 'Jogo da tampinha',
    color: 'bg-orange-100 text-orange-600',
  },
];

export default function AdminPage() {
  const router = useRouter();
  const { profile, isLoading } = useAuthStore();
  const { data: proximoJogo } = useProximoJogo();
  const { data: presencas } = usePresencas(proximoJogo?.id || '');

  const pendingCount = presencas?.filter(p => p.status === 'pendente').length || 0;

  useEffect(() => {
    if (!isLoading && !profile?.is_admin) {
      router.replace('/home');
    }
  }, [profile, isLoading, router]);

  if (isLoading) return <FullPageSpinner />;
  if (!profile?.is_admin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 px-4 pt-8 pb-5">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.push('/home')}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Painel Admin</h1>
            <p className="text-green-200 text-sm">Gerenciamento da pelada</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-2">
        {pendingCount > 0 && (
          <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              {pendingCount} solicitação(ões) aguardando aprovação
            </p>
          </div>
        )}

        {adminMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-green-200 hover:shadow-md transition-all"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{item.label}</span>
                  {item.badge && pendingCount > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs rounded-full font-bold">
                      {pendingCount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
