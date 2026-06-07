import { supabase } from '@/lib/supabase/client';
import { Presenca, PresencaComPerfil, PresencaStatus, UserPosicao, UserTipo } from '@/types/database';

export async function fetchPresencas(jogoId: string): Promise<PresencaComPerfil[]> {
  const { data, error } = await supabase
    .from('presencas')
    .select(`
      *,
      profile:profiles!presencas_user_id_fkey(*),
      adicionado_por_profile:profiles!presencas_adicionado_por_fkey(*)
    `)
    .eq('jogo_id', jogoId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as PresencaComPerfil[];
}

export async function fetchMinhaPresenca(jogoId: string, userId: string): Promise<Presenca | null> {
  const { data, error } = await supabase
    .from('presencas')
    .select('*')
    .eq('jogo_id', jogoId)
    .eq('user_id', userId)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function confirmarPresenca(
  jogoId: string,
  userId: string,
  posicao: UserPosicao,
  tipo: UserTipo,
  maxLinha: number,
  maxGoleiros: number
): Promise<Presenca> {
  // Count current confirmed players
  const { data: presencas } = await supabase
    .from('presencas')
    .select('*')
    .eq('jogo_id', jogoId)
    .in('status', ['confirmado']);

  const confirmedLinha = (presencas || []).filter(p => p.posicao === 'linha').length;
  const confirmedGoleiros = (presencas || []).filter(p => p.posicao === 'goleiro').length;

  let status: PresencaStatus;

  if (tipo === 'avulso') {
    status = 'pendente';
  } else {
    // mensalista - auto confirm or waitlist
    if (posicao === 'goleiro') {
      status = confirmedGoleiros < maxGoleiros ? 'confirmado' : 'lista_espera';
    } else {
      status = confirmedLinha < maxLinha ? 'confirmado' : 'lista_espera';
    }
  }

  const { data, error } = await supabase
    .from('presencas')
    .insert({
      jogo_id: jogoId,
      user_id: userId,
      status,
      posicao,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function cancelarPresenca(presencaId: string): Promise<void> {
  // Get presenca info first
  const { data: presenca } = await supabase
    .from('presencas')
    .select('*')
    .eq('id', presencaId)
    .single();

  const { error } = await supabase
    .from('presencas')
    .delete()
    .eq('id', presencaId);
  if (error) throw error;

  // Promote from waitlist if was confirmed
  if (presenca && presenca.status === 'confirmado') {
    const { data: waitlist } = await supabase
      .from('presencas')
      .select('*')
      .eq('jogo_id', presenca.jogo_id)
      .eq('status', 'lista_espera')
      .eq('posicao', presenca.posicao)
      .order('created_at', { ascending: true })
      .limit(1);

    if (waitlist && waitlist.length > 0) {
      await supabase
        .from('presencas')
        .update({ status: 'confirmado' })
        .eq('id', waitlist[0].id);
    }
  }
}

export async function adicionarConvidado(
  jogoId: string,
  adicionadoPor: string,
  nome: string,
  posicao: UserPosicao
): Promise<Presenca> {
  const { data, error } = await supabase
    .from('presencas')
    .insert({
      jogo_id: jogoId,
      adicionado_por: adicionadoPor,
      convidado_nome: nome,
      status: 'pendente',
      posicao,
      user_id: null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function marcarChegou(presencaId: string, chegou: boolean): Promise<void> {
  const { error } = await supabase
    .from('presencas')
    .update({ chegou })
    .eq('id', presencaId);
  if (error) throw error;
}

export async function atualizarStatusPresenca(presencaId: string, status: PresencaStatus): Promise<void> {
  const { error } = await supabase
    .from('presencas')
    .update({ status })
    .eq('id', presencaId);
  if (error) throw error;
}
