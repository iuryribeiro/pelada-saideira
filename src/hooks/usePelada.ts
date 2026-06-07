'use client';
import { useQuery } from '@tanstack/react-query';
import { fetchPelada, fetchProximoJogo, fetchJogosRecentes } from '@/services/peladas.service';

export function usePelada() {
  return useQuery({
    queryKey: ['pelada'],
    queryFn: fetchPelada,
    staleTime: 60_000,
  });
}

export function useProximoJogo() {
  return useQuery({
    queryKey: ['proximoJogo'],
    queryFn: fetchProximoJogo,
    staleTime: 60_000,
  });
}

export function useJogosRecentes(limite = 10) {
  return useQuery({
    queryKey: ['jogosRecentes', limite],
    queryFn: () => fetchJogosRecentes(limite),
    staleTime: 60_000,
  });
}
