'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ready, setReady] = useState(false);
  const [expirado, setExpirado] = useState(false);

  useEffect(() => {
    // Supabase processes the URL hash/token automatically and fires PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      } else if (event === 'SIGNED_IN' && session) {
        setReady(true);
      }
    });

    // Check if there is already a session (token processed before this effect ran)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    // If nothing happens within 8 seconds, the link is likely invalid/expired
    const timeout = setTimeout(() => {
      setExpirado(prev => {
        if (!ready) return true;
        return prev;
      });
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senha || !confirmar) { setError('Preencha todos os campos.'); return; }
    if (senha.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (senha !== confirmar) { setError('As senhas não coincidem.'); return; }

    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) throw error;
      setSuccess('Senha definida com sucesso! Redirecionando...');
      setTimeout(() => router.replace('/home'), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao definir senha');
    } finally {
      setLoading(false);
    }
  };

  if (expirado && !ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6">
            <p className="font-semibold text-gray-900 mb-2">Link inválido ou expirado</p>
            <p className="text-sm text-gray-500 mb-4">
              Solicite um novo link de redefinição de senha.
            </p>
            <Link
              href="/esqueci-senha"
              className="inline-block px-5 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors text-sm"
            >
              Solicitar novo link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <Spinner size="lg" />
        <p className="text-sm text-gray-400 mt-4">Verificando link...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Turma da Pelada Saideira" width={120} height={120} priority />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <KeyRound className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Criar senha</h2>
              <p className="text-xs text-gray-400">Defina sua senha de acesso</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
              <div className="relative">
                <input
                  type={showSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 pr-12"
                  disabled={loading || !!success}
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
              <input
                type="password"
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={loading || !!success}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Spinner size="sm" /> : 'Salvar senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
