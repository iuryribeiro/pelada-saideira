'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useProximoJogo } from '@/hooks/usePelada';
import { useAvulsosPendentes, useAprovarPresenca, useRecusarPresenca } from '@/hooks/useAdmin';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import { PosicaoBadge } from '@/components/ui/Badge';
import { ArrowLeft, UserCheck, UserX, UserCircle, Clock } from 'lucide-react';

export default function AprovarAvulsosPage() {
  const router = useRouter();
  const { profile, isLoading: authLoading } = useAuthStore();
  const { data: proximoJogo, isLoading: jogoLoading } = useProximoJogo();
  const jogoId = proximoJogo?.id || '';

  const { data: pendentes, isLoading: pendentesLoading } = useAvulsosPendentes(jogoId);
  const aprovarMutation = useAprovarPresenca();
  const recusarMutation = useRecusarPresenca();

  useEffect(() => {
    if (!authLoading && !profile?.is_admin) router.replace('/home');
  }, [profile, authLoading, router]);

  if (authLoading || jogoLoading) return <FullPageSpinner />;
  if (!profile?.is_admin) return null;

  const handleAprovar = async (presencaId: string) => {
    await aprovarMutation.mutateAsync({ presencaId, jogoId });
  };

  const handleRecusar = async (presencaId: string) => {
    await recusarMutation.mutateAsync({ presencaId, jogoId });
  };

  const isLoading = pendentesLoading || aprovarMutation.isPending || recusarMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 px-4 pt-8 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 bg-white/20 rounded-full hover:bg-white/30">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Aprovar Avulsos</h1>
            <p className="text-green-200 text-sm">
              {pendentes ? `${pendentes.length} pendente(s)` : 'Carregando...'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {!jogoId ? (
          <div className="text-center py-12">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Nenhum jogo aberto</p>
          </div>
        ) : pendentesLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : !pendentes || pendentes.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <UserCheck className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Nenhuma solicitação pendente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendentes.map((presenca) => {
              const profile = presenca.profile;
              const adicionadoPor = presenca.adicionado_por_profile;
              const nome = profile?.nome || presenca.convidado_nome || 'Convidado';
              const apelido = profile?.apelido;

              return (
                <div key={presenca.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{apelido || nome}</span>
                        {apelido && <span className="text-xs text-gray-400">({nome})</span>}
                        {!presenca.user_id && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Convidado</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <PosicaoBadge posicao={presenca.posicao} />
                        {adicionadoPor && (
                          <span className="text-xs text-gray-400">
                            por {adicionadoPor.apelido || adicionadoPor.nome}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(presenca.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRecusar(presenca.id)}
                      disabled={isLoading}
                      className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium text-sm hover:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <UserX className="w-4 h-4" />
                      Recusar
                    </button>
                    <button
                      onClick={() => handleAprovar(presenca.id)}
                      disabled={isLoading}
                      className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {aprovarMutation.isPending ? <Spinner size="sm" /> : <><UserCheck className="w-4 h-4" /> Aprovar</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
