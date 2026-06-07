'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useJogadores, useVotar } from '@/hooks/useJogadores';
import { Modal } from '@/components/ui/Modal';
import { StarRating, NivelLabel } from '@/components/ui/StarRating';
import { TipoBadge, PosicaoBadge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { JogadorComNivel } from '@/services/jogadores.service';
import { Search, UserCircle, Star } from 'lucide-react';

function JogadorListItem({
  jogador,
  isSelf,
  onVote,
}: {
  jogador: JogadorComNivel;
  isSelf: boolean;
  onVote: (jogador: JogadorComNivel) => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm ${
        !isSelf ? 'cursor-pointer hover:border-green-200 hover:shadow-md transition-all' : ''
      }`}
      onClick={() => !isSelf && onVote(jogador)}
    >
      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
        <UserCircle className="w-6 h-6 text-green-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 text-sm">
            {jogador.apelido || jogador.nome}
          </span>
          {jogador.apelido && (
            <span className="text-xs text-gray-400">({jogador.nome})</span>
          )}
          {isSelf && (
            <span className="text-xs text-green-600 font-medium">(você)</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <StarRating value={jogador.nivel_medio} readonly size="sm" />
          <NivelLabel nivel={jogador.nivel_medio} />
          <TipoBadge tipo={jogador.tipo} />
          <PosicaoBadge posicao={jogador.posicao} />
        </div>
      </div>
      {!isSelf && (
        <div className="flex-shrink-0">
          {jogador.meu_voto ? (
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="w-4 h-4 fill-yellow-400" />
              <span className="text-xs font-medium">{jogador.meu_voto}</span>
            </div>
          ) : (
            <div className="text-xs text-gray-300 font-medium">votar</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function JogadoresPage() {
  const { profile } = useAuthStore();
  const { data: jogadores, isLoading } = useJogadores(profile?.id || '');
  const votarMutation = useVotar();

  const [search, setSearch] = useState('');
  const [votingFor, setVotingFor] = useState<JogadorComNivel | null>(null);
  const [selectedNivel, setSelectedNivel] = useState(3);
  const [error, setError] = useState('');

  const filtered = jogadores?.filter((j) => {
    const q = search.toLowerCase();
    return (
      j.nome.toLowerCase().includes(q) ||
      (j.apelido && j.apelido.toLowerCase().includes(q))
    );
  }) || [];

  const handleVote = async () => {
    if (!profile || !votingFor) return;
    setError('');
    try {
      await votarMutation.mutateAsync({
        avaliadorId: profile.id,
        avaliadoId: votingFor.id,
        nivel: selectedNivel,
      });
      setVotingFor(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao votar');
    }
  };

  const openVoting = (jogador: JogadorComNivel) => {
    setSelectedNivel(jogador.meu_voto || 3);
    setVotingFor(jogador);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 px-4 pt-8 pb-5">
        <h1 className="text-xl font-bold text-white mb-3">Jogadores</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar jogador..."
            className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
      </div>

      <div className="px-4 py-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Nenhum jogador encontrado
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 mb-2">{filtered.length} jogadores • Toque para avaliar</p>
            {filtered.map((jogador) => (
              <JogadorListItem
                key={jogador.id}
                jogador={jogador}
                isSelf={jogador.id === profile?.id}
                onVote={openVoting}
              />
            ))}
          </div>
        )}
      </div>

      {/* Voting Modal */}
      <Modal
        isOpen={!!votingFor}
        onClose={() => setVotingFor(null)}
        title={`Avaliar ${votingFor?.apelido || votingFor?.nome || ''}`}
      >
        <div className="space-y-5">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserCircle className="w-9 h-9 text-green-600" />
            </div>
            <p className="font-semibold text-gray-900">{votingFor?.apelido || votingFor?.nome}</p>
            {votingFor?.meu_voto && (
              <p className="text-xs text-gray-400 mt-1">Seu voto atual: {votingFor.meu_voto} estrela(s)</p>
            )}
          </div>

          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-gray-600">Selecione sua avaliação:</p>
            <StarRating
              value={selectedNivel}
              onChange={setSelectedNivel}
              size="lg"
            />
            <div className="text-center">
              <p className="font-semibold text-gray-900">{selectedNivel} estrela(s)</p>
              <NivelLabel nivel={selectedNivel} />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setVotingFor(null)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleVote}
              disabled={votarMutation.isPending}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {votarMutation.isPending ? <Spinner size="sm" /> : 'Confirmar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
