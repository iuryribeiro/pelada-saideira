'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { resetPassword } from '@/lib/supabase/auth';
import { Spinner } from '@/components/ui/Spinner';
import { ArrowLeft, Mail } from 'lucide-react';

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Informe seu e-mail.'); return; }
    setLoading(true);
    setError('');
    try {
      await resetPassword(email.trim());
      setEnviado(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar e-mail');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Turma da Pelada Saideira" width={140} height={140} priority />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6">
          <div className="flex items-center gap-3 mb-5">
            <Link href="/login" className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h2 className="text-xl font-semibold text-gray-900">Recuperar senha</h2>
          </div>

          {enviado ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-green-600" />
              </div>
              <p className="font-medium text-gray-900 mb-1">E-mail enviado!</p>
              <p className="text-sm text-gray-500 mb-5">
                Verifique sua caixa de entrada e clique no link para criar uma nova senha.
              </p>
              <Link href="/login" className="text-sm text-green-600 font-medium hover:underline">
                Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">
                Informe seu e-mail e enviaremos um link para você criar uma nova senha.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Spinner size="sm" /> : 'Enviar link de recuperação'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
