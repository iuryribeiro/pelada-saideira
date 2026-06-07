'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useAvisos, useCriarAviso, useDeletarAviso } from '@/hooks/useAvisos';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Bell, Plus, Trash2, AlertCircle } from 'lucide-react';

export default function AvisosPage() {
  const { profile } = useAuthStore();
  const { data: avisos, isLoading } = useAvisos();
  const criarAvisoMutation = useCriarAviso();
  const deletarAvisoMutation = useDeletarAviso();

  const [showModal, setShowModal] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState('');

  const isAdmin = profile?.is_admin || false;

  const handleCriar = async () => {
    if (!titulo.trim() || !mensagem.trim() || !profile) return;
    setError('');
    try {
      await criarAvisoMutation.mutateAsync({
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        adminId: profile.id,
      });
      setShowModal(false);
      setTitulo('');
      setMensagem('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao criar aviso');
    }
  };

  const handleDeletar = async (id: string) => {
    try {
      await deletarAvisoMutation.mutateAsync(id);
      setConfirmDelete(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao deletar aviso');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 px-4 pt-8 pb-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Avisos</h1>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white text-green-700 rounded-xl text-sm font-medium hover:bg-green-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo
            </button>
          )}
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
        ) : !avisos || avisos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Bell className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Nenhum aviso ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {avisos.map((aviso) => (
              <div
                key={aviso.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bell className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{aviso.titulo}</h3>
                      <p className="text-gray-600 text-sm mt-1">{aviso.mensagem}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(aviso.created_at).toLocaleDateString('pt-BR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setConfirmDelete(aviso.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Novo Aviso">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Jogo cancelado"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Escreva o aviso aqui..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleCriar}
              disabled={!titulo.trim() || !mensagem.trim() || criarAvisoMutation.isPending}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {criarAvisoMutation.isPending ? <Spinner size="sm" /> : 'Publicar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirmar exclusão">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">Tem certeza que deseja excluir este aviso?</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(null)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={() => confirmDelete && handleDeletar(confirmDelete)}
              disabled={deletarAvisoMutation.isPending}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium text-sm hover:bg-red-700 disabled:opacity-50"
            >
              Excluir
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
