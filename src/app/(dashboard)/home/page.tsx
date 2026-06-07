'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { usePelada, useProximoJogo } from '@/hooks/usePelada';
import { useAvisos } from '@/hooks/useAvisos';
import { usePresencas } from '@/hooks/usePresencas';
import { Spinner } from '@/components/ui/Spinner';
import { signOut } from '@/lib/supabase/auth';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  AlertCircle,
  User,
} from 'lucide-react';

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatTime(timeStr: string) {
  return timeStr.slice(0, 5);
}

export default function HomePage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { data: pelada, isLoading: peladaLoading } = usePelada();
  const { data: proximoJogo, isLoading: jogoLoading } = useProximoJogo();
  const { data: avisos } = useAvisos();
  const { data: presencas } = usePresencas(proximoJogo?.id || '');

  const isLoading = peladaLoading || jogoLoading;

  const confirmedLinha = presencas?.filter(
    (p) => p.status === 'confirmado' && p.posicao === 'linha'
  ).length || 0;
  const confirmedGoleiros = presencas?.filter(
    (p) => p.status === 'confirmado' && p.posicao === 'goleiro'
  ).length || 0;
  const pendingCount = presencas?.filter((p) => p.status === 'pendente').length || 0;
  const latestAviso = avisos?.[0];

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  const displayName = profile?.apelido || profile?.nome || 'Jogador';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 px-4 pt-8 pb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-green-200 text-sm">Bem-vindo,</p>
            <h1 className="text-2xl font-bold text-white">{displayName}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/perfil" className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
              <User className="w-5 h-5 text-white" />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <LogOut className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 -mt-2">
        {/* Admin Banner */}
        {profile?.is_admin && (
          <Link
            href="/admin"
            className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-yellow-100 rounded-full flex items-center justify-center">
                <Settings className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-semibold text-yellow-800 text-sm">Painel Admin</p>
                {pendingCount > 0 && (
                  <p className="text-xs text-yellow-600">{pendingCount} aprovação(ões) pendente(s)</p>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-yellow-600" />
          </Link>
        )}

        {/* Próximo Jogo */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Próximo Jogo</h2>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : proximoJogo && pelada ? (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    {formatDate(proximoJogo.data)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {proximoJogo.tipo === 'fixo' ? 'Jogo fixo' : 'Jogo extra'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-gray-700">
                  {formatTime(pelada.horario_inicio)} – {formatTime(pelada.horario_fim)}
                </p>
              </div>

              {pelada.quadra_nome && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">{pelada.quadra_nome}</p>
                    {pelada.quadra_endereco && (
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(pelada.quadra_endereco)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        {pelada.quadra_endereco}
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-700">
                    <span className="font-semibold text-green-600">{confirmedLinha}</span>
                    <span className="text-gray-400">/{pelada.max_jogadores}</span>
                    <span className="text-gray-500 text-sm ml-1">jogadores</span>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="font-semibold text-green-600">{confirmedGoleiros}</span>
                    <span className="text-gray-400">/{pelada.max_goleiros}</span>
                    <span className="text-gray-500 text-sm ml-1">goleiros</span>
                  </p>
                </div>
              </div>

              {/* Valores */}
              <div className="bg-gray-50 rounded-xl p-3 mt-2">
                <p className="text-xs text-gray-500 mb-1.5 font-medium">Valores</p>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-gray-400 text-xs">Mensalista</span>
                    <p className="font-semibold text-gray-900">R$ {pelada.valor_mensalista}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Avulso</span>
                    <p className="font-semibold text-gray-900">R$ {pelada.valor_avulso}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Goleiro</span>
                    <p className="font-semibold text-gray-900">R$ {pelada.valor_goleiro}</p>
                  </div>
                </div>
              </div>

              <Link
                href="/pelada"
                className="block w-full text-center py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors mt-2"
              >
                Ver lista de presença
              </Link>
            </div>
          ) : (
            <div className="p-6 text-center">
              <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Nenhum jogo agendado</p>
            </div>
          )}
        </div>

        {/* Último Aviso */}
        {latestAviso && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Último Aviso</h2>
                <Link href="/avisos" className="text-xs text-green-600 hover:underline">
                  Ver todos
                </Link>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{latestAviso.titulo}</p>
                  <p className="text-gray-600 text-sm mt-0.5 line-clamp-2">{latestAviso.mensagem}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(latestAviso.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
