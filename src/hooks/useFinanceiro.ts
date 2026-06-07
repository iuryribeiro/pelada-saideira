'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMeusPagamentos,
  fetchResumoMensalistas,
  marcarMensalidadePaga,
  fetchJogosComAvulsos,
  marcarAvulsoPago,
  desmarcarPago,
  fetchJogosComGoleiros,
  marcarGoleiroPago,
} from '@/services/financeiro.service';

export function useMeusPagamentos(userId: string) {
  return useQuery({
    queryKey: ['meusPagamentos', userId],
    queryFn: () => fetchMeusPagamentos(userId),
    staleTime: 60_000,
    enabled: !!userId,
  });
}

export function useResumoMensalistas(mes: string) {
  return useQuery({
    queryKey: ['resumoMensalistas', mes],
    queryFn: () => fetchResumoMensalistas(mes),
    staleTime: 30_000,
    enabled: !!mes,
  });
}

export function useMarcarMensalidadePaga(mes: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, valor }: { userId: string; valor: number }) =>
      marcarMensalidadePaga(userId, mes, valor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumoMensalistas', mes] });
    },
  });
}

export function useJogosComAvulsos() {
  return useQuery({
    queryKey: ['jogosComAvulsos'],
    queryFn: fetchJogosComAvulsos,
    staleTime: 30_000,
  });
}

export function useMarcarAvulsoPago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string | null; jogoId: string | null; presencaId: string; valor: number }) =>
      marcarAvulsoPago(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jogosComAvulsos'] });
    },
  });
}

export function useJogosComGoleiros() {
  return useQuery({
    queryKey: ['jogosComGoleiros'],
    queryFn: fetchJogosComGoleiros,
    staleTime: 30_000,
  });
}

export function useMarcarGoleiroPago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; jogoId: string; valor: number }) =>
      marcarGoleiroPago(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jogosComGoleiros'] });
    },
  });
}

export function useDesmarcarPago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pagamentoId: string) => desmarcarPago(pagamentoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jogosComAvulsos'] });
      queryClient.invalidateQueries({ queryKey: ['jogosComGoleiros'] });
      queryClient.invalidateQueries({ queryKey: ['resumoMensalistas'] });
    },
  });
}
