import { supabase } from '@/lib/supabase/client';
import { Profile, Jogo, JogoTipo, Pelada, PresencaComPerfil, UserPosicao } from '@/types/database';

export async function fetchAvulsosPendentes(jogoId: string): Promise<PresencaComPerfil[]> {
  const { data, error } = await supabase
    .from('presencas')
    .select(`
      *,
      profile:profiles!presencas_user_id_fkey(*),
      adicionado_por_profile:profiles!presencas_adicionado_por_fkey(*)
    `)
    .eq('jogo_id', jogoId)
    .eq('status', 'pendente')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as PresencaComPerfil[];
}

export async function aprovarPresenca(presencaId: string): Promise<void> {
  // Get presenca info
  const { data: presenca, error: pError } = await supabase
    .from('presencas')
    .select('*')
    .eq('id', presencaId)
    .single();
  if (pError) throw pError;

  // Check capacity
  const { data: pelada } = await supabase
    .from('peladas')
    .select('max_jogadores, max_goleiros')
    .limit(1)
    .single();

  const { data: confirmados } = await supabase
    .from('presencas')
    .select('*')
    .eq('jogo_id', presenca.jogo_id)
    .eq('status', 'confirmado')
    .eq('posicao', presenca.posicao);

  const maxForPos = presenca.posicao === 'goleiro'
    ? (pelada?.max_goleiros || 2)
    : (pelada?.max_jogadores || 16);
  const currentCount = (confirmados || []).length;

  const newStatus = currentCount < maxForPos ? 'confirmado' : 'lista_espera';

  const { error } = await supabase
    .from('presencas')
    .update({ status: newStatus })
    .eq('id', presencaId);
  if (error) throw error;
}

export async function recusarPresenca(presencaId: string): Promise<void> {
  const { error } = await supabase
    .from('presencas')
    .update({ status: 'recusado' })
    .eq('id', presencaId);
  if (error) throw error;
}

export async function criarJogo(peladaId: string, data: string, tipo: JogoTipo): Promise<Jogo> {
  const { data: jogo, error } = await supabase
    .from('jogos')
    .insert({ pelada_id: peladaId, data, tipo, status: 'aberto' })
    .select()
    .single();
  if (error) throw error;
  return jogo;
}

export async function atualizarPelada(peladaId: string, dados: Partial<Pelada>): Promise<Pelada> {
  const { data, error } = await supabase
    .from('peladas')
    .update({ ...dados, updated_at: new Date().toISOString() })
    .eq('id', peladaId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchTodosJogadores(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('nome', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function atualizarJogador(
  userId: string,
  dados: Partial<Pick<Profile, 'tipo' | 'nivel' | 'ativo' | 'posicao' | 'is_admin'>>
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

export interface CadastrarAvulsoData {
  nome: string;
  apelido?: string;
  telefone?: string;
  posicao: UserPosicao;
  email?: string;
}

export interface ConvidarJogadorData {
  email: string;
  nome: string;
  apelido?: string;
  telefone?: string;
  posicao: UserPosicao;
}

export async function convidarJogador(dados: ConvidarJogadorData): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const res = await fetch('/api/admin/convidar-jogador', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(dados),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Erro ao enviar convite');
}

export async function cadastrarAvulso(dados: CadastrarAvulsoData): Promise<Profile> {
  const id = crypto.randomUUID();
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id,
      nome: dados.nome,
      apelido: dados.apelido || null,
      telefone: dados.telefone || null,
      posicao: dados.posicao,
      tipo: 'avulso',
      nivel: 3,
      is_admin: false,
      ativo: true,
      push_token: null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchJogosDisponiveis(): Promise<Jogo[]> {
  const quarentaCincoDiasAtras = new Date();
  quarentaCincoDiasAtras.setDate(quarentaCincoDiasAtras.getDate() - 45);
  const dataLimite = quarentaCincoDiasAtras.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('jogos')
    .select('*')
    .gte('data', dataLimite)
    .order('data', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function adicionarAvulsoAoJogo(
  userId: string,
  jogoId: string,
  posicao: UserPosicao
): Promise<void> {
  const { error } = await supabase
    .from('presencas')
    .insert({
      jogo_id: jogoId,
      user_id: userId,
      status: 'confirmado',
      posicao,
    });
  if (error) throw error;
}

export async function adicionarConvidadoComPerfil(
  jogoId: string,
  nome: string,
  posicao: UserPosicao
): Promise<void> {
  const id = crypto.randomUUID();
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id, nome, posicao, tipo: 'avulso', nivel: 3, is_admin: false, ativo: true, push_token: null });
  if (profileError) throw new Error(profileError.message);

  const { error: presencaError } = await supabase
    .from('presencas')
    .insert({ jogo_id: jogoId, user_id: id, status: 'confirmado', posicao });
  if (presencaError) throw new Error(presencaError.message);
}

export async function fetchHistoricoAvulso(userId: string) {
  const { data, error } = await supabase
    .from('presencas')
    .select(`*, jogo:jogos(*)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchPendentesAllJogos(): Promise<{ jogoId: string; count: number }[]> {
  const { data, error } = await supabase
    .from('presencas')
    .select('jogo_id')
    .eq('status', 'pendente');
  if (error) throw error;

  const counts: Record<string, number> = {};
  (data || []).forEach((p) => {
    counts[p.jogo_id] = (counts[p.jogo_id] || 0) + 1;
  });

  return Object.entries(counts).map(([jogoId, count]) => ({ jogoId, count }));
}
