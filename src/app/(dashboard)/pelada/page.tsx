'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { usePelada, useProximoJogo } from '@/hooks/usePelada';
import {
  usePresencas,
  useConfirmarPresenca,
  useCancelarPresenca,
  useAdicionarConvidado,
  useMarcarChegou,
} from '@/hooks/usePresencas';
import { useTodosJogadores, useAdicionarAvulsoAoJogo, useAdicionarConvidadoComPerfil } from '@/hooks/useAdmin';
import { Tabs } from '@/components/ui/Tabs';
import { Modal } from '@/components/ui/Modal';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { Spinner } from '@/components/ui/Spinner';
import { PresencaComPerfil, UserPosicao } from '@/types/database';
import {
  Calendar, Clock, MapPin, UserPlus, RefreshCw,
  CheckCircle, UserCircle, Trash2, Users, Search,
} from 'lucide-react';

const NIVEL_LABELS: Record<number, string> = {
  1: 'Perna de Pau', 2: 'Iniciante', 3: 'Mediano', 4: 'Bom', 5: 'Craque',
};

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

// ── Card de jogador na lista ──────────────────────────────────────────────────
function PlayerRow({
  presenca, index, isAdmin, onMarcarChegou, onRemover,
}: {
  presenca: PresencaComPerfil;
  index: number;
  isAdmin: boolean;
  onMarcarChegou: (id: string, chegou: boolean) => void;
  onRemover: (presenca: PresencaComPerfil) => void;
}) {
  const p = presenca.profile;
  const isConvidado = presenca.user_id === null;
  const nome = isConvidado
    ? (presenca.convidado_nome || 'Convidado')
    : (p?.apelido || p?.nome || '?');
  const nivel = p?.nivel ?? 3;

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
      {/* número */}
      <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-green-700">{index + 1}</span>
      </div>

      {/* info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-semibold text-gray-900 text-sm truncate">{nome}</p>
          {isConvidado && (
            <span className="text-[10px] font-bold text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded">
              Convidado
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {!isConvidado && <StarRating value={nivel} readonly size="sm" />}
          {!isConvidado && (
            <span className="text-xs text-gray-400">
              {NIVEL_LABELS[nivel]} · {p?.posicao === 'goleiro' ? '🧤' : '⚽'}
            </span>
          )}
          {isConvidado && (
            <span className="text-xs text-gray-400">
              {presenca.posicao === 'goleiro' ? '🧤 Goleiro' : '⚽ Linha'} · Avulso
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <StatusBadge status={presenca.status} />
          {presenca.chegou && <Badge variant="green">Chegou ✓</Badge>}
        </div>
      </div>

      {/* ações admin */}
      {isAdmin && (
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={() => onMarcarChegou(presenca.id, !presenca.chegou)}
            title={presenca.chegou ? 'Chegou' : 'Marcar chegada'}
            className={`p-1.5 rounded-lg transition-colors ${
              presenca.chegou
                ? 'bg-green-100 text-green-600'
                : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-500'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRemover(presenca)}
            title="Remover"
            className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Modal adicionar convidado (mensalista ou admin) ───────────────────────────
function ModalConvidado({
  open, jogoId, adicionadoPor, isAdmin, onClose,
}: { open: boolean; jogoId: string; adicionadoPor: string; isAdmin: boolean; onClose: () => void }) {
  const [nome, setNome] = useState('');
  const [posicao, setPosicao] = useState<UserPosicao>('linha');
  const mutationConvidado = useAdicionarConvidado();
  const mutationComPerfil = useAdicionarConvidadoComPerfil();
  const [erro, setErro] = useState('');

  const isPending = mutationConvidado.isPending || mutationComPerfil.isPending;

  async function handleSalvar() {
    if (!nome.trim()) { setErro('Informe o nome do jogador.'); return; }
    setErro('');
    try {
      if (isAdmin) {
        await mutationComPerfil.mutateAsync({ jogoId, nome: nome.trim(), posicao });
      } else {
        await mutationConvidado.mutateAsync({ jogoId, adicionadoPor, nome: nome.trim(), posicao });
      }
      setNome('');
      setPosicao('linha');
      onClose();
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao adicionar');
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="Adicionar Avulso">
      <p className="text-sm text-gray-500 -mt-1 mb-1">
        {isAdmin ? 'Cria um perfil avulso e adiciona diretamente à pelada' : 'Adicione um jogador que não tem conta no app'}
      </p>
      <div className="space-y-4">
        {erro && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{erro}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo ou apelido</label>
          <input
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex: João da Silva"
            maxLength={60}
            autoFocus
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Posição</label>
          <div className="flex gap-2">
            {(['linha', 'goleiro'] as UserPosicao[]).map(pos => (
              <button
                key={pos}
                onClick={() => setPosicao(pos)}
                className={`flex-1 py-2.5 rounded-xl font-medium text-sm border-2 transition-colors ${
                  posicao === pos
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {pos === 'linha' ? '⚽ Linha' : '🧤 Goleiro'}
              </button>
            ))}
          </div>
        </div>

        {!isAdmin && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <p className="text-xs text-yellow-700">⚠️ O convidado precisará de aprovação do admin antes de entrar na lista.</p>
          </div>
        )}

        {isAdmin && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-xs text-green-700">✅ O jogador será criado como avulso e confirmado diretamente.</p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm">
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={isPending || !nome.trim()}
            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? <Spinner size="sm" /> : 'Adicionar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Modal adicionar jogador cadastrado (admin) ────────────────────────────────
function ModalAdicionarJogador({
  open, jogoId, presencas, onClose,
}: {
  open: boolean;
  jogoId: string;
  presencas: PresencaComPerfil[];
  onClose: () => void;
}) {
  const [busca, setBusca] = useState('');
  const [posicao, setPosicao] = useState<UserPosicao>('linha');
  const [confirming, setConfirming] = useState<string | null>(null);
  const { data: todosJogadores = [] } = useTodosJogadores();
  const adicionarMutation = useAdicionarAvulsoAoJogo();
  const [erro, setErro] = useState('');

  const idsNaPelada = useMemo(
    () => new Set(presencas.map(p => p.user_id).filter(Boolean)),
    [presencas]
  );

  const disponiveis = useMemo(() => {
    return (todosJogadores as Array<{ id: string; nome: string; apelido: string | null; tipo: string; posicao: string; nivel: number; ativo: boolean }>).filter(j => {
      if (!j.ativo) return false;
      if (idsNaPelada.has(j.id)) return false;
      const nome = (j.apelido ?? j.nome ?? '').toLowerCase();
      return nome.includes(busca.toLowerCase());
    });
  }, [todosJogadores, idsNaPelada, busca]);

  async function handleAdicionar(jogador: { id: string; nome: string; apelido: string | null }) {
    setErro('');
    setConfirming(jogador.id);
    try {
      await adicionarMutation.mutateAsync({ userId: jogador.id, jogoId, posicao });
      setBusca('');
      onClose();
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao adicionar');
    } finally {
      setConfirming(null);
    }
  }

  function handleClose() {
    setBusca('');
    setErro('');
    onClose();
  }

  return (
    <Modal isOpen={open} onClose={handleClose} title="Adicionar à Pelada">
      <p className="text-sm text-gray-500 -mt-1 mb-3">Selecione o jogador e a posição</p>

      <div className="space-y-3">
        {erro && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{erro}</div>}

        {/* Posição */}
        <div className="flex gap-2">
          {(['linha', 'goleiro'] as UserPosicao[]).map(pos => (
            <button
              key={pos}
              onClick={() => setPosicao(pos)}
              className={`flex-1 py-2.5 rounded-xl font-medium text-sm border-2 transition-colors ${
                posicao === pos
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {pos === 'linha' ? '⚽ Linha' : '🧤 Goleiro'}
            </button>
          ))}
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar jogador..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Lista */}
        <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 rounded-xl border border-gray-100">
          {disponiveis.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">
              {busca ? 'Nenhum jogador encontrado.' : 'Todos os jogadores ativos já estão na pelada.'}
            </p>
          ) : disponiveis.map(jogador => (
            <div
              key={jogador.id}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-green-700">
                  {(jogador.apelido ?? jogador.nome).charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {jogador.apelido ?? jogador.nome}
                </p>
                <p className="text-xs text-gray-400">
                  {jogador.tipo === 'mensalista' ? '📅 Mensalista' : '🎯 Avulso'} · {jogador.posicao === 'goleiro' ? '🧤' : '⚽'}
                </p>
              </div>
              <button
                onClick={() => handleAdicionar(jogador)}
                disabled={confirming === jogador.id}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
              >
                {confirming === jogador.id ? <Spinner size="sm" /> : '+ Adicionar'}
              </button>
            </div>
          ))}
        </div>

        <button onClick={handleClose} className="w-full py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium text-sm mt-1">
          Fechar
        </button>
      </div>
    </Modal>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function PeladaPage() {
  const { profile } = useAuthStore();
  const { data: pelada } = usePelada();
  const { data: proximoJogo, isLoading: jogoLoading } = useProximoJogo();
  const { data: presencas = [], isLoading: presencasLoading, refetch } = usePresencas(proximoJogo?.id || '');

  const [activeTab, setActiveTab] = useState('linha');
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [choosingPosicao, setChoosingPosicao] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const confirmarPresencaMutation = useConfirmarPresenca();
  const cancelarPresencaMutation = useCancelarPresenca();
  const marcarChegouMutation = useMarcarChegou();

  const isAdmin = profile?.is_admin ?? false;
  const isMensalista = profile?.tipo === 'mensalista';
  const jogoId = proximoJogo?.id || '';

  const minhaPresenca = presencas.find(p => p.user_id === profile?.id);

  const confirmedLinha = presencas.filter(p => p.status === 'confirmado' && p.posicao === 'linha');
  const confirmedGoleiros = presencas.filter(p => p.status === 'confirmado' && p.posicao === 'goleiro');
  const waitlistAll = presencas.filter(p => p.status === 'lista_espera' || p.status === 'pendente');

  const tabs = [
    { id: 'linha', label: 'Linha', count: confirmedLinha.length },
    { id: 'goleiro', label: 'Goleiro', count: confirmedGoleiros.length },
    { id: 'espera', label: 'Fila', count: waitlistAll.length },
  ];

  const currentList = activeTab === 'linha' ? confirmedLinha
    : activeTab === 'goleiro' ? confirmedGoleiros
    : waitlistAll;

  const podeAdicionarConvidado = (isMensalista || isAdmin) && !!proximoJogo;

  async function handleConfirmar(posicao: UserPosicao) {
    if (!profile || !proximoJogo || !pelada) return;
    setActionLoading(true);
    setError('');
    try {
      await confirmarPresencaMutation.mutateAsync({
        jogoId: proximoJogo.id,
        userId: profile.id,
        posicao,
        tipo: profile.tipo,
        maxLinha: pelada.max_jogadores,
        maxGoleiros: pelada.max_goleiros,
      });
      setChoosingPosicao(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao confirmar presença');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelar() {
    if (!minhaPresenca) return;
    if (!confirm('Deseja cancelar sua presença?')) return;
    setActionLoading(true);
    try {
      await cancelarPresencaMutation.mutateAsync({ presencaId: minhaPresenca.id, jogoId });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao cancelar');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemover(presenca: PresencaComPerfil) {
    const isConvidado = presenca.user_id === null;
    const nome = isConvidado
      ? (presenca.convidado_nome || 'Convidado')
      : (presenca.profile?.apelido ?? presenca.profile?.nome ?? 'Jogador');
    const msg = `Remover ${nome} da lista?${presenca.status === 'confirmado' ? '\nO próximo da fila será promovido automaticamente.' : ''}`;
    if (!confirm(msg)) return;
    await cancelarPresencaMutation.mutateAsync({ presencaId: presenca.id, jogoId });
  }

  async function handleMarcarChegou(presencaId: string, chegou: boolean) {
    await marcarChegouMutation.mutateAsync({ presencaId, chegou, jogoId });
  }

  function handleAbrirMaps() {
    const endereco = pelada?.quadra_endereco ?? pelada?.quadra_nome;
    if (!endereco) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`, '_blank');
  }

  function statusEmoji(status: string) {
    if (status === 'confirmado') return '✅';
    if (status === 'pendente') return '⏳';
    if (status === 'lista_espera') return '📋';
    return '❌';
  }

  function statusLabel(status: string) {
    if (status === 'confirmado') return 'Presença confirmada!';
    if (status === 'pendente') return 'Aguardando aprovação';
    if (status === 'lista_espera') return 'Lista de espera';
    return 'Recusado';
  }

  if (jogoLoading || presencasLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!proximoJogo || !pelada) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-4">
        <span className="text-6xl">⚽</span>
        <p className="text-xl font-bold text-gray-800">Nenhuma pelada aberta</p>
        <p className="text-gray-500 text-center text-sm">O admin ainda não abriu a próxima pelada.</p>
      </div>
    );
  }

  const vagasLinha = pelada.max_jogadores - confirmedLinha.length;
  const vagasGoleiro = pelada.max_goleiros - confirmedGoleiros.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 px-4 pt-8 pb-5">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-bold text-white">{pelada.nome}</h1>
            <span className="inline-block mt-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              {proximoJogo.tipo === 'extra' ? 'Extra' : 'Fixo'}
            </span>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="mt-3 space-y-1 text-sm">
          <div className="flex items-center gap-1.5 text-green-100">
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="capitalize">{formatDate(proximoJogo.data)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-green-100">
            <Clock className="w-4 h-4 shrink-0" />
            <span>{pelada.horario_inicio.slice(0, 5)} – {pelada.horario_fim.slice(0, 5)}</span>
          </div>
          {pelada.quadra_nome && (
            <div className="flex items-center gap-1.5 text-green-100">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{pelada.quadra_nome}</span>
            </div>
          )}
          {pelada.quadra_endereco && (
            <p className="text-green-200 text-xs pl-5">{pelada.quadra_endereco}</p>
          )}
          {(pelada.quadra_endereco || pelada.quadra_nome) && (
            <button
              onClick={handleAbrirMaps}
              className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors"
            >
              🗺️ Abrir no Maps
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        )}

        {/* Card de vagas */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Vagas disponíveis</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Linha */}
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">
                {confirmedLinha.length}<span className="text-base font-normal text-gray-400">/{pelada.max_jogadores}</span>
              </p>
              <p className="text-sm text-gray-500 mt-0.5">⚽ Linha</p>
              <p className={`text-xs font-medium mt-1 ${vagasLinha > 0 ? 'text-green-600' : 'text-orange-500'}`}>
                {vagasLinha > 0 ? `${vagasLinha} vagas` : 'Lista de espera'}
              </p>
            </div>
            {/* Goleiros */}
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">
                {confirmedGoleiros.length}<span className="text-base font-normal text-gray-400">/{pelada.max_goleiros}</span>
              </p>
              <p className="text-sm text-gray-500 mt-0.5">🧤 Goleiros</p>
              <p className={`text-xs font-medium mt-1 ${vagasGoleiro > 0 ? 'text-green-600' : 'text-orange-500'}`}>
                {vagasGoleiro > 0 ? `${vagasGoleiro} vagas` : 'Lista de espera'}
              </p>
            </div>
          </div>
        </div>

        {/* Minha presença */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm font-medium text-gray-600 mb-3">Minha presença</p>

          {minhaPresenca ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl">{statusEmoji(minhaPresenca.status)}</span>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-sm">{statusLabel(minhaPresenca.status)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {minhaPresenca.posicao === 'goleiro' ? '🧤 Goleiro' : '⚽ Linha'}
                </p>
              </div>
              {minhaPresenca.status !== 'recusado' && (
                <button
                  onClick={handleCancelar}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              )}
            </div>
          ) : choosingPosicao ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Escolha sua posição:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleConfirmar('linha')}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  ⚽ Linha
                </button>
                <button
                  onClick={() => handleConfirmar('goleiro')}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  🧤 Goleiro
                </button>
                <button
                  onClick={() => setChoosingPosicao(false)}
                  className="px-3 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm"
                >
                  ✕
                </button>
              </div>
              {actionLoading && <div className="flex justify-center"><Spinner size="sm" /></div>}
              {profile?.tipo === 'avulso' && (
                <p className="text-xs text-gray-400 text-center italic">
                  Como avulso, sua presença precisará ser aprovada pelo admin.
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={() => setChoosingPosicao(true)}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors"
            >
              {isMensalista ? 'Confirmar Presença' : 'Solicitar Presença'}
            </button>
          )}
        </div>

        {/* Botão adicionar convidado (mensalistas + admin) */}
        {podeAdicionarConvidado && (
          <button
            onClick={() => setShowGuestModal(true)}
            className="w-full py-3 flex items-center justify-center gap-2 border-2 border-yellow-400 bg-yellow-50 text-yellow-700 rounded-xl font-semibold text-sm hover:bg-yellow-100 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Adicionar avulso sem conta
          </button>
        )}

        {/* Botão admin: adicionar jogador cadastrado */}
        {isAdmin && proximoJogo && (
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full py-3 flex items-center justify-center gap-2 border-2 border-green-400 bg-green-50 text-green-700 rounded-xl font-semibold text-sm hover:bg-green-100 transition-colors"
          >
            <UserCircle className="w-4 h-4" />
            Adicionar jogador à pelada
          </button>
        )}

        {/* Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Lista */}
        <div className="space-y-2 pb-4">
          {currentList.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              Nenhum jogador nesta lista
            </div>
          ) : (
            currentList.map((presenca, i) => (
              <PlayerRow
                key={presenca.id}
                presenca={presenca}
                index={i}
                isAdmin={isAdmin}
                onMarcarChegou={handleMarcarChegou}
                onRemover={handleRemover}
              />
            ))
          )}
        </div>
      </div>

      {/* Modal convidado */}
      <ModalConvidado
        open={showGuestModal}
        jogoId={jogoId}
        adicionadoPor={profile?.id ?? ''}
        isAdmin={isAdmin}
        onClose={() => setShowGuestModal(false)}
      />

      {/* Modal adicionar jogador (admin) */}
      <ModalAdicionarJogador
        open={showAddModal}
        jogoId={jogoId}
        presencas={presencas}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
}
