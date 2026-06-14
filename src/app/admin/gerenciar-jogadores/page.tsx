'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useTodosJogadores, useAtualizarJogador, useCadastrarAvulso, useConvidarJogador, useVincularEmail } from '@/hooks/useAdmin';
import { Modal } from '@/components/ui/Modal';
import { TipoBadge, PosicaoBadge } from '@/components/ui/Badge';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import { Profile, UserPosicao, UserTipo } from '@/types/database';
import { ArrowLeft, Search, UserPlus, Edit2, UserCircle } from 'lucide-react';

function JogadorEditModal({
  jogador,
  onClose,
}: {
  jogador: Profile;
  onClose: () => void;
}) {
  const atualizarMutation = useAtualizarJogador();
  const vincularMutation = useVincularEmail();
  const [form, setForm] = useState({
    tipo: jogador.tipo,
    nivel: jogador.nivel,
    posicao: jogador.posicao,
    ativo: jogador.ativo,
    is_admin: jogador.is_admin,
  });
  const [email, setEmail] = useState('');
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    try {
      await atualizarMutation.mutateAsync({ userId: jogador.id, dados: form });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    }
  };

  const handleVincularEmail = async () => {
    setError('');
    if (!email.trim()) return;
    try {
      await vincularMutation.mutateAsync({ profileId: jogador.id, email: email.trim() });
      setEmailEnviado(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao vincular e-mail');
    }
  };

  const selectClass = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500";
  const inputClass = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <div className="space-y-4">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <UserCircle className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{jogador.apelido || jogador.nome}</p>
          {jogador.apelido && <p className="text-xs text-gray-400">{jogador.nome}</p>}
        </div>
      </div>

      <div className="border border-blue-200 bg-blue-50 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-blue-700">Vincular e-mail ao jogador</p>
          {emailEnviado ? (
            <p className="text-xs text-green-700">✅ E-mail enviado! O jogador receberá um link para criar a senha.</p>
          ) : (
            <>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className={inputClass}
              />
              <button
                onClick={handleVincularEmail}
                disabled={!email.trim() || vincularMutation.isPending}
                className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {vincularMutation.isPending ? <Spinner size="sm" /> : '✉️ Enviar convite de acesso'}
              </button>
            </>
          )}
        </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
        <select
          value={form.tipo}
          onChange={e => setForm(f => ({ ...f, tipo: e.target.value as UserTipo }))}
          className={selectClass}
        >
          <option value="mensalista">Mensalista</option>
          <option value="avulso">Avulso</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Posição</label>
        <div className="flex gap-2">
          {(['linha', 'goleiro'] as UserPosicao[]).map(p => (
            <button
              key={p}
              onClick={() => setForm(f => ({ ...f, posicao: p }))}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                form.posicao === p ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {p === 'linha' ? 'Linha' : 'Goleiro'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nível (1-5)</label>
        <input
          type="number"
          value={form.nivel}
          onChange={e => setForm(f => ({ ...f, nivel: Math.min(5, Math.max(1, Number(e.target.value))) }))}
          min={1} max={5}
          className={selectClass}
        />
      </div>

      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
        <span className="text-sm font-medium text-gray-700">Ativo</span>
        <button
          onClick={() => setForm(f => ({ ...f, ativo: !f.ativo }))}
          className={`w-12 h-6 rounded-full transition-colors ${form.ativo ? 'bg-green-500' : 'bg-gray-300'}`}
        >
          <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.ativo ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>

      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
        <span className="text-sm font-medium text-gray-700">Admin</span>
        <button
          onClick={() => setForm(f => ({ ...f, is_admin: !f.is_admin }))}
          className={`w-12 h-6 rounded-full transition-colors ${form.is_admin ? 'bg-yellow-500' : 'bg-gray-300'}`}
        >
          <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.is_admin ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm">
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={atualizarMutation.isPending}
          className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {atualizarMutation.isPending ? <Spinner size="sm" /> : 'Salvar'}
        </button>
      </div>
    </div>
  );
}

function CadastrarAvulsoModal({ onClose }: { onClose: () => void }) {
  const cadastrarMutation = useCadastrarAvulso();
  const convidarMutation = useConvidarJogador();
  const [form, setForm] = useState({
    nome: '',
    apelido: '',
    telefone: '',
    email: '',
    posicao: 'linha' as UserPosicao,
  });
  const [error, setError] = useState('');

  const temEmail = form.email.trim().length > 0;
  const isPending = cadastrarMutation.isPending || convidarMutation.isPending;

  const handleSave = async () => {
    if (!form.nome.trim()) { setError('Nome é obrigatório'); return; }
    try {
      if (temEmail) {
        await convidarMutation.mutateAsync({
          email: form.email.trim(),
          nome: form.nome.trim(),
          apelido: form.apelido.trim() || undefined,
          telefone: form.telefone.trim() || undefined,
          posicao: form.posicao,
        });
      } else {
        await cadastrarMutation.mutateAsync({
          nome: form.nome.trim(),
          apelido: form.apelido.trim() || undefined,
          telefone: form.telefone.trim() || undefined,
          posicao: form.posicao,
        });
      }
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao cadastrar');
    }
  };

  const inputClass = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <div className="space-y-4">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
        <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className={inputClass} placeholder="Nome completo" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Apelido</label>
        <input type="text" value={form.apelido} onChange={e => setForm(f => ({ ...f, apelido: e.target.value }))} className={inputClass} placeholder="Opcional" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
        <input type="tel" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} className={inputClass} placeholder="(11) 99999-9999" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          E-mail <span className="text-gray-400 font-normal">(opcional — para enviar convite)</span>
        </label>
        <input
          type="email"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className={inputClass}
          placeholder="jogador@email.com"
        />
        {temEmail && (
          <p className="text-xs text-blue-600 mt-1">
            ✉️ O jogador receberá um e-mail para criar a senha e acessar o app.
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Posição</label>
        <div className="flex gap-2">
          {(['linha', 'goleiro'] as UserPosicao[]).map(p => (
            <button
              key={p}
              onClick={() => setForm(f => ({ ...f, posicao: p }))}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${form.posicao === p ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {p === 'linha' ? 'Linha' : 'Goleiro'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm">Cancelar</button>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending ? <Spinner size="sm" /> : temEmail ? '✉️ Enviar convite' : 'Cadastrar'}
        </button>
      </div>
    </div>
  );
}

export default function GerenciarJogadoresPage() {
  const router = useRouter();
  const { profile, isLoading: authLoading } = useAuthStore();
  const { data: jogadores, isLoading } = useTodosJogadores();
  const [search, setSearch] = useState('');
  const [editingJogador, setEditingJogador] = useState<Profile | null>(null);
  const [showCadastrar, setShowCadastrar] = useState(false);

  useEffect(() => {
    if (!authLoading && !profile?.is_admin) router.replace('/home');
  }, [profile, authLoading, router]);

  if (authLoading) return <FullPageSpinner />;
  if (!profile?.is_admin) return null;

  const filtered = jogadores?.filter(j => {
    const q = search.toLowerCase();
    return j.nome.toLowerCase().includes(q) || (j.apelido?.toLowerCase().includes(q));
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 px-4 pt-8 pb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 bg-white/20 rounded-full hover:bg-white/30">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Gerenciar Jogadores</h1>
          </div>
          <button
            onClick={() => setShowCadastrar(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white text-green-700 rounded-xl text-sm font-medium hover:bg-green-50"
          >
            <UserPlus className="w-4 h-4" />
            Novo
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar jogador..."
            className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 mb-2">{filtered.length} jogadores</p>
            {filtered.map((jogador) => (
              <div
                key={jogador.id}
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm"
              >
                <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {jogador.apelido || jogador.nome}
                    {!jogador.ativo && <span className="ml-2 text-xs text-red-400">(inativo)</span>}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <TipoBadge tipo={jogador.tipo} />
                    <PosicaoBadge posicao={jogador.posicao} />
                  </div>
                </div>
                <button
                  onClick={() => setEditingJogador(jogador)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={!!editingJogador} onClose={() => setEditingJogador(null)} title="Editar Jogador">
        {editingJogador && (
          <JogadorEditModal
            jogador={editingJogador}
            onClose={() => setEditingJogador(null)}
          />
        )}
      </Modal>

      <Modal isOpen={showCadastrar} onClose={() => setShowCadastrar(false)} title="Cadastrar Avulso">
        <CadastrarAvulsoModal onClose={() => setShowCadastrar(false)} />
      </Modal>
    </div>
  );
}
