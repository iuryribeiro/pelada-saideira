'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { useAtualizarPerfil } from '@/hooks/useJogadores';
import { resetPassword } from '@/lib/supabase/auth';
import { StarRating, NivelLabel } from '@/components/ui/StarRating';
import { TipoBadge, PosicaoBadge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { UserPosicao } from '@/types/database';
import { ArrowLeft, Edit2, Check, X, KeyRound, UserCircle } from 'lucide-react';

export default function PerfilPage() {
  const router = useRouter();
  const { profile, setProfile } = useAuthStore();
  const atualizarMutation = useAtualizarPerfil();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    apelido: '',
    posicao: 'linha' as UserPosicao,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        nome: profile.nome || '',
        apelido: profile.apelido || '',
        posicao: profile.posicao || 'linha',
      });
    }
  }, [profile]);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleSave = async () => {
    if (!form.nome.trim()) {
      setError('Nome é obrigatório');
      return;
    }
    setError('');
    try {
      const updated = await atualizarMutation.mutateAsync({
        userId: profile.id,
        dados: {
          nome: form.nome.trim(),
          apelido: form.apelido.trim() || null,
          posicao: form.posicao,
        },
      });
      setProfile(updated);
      setEditing(false);
      setSuccess('Perfil atualizado!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    }
  };

  const handleResetPassword = async () => {
    if (!profile) return;
    setResetLoading(true);
    setError('');
    try {
      const { data: { session } } = await import('@/lib/supabase/client').then(m => m.supabase.auth.getSession());
      if (session?.user.email) {
        await resetPassword(session.user.email);
        setSuccess('Email de redefinição enviado!');
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao enviar email');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 px-4 pt-8 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Perfil</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <UserCircle className="w-10 h-10 text-white" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{profile.apelido || profile.nome}</p>
            {profile.apelido && <p className="text-green-200 text-sm">{profile.nome}</p>}
            <div className="flex items-center gap-2 mt-1">
              <TipoBadge tipo={profile.tipo} />
              <PosicaoBadge posicao={profile.posicao} />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Dados pessoais</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-green-600 text-sm font-medium hover:text-green-700"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEditing(false); setError(''); }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={atualizarMutation.isPending}
                  className="p-1.5 text-green-600 hover:text-green-700 rounded-lg hover:bg-green-50 flex items-center gap-1"
                >
                  {atualizarMutation.isPending ? <Spinner size="sm" /> : <Check className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Nome</label>
              {editing ? (
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              ) : (
                <p className="text-gray-900 font-medium mt-0.5">{profile.nome}</p>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Apelido</label>
              {editing ? (
                <input
                  type="text"
                  value={form.apelido}
                  onChange={(e) => setForm(f => ({ ...f, apelido: e.target.value }))}
                  placeholder="Opcional"
                  className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              ) : (
                <p className="text-gray-900 font-medium mt-0.5">{profile.apelido || <span className="text-gray-400">Não definido</span>}</p>
              )}
            </div>

            {editing && (
              <div>
                <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Posição</label>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => setForm(f => ({ ...f, posicao: 'linha' }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      form.posicao === 'linha'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Linha
                  </button>
                  <button
                    onClick={() => setForm(f => ({ ...f, posicao: 'goleiro' }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      form.posicao === 'goleiro'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Goleiro
                  </button>
                </div>
              </div>
            )}

            {!editing && (
              <>
                <div>
                  <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Telefone</label>
                  <p className="text-gray-900 font-medium mt-0.5">{profile.telefone || <span className="text-gray-400">Não informado</span>}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Nível médio</label>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StarRating value={profile.nivel} readonly size="sm" />
                    <NivelLabel nivel={profile.nivel} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Segurança</h2>
          <button
            onClick={handleResetPassword}
            disabled={resetLoading}
            className="flex items-center gap-3 w-full p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
              {resetLoading ? <Spinner size="sm" /> : <KeyRound className="w-4 h-4 text-blue-600" />}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Redefinir senha</p>
              <p className="text-xs text-gray-400">Enviar email de redefinição</p>
            </div>
          </button>
        </div>

        {profile.is_admin && (
          <Link
            href="/admin"
            className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl"
          >
            <span className="font-medium text-yellow-800">Painel Administrativo</span>
            <span className="text-yellow-600">→</span>
          </Link>
        )}
      </div>
    </div>
  );
}
