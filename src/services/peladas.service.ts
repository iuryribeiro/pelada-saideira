import { supabase } from '@/lib/supabase/client';
import { Pelada, Jogo } from '@/types/database';

export async function fetchPelada(): Promise<Pelada | null> {
  const { data, error } = await supabase
    .from('peladas')
    .select('*')
    .limit(1)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function fetchProximoJogo(): Promise<Jogo | null> {
  const hoje = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('jogos')
    .select('*')
    .eq('status', 'aberto')
    .gte('data', hoje)
    .order('data', { ascending: true })
    .limit(1)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function fetchJogosRecentes(limite = 10): Promise<Jogo[]> {
  const { data, error } = await supabase
    .from('jogos')
    .select('*')
    .order('data', { ascending: false })
    .limit(limite);
  if (error) throw error;
  return data || [];
}
