'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAvulsosPendentes,
  aprovarPresenca,
  recusarPresenca,
  criarJogo,
  atualizarPelada,
  fetchTodosJogadores,
  atualizarJogador,
  cadastrarAvulso,
  CadastrarAvulsoData,
  convidarJogador,
  ConvidarJogadorData,
  fetchJogosDisponiveis,
  adicionarAvulsoAoJogo,
  adicionarConvidadoComPerfil,
  fetchHistoricoAvulso,
} from '@/services/admin.service';
import { JogoTipo, Pelada, UserPosicao, Profile } from '@/types/database';

export function useAvulsosPendentes(jogoId: string) {
  return useQuery({
    queryKey: ['avulsosPendentes', jogoId],
    queryFn: () => fetchAvulsosPendentes(jogoId),
    staleTime: 30_000,
    enabled: !!jogoId,
  });
}

export function useAprovarPresenca() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ presencaId }: { presencaId: string; jogoId: string }) =>
      aprovarPresenca(presencaId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['avulsosPendentes', variables.jogoId] });
      queryClient.invalidateQueries({ queryKey: ['presencas', variables.jogoId] });
    },
  });
}

export function useRecusarPresenca() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ presencaId }: { presencaId: string; jogoId: string }) =>
      recusarPresenca(presencaId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['avulsosPendentes', variables.jogoId] });
      queryClient.invalidateQueries({ queryKey: ['presencas', variables.jogoId] });
    },
  });
}

export function useCriarJogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      peladaId,
      data,
      tipo,
    }: {
      peladaId: string;
      data: string;
      tipo: JogoTipo;
    }) => criarJogo(peladaId, data, tipo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proximoJogo'] });
      queryClient.invalidateQueries({ queryKey: ['jogosRecentes'] });
      queryClient.invalidateQueries({ queryKey: ['jogosDisponiveis'] });
    },
  });
}

export function useAtualizarPelada() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      peladaId,
      dados,
    }: {
      peladaId: string;
      dados: Partial<Pelada>;
    }) => atualizarPelada(peladaId, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pelada'] });
    },
  });
}

export function useTodosJogadores() {
  return useQuery({
    queryKey: ['todosJogadores'],
    queryFn: fetchTodosJogadores,
    staleTime: 60_000,
  });
}

export function useAtualizarJogador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      dados,
    }: {
      userId: string;
      dados: Partial<Pick<Profile, 'tipo' | 'nivel' | 'ativo' | 'posicao' | 'is_admin'>>;
    }) => atualizarJogador(userId, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todosJogadores'] });
      queryClient.invalidateQueries({ queryKey: ['jogadores'] });
    },
  });
}

export function useCadastrarAvulso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: CadastrarAvulsoData) => cadastrarAvulso(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todosJogadores'] });
    },
  });
}

export function useConvidarJogador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: ConvidarJogadorData) => convidarJogador(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todosJogadores'] });
    },
  });
}

export function useJogosDisponiveis() {
  return useQuery({
    queryKey: ['jogosDisponiveis'],
    queryFn: fetchJogosDisponiveis,
    staleTime: 60_000,
  });
}

export function useAdicionarAvulsoAoJogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      jogoId,
      posicao,
    }: {
      userId: string;
      jogoId: string;
      posicao: UserPosicao;
    }) => adicionarAvulsoAoJogo(userId, jogoId, posicao),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['presencas', variables.jogoId] });
    },
  });
}

export function useAdicionarConvidadoComPerfil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jogoId, nome, posicao }: { jogoId: string; nome: string; posicao: UserPosicao }) =>
      adicionarConvidadoComPerfil(jogoId, nome, posicao),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['presencas', variables.jogoId] });
      queryClient.invalidateQueries({ queryKey: ['todosJogadores'] });
    },
  });
}
