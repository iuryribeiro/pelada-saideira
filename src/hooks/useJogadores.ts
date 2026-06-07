'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchJogadores, votar, atualizarPerfil, fetchPerfil } from '@/services/jogadores.service';
import { Profile, UserPosicao } from '@/types/database';

export function useJogadores(userId: string) {
  return useQuery({
    queryKey: ['jogadores', userId],
    queryFn: () => fetchJogadores(userId),
    staleTime: 60_000,
    enabled: !!userId,
  });
}

export function usePerfil(userId: string) {
  return useQuery({
    queryKey: ['perfil', userId],
    queryFn: () => fetchPerfil(userId),
    staleTime: 60_000,
    enabled: !!userId,
  });
}

export function useVotar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      avaliadorId,
      avaliadoId,
      nivel,
    }: {
      avaliadorId: string;
      avaliadoId: string;
      nivel: number;
    }) => votar(avaliadorId, avaliadoId, nivel),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jogadores', variables.avaliadorId] });
    },
  });
}

export function useAtualizarPerfil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      dados,
    }: {
      userId: string;
      dados: Partial<Pick<Profile, 'nome' | 'apelido' | 'posicao' | 'telefone'>>;
    }) => atualizarPerfil(userId, dados),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['perfil', variables.userId] });
    },
  });
}
