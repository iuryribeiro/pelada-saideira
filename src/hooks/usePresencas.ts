'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPresencas,
  fetchMinhaPresenca,
  confirmarPresenca,
  cancelarPresenca,
  adicionarConvidado,
  marcarChegou,
  atualizarStatusPresenca,
} from '@/services/presencas.service';
import { UserPosicao, UserTipo, PresencaStatus } from '@/types/database';

export function usePresencas(jogoId: string) {
  return useQuery({
    queryKey: ['presencas', jogoId],
    queryFn: () => fetchPresencas(jogoId),
    staleTime: 30_000,
    enabled: !!jogoId,
  });
}

export function useMinhaPresenca(jogoId: string, userId: string) {
  return useQuery({
    queryKey: ['minhaPresenca', jogoId, userId],
    queryFn: () => fetchMinhaPresenca(jogoId, userId),
    staleTime: 30_000,
    enabled: !!jogoId && !!userId,
  });
}

export function useConfirmarPresenca() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      jogoId,
      userId,
      posicao,
      tipo,
      maxLinha,
      maxGoleiros,
    }: {
      jogoId: string;
      userId: string;
      posicao: UserPosicao;
      tipo: UserTipo;
      maxLinha: number;
      maxGoleiros: number;
    }) => confirmarPresenca(jogoId, userId, posicao, tipo, maxLinha, maxGoleiros),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['presencas', variables.jogoId] });
      queryClient.invalidateQueries({ queryKey: ['minhaPresenca', variables.jogoId] });
    },
  });
}

export function useCancelarPresenca() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ presencaId }: { presencaId: string; jogoId: string }) =>
      cancelarPresenca(presencaId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['presencas', variables.jogoId] });
      queryClient.invalidateQueries({ queryKey: ['minhaPresenca', variables.jogoId] });
    },
  });
}

export function useAdicionarConvidado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      jogoId,
      adicionadoPor,
      nome,
      posicao,
    }: {
      jogoId: string;
      adicionadoPor: string;
      nome: string;
      posicao: UserPosicao;
    }) => adicionarConvidado(jogoId, adicionadoPor, nome, posicao),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['presencas', variables.jogoId] });
    },
  });
}

export function useMarcarChegou() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      presencaId,
      chegou,
    }: {
      presencaId: string;
      chegou: boolean;
      jogoId: string;
    }) => marcarChegou(presencaId, chegou),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['presencas', variables.jogoId] });
    },
  });
}

export function useAtualizarStatusPresenca() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      presencaId,
      status,
    }: {
      presencaId: string;
      status: PresencaStatus;
      jogoId: string;
    }) => atualizarStatusPresenca(presencaId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['presencas', variables.jogoId] });
    },
  });
}
