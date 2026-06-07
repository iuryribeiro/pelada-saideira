import { supabase } from '@/lib/supabase/client';
import { Profile, UserPosicao, UserTipo } from '@/types/database';

export interface JogadorComNivel extends Profile {
  nivel_medio: number;
  meu_voto: number | null;
}

export async function fetchJogadores(userId: string): Promise<JogadorComNivel[]> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('ativo', true)
    .order('nome', { ascending: true });
  if (error) throw error;

  // Fetch all avaliacoes
  const { data: avaliacoes } = await supabase
    .from('avaliacoes_nivel')
    .select('*');

  const avaliacoesData = avaliacoes || [];

  return (profiles || []).map((profile) => {
    const profileAvaliacoes = avaliacoesData.filter((a: { avaliado_id: string; nivel: number; avaliador_id: string }) => a.avaliado_id === profile.id);
    const meuVoto = avaliacoesData.find((a: { avaliador_id: string; avaliado_id: string; nivel: number }) => a.avaliador_id === userId && a.avaliado_id === profile.id);
    const nivel_medio = profileAvaliacoes.length > 0
      ? profileAvaliacoes.reduce((sum: number, a: { nivel: number }) => sum + a.nivel, 0) / profileAvaliacoes.length
      : profile.nivel;

    return {
      ...profile,
      nivel_medio,
      meu_voto: meuVoto ? meuVoto.nivel : null,
    };
  });
}

export async function votar(avaliadorId: string, avaliadoId: string, nivel: number): Promise<void> {
  const { error } = await supabase
    .from('avaliacoes_nivel')
    .upsert(
      { avaliador_id: avaliadorId, avaliado_id: avaliadoId, nivel },
      { onConflict: 'avaliado_id,avaliador_id' }
    );
  if (error) throw error;

  const { data: votos } = await supabase
    .from('avaliacoes_nivel')
    .select('nivel')
    .eq('avaliado_id', avaliadoId);

  if (votos && votos.length > 0) {
    const media = votos.reduce((s, v) => s + v.nivel, 0) / votos.length;
    const nivelArredondado = Math.min(5, Math.max(1, Math.round(media)));
    await supabase.from('profiles').update({ nivel: nivelArredondado }).eq('id', avaliadoId);
  }
}

export async function atualizarPerfil(
  userId: string,
  dados: Partial<Pick<Profile, 'nome' | 'apelido' | 'posicao' | 'telefone'>>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(dados)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchPerfil(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}
