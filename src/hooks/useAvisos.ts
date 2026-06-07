'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAvisos, criarAviso, deletarAviso } from '@/services/avisos.service';

export function useAvisos() {
  return useQuery({
    queryKey: ['avisos'],
    queryFn: fetchAvisos,
    staleTime: 60_000,
  });
}

export function useCriarAviso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      titulo,
      mensagem,
      adminId,
    }: {
      titulo: string;
      mensagem: string;
      adminId: string;
    }) => criarAviso(titulo, mensagem, adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avisos'] });
    },
  });
}

export function useDeletarAviso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletarAviso(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avisos'] });
    },
  });
}
