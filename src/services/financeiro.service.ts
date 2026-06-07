import { supabase } from '@/lib/supabase/client';

export interface ResumoMensalista {
  id: string;
  nome: string;
  apelido: string | null;
  pago: boolean;
  valor: number | null;
  pagamentoId: string | null;
}

export interface ResumoJogoAvulso {
  jogoId: string;
  data: string;
  avulsos: {
    userId: string | null;
    presencaId: string;
    nome: string;
    apelido: string | null;
    isConvidado: boolean;
    pago: boolean;
    pagamentoId: string | null;
    valor: number | null;
  }[];
}

export interface ResumoJogoGoleiro {
  jogoId: string;
  data: string;
  goleiros: {
    userId: string;
    presencaId: string;
    nome: string;
    apelido: string | null;
    pago: boolean;
    pagamentoId: string | null;
    valor: number | null;
  }[];
}

export interface PagamentoHistorico {
  id: string;
  user_id: string;
  jogo_id: string | null;
  mes_referencia: string | null;
  tipo: string;
  valor: number;
  status: string;
  created_at: string;
  jogos: { data: string } | null;
}

// ── Jogador: histórico pessoal ───────────────────────────────────────────────
export async function fetchMeusPagamentos(userId: string): Promise<PagamentoHistorico[]> {
  const { data } = await supabase
    .from('pagamentos')
    .select('*, jogos(data)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  return (data ?? []) as PagamentoHistorico[];
}

// ── Admin: mensalistas ───────────────────────────────────────────────────────
export async function fetchResumoMensalistas(mes: string): Promise<ResumoMensalista[]> {
  const [{ data: mensalistas }, { data: pagamentos }] = await Promise.all([
    supabase.from('profiles').select('id, nome, apelido').eq('tipo', 'mensalista').eq('ativo', true).order('nome'),
    supabase.from('pagamentos').select('id, user_id, status, valor').eq('mes_referencia', mes).eq('tipo', 'mensalidade'),
  ]);

  return (mensalistas ?? []).map((m: any) => {
    const pag = (pagamentos ?? []).find((p: any) => p.user_id === m.id);
    return {
      id: m.id,
      nome: m.nome,
      apelido: m.apelido,
      pago: pag?.status === 'pago',
      valor: pag?.valor ?? null,
      pagamentoId: pag?.id ?? null,
    };
  });
}

export async function marcarMensalidadePaga(userId: string, mes: string, valor: number): Promise<{ error: string | null }> {
  await supabase.from('pagamentos').delete().eq('user_id', userId).eq('mes_referencia', mes).eq('tipo', 'mensalidade');
  const { error } = await supabase.from('pagamentos').insert({
    user_id: userId, mes_referencia: mes, tipo: 'mensalidade', valor, status: 'pago',
  });
  return { error: error?.message ?? null };
}

// ── Admin: avulsos por jogo ──────────────────────────────────────────────────
export async function fetchJogosComAvulsos(): Promise<ResumoJogoAvulso[]> {
  const { data: presencas } = await supabase
    .from('presencas')
    .select('id, jogo_id, user_id, convidado_nome, posicao')
    .eq('status', 'confirmado');

  if (!presencas?.length) return [];

  const presencasComUser = (presencas as any[]).filter(p => p.user_id !== null);
  const presencasConvidado = (presencas as any[]).filter(p => p.user_id === null);
  const jogoIds = [...new Set(presencas.map((p: any) => p.jogo_id))];

  let avulsoIds = new Set<string>();
  let profiles: any[] = [];
  if (presencasComUser.length) {
    const userIds = [...new Set(presencasComUser.map((p: any) => p.user_id))];
    const { data: prof } = await supabase.from('profiles').select('id, nome, apelido, tipo').in('id', userIds).eq('tipo', 'avulso');
    profiles = prof ?? [];
    avulsoIds = new Set(profiles.map((p: any) => p.id));
  }

  const { data: jogos } = await supabase.from('jogos').select('id, data').in('id', jogoIds).order('data', { ascending: false });

  const presencaIds = presencasConvidado.map((p: any) => p.id);
  const [{ data: pagAvulsos }, { data: pagConvidados }] = await Promise.all([
    supabase.from('pagamentos').select('id, user_id, jogo_id, status, valor').in('jogo_id', jogoIds).eq('tipo', 'avulso').not('user_id', 'is', null),
    presencaIds.length
      ? supabase.from('pagamentos').select('id, presenca_id, status, valor').in('presenca_id', presencaIds).eq('tipo', 'avulso')
      : Promise.resolve({ data: [] }),
  ]);

  const mapaJogos: Record<string, ResumoJogoAvulso> = {};

  function garanteJogo(jogoId: string) {
    if (!mapaJogos[jogoId]) {
      const jogo = (jogos as any[])?.find(j => j.id === jogoId);
      if (!jogo) return false;
      mapaJogos[jogoId] = { jogoId, data: jogo.data, avulsos: [] };
    }
    return true;
  }

  for (const p of presencasComUser) {
    if (!avulsoIds.has(p.user_id)) continue;
    if (!garanteJogo(p.jogo_id)) continue;
    const profile = profiles.find((pr: any) => pr.id === p.user_id);
    if (!profile) continue;
    const pag = (pagAvulsos as any[])?.find(pg => pg.user_id === p.user_id && pg.jogo_id === p.jogo_id);
    mapaJogos[p.jogo_id].avulsos.push({
      userId: p.user_id, presencaId: p.id, nome: profile.nome, apelido: profile.apelido,
      isConvidado: false, pago: pag?.status === 'pago', pagamentoId: pag?.id ?? null, valor: pag?.valor ?? null,
    });
  }

  for (const p of presencasConvidado) {
    if (!garanteJogo(p.jogo_id)) continue;
    const pag = (pagConvidados as any[])?.find(pg => pg.presenca_id === p.id);
    mapaJogos[p.jogo_id].avulsos.push({
      userId: null, presencaId: p.id, nome: p.convidado_nome ?? 'Convidado', apelido: null,
      isConvidado: true, pago: pag?.status === 'pago', pagamentoId: pag?.id ?? null, valor: pag?.valor ?? null,
    });
  }

  return Object.values(mapaJogos).filter(j => j.avulsos.length > 0).sort((a, b) => b.data.localeCompare(a.data));
}

export async function marcarAvulsoPago(params: {
  userId: string | null; jogoId: string | null; presencaId: string; valor: number;
}): Promise<{ error: string | null }> {
  const { userId, jogoId, presencaId, valor } = params;
  if (userId) {
    await supabase.from('pagamentos').delete().eq('user_id', userId).eq('jogo_id', jogoId).eq('tipo', 'avulso');
    const { error } = await supabase.from('pagamentos').insert({ user_id: userId, jogo_id: jogoId, tipo: 'avulso', valor, status: 'pago' });
    return { error: error?.message ?? null };
  } else {
    await supabase.from('pagamentos').delete().eq('presenca_id', presencaId).eq('tipo', 'avulso');
    const { error } = await supabase.from('pagamentos').insert({ presenca_id: presencaId, jogo_id: jogoId, tipo: 'avulso', valor, status: 'pago' });
    return { error: error?.message ?? null };
  }
}

export async function desmarcarPago(pagamentoId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('pagamentos').delete().eq('id', pagamentoId);
  return { error: error?.message ?? null };
}

// ── Admin: goleiros por jogo ─────────────────────────────────────────────────
export async function fetchJogosComGoleiros(): Promise<ResumoJogoGoleiro[]> {
  const { data: presencas } = await supabase
    .from('presencas').select('id, jogo_id, user_id').eq('status', 'confirmado').eq('posicao', 'goleiro').not('user_id', 'is', null);

  if (!presencas?.length) return [];

  const jogoIds = [...new Set((presencas as any[]).map(p => p.jogo_id))];
  const userIds = [...new Set((presencas as any[]).map(p => p.user_id))];

  const [{ data: jogos }, { data: profs }, { data: pagamentos }] = await Promise.all([
    supabase.from('jogos').select('id, data').in('id', jogoIds).order('data', { ascending: false }),
    supabase.from('profiles').select('id, nome, apelido').in('id', userIds),
    supabase.from('pagamentos').select('id, user_id, jogo_id, status, valor').in('jogo_id', jogoIds).eq('tipo', 'goleiro'),
  ]);

  const mapaJogos: Record<string, ResumoJogoGoleiro> = {};
  for (const p of presencas as any[]) {
    if (!mapaJogos[p.jogo_id]) {
      const jogo = (jogos as any[])?.find(j => j.id === p.jogo_id);
      if (!jogo) continue;
      mapaJogos[p.jogo_id] = { jogoId: p.jogo_id, data: jogo.data, goleiros: [] };
    }
    const profile = (profs as any[])?.find(pr => pr.id === p.user_id);
    if (!profile) continue;
    const pag = (pagamentos as any[])?.find(pg => pg.user_id === p.user_id && pg.jogo_id === p.jogo_id);
    mapaJogos[p.jogo_id].goleiros.push({
      userId: p.user_id, presencaId: p.id, nome: profile.nome, apelido: profile.apelido,
      pago: pag?.status === 'pago', pagamentoId: pag?.id ?? null, valor: pag?.valor ?? null,
    });
  }

  return Object.values(mapaJogos).filter(j => j.goleiros.length > 0).sort((a, b) => b.data.localeCompare(a.data));
}

export async function marcarGoleiroPago(params: { userId: string; jogoId: string; valor: number }): Promise<{ error: string | null }> {
  await supabase.from('pagamentos').delete().eq('user_id', params.userId).eq('jogo_id', params.jogoId).eq('tipo', 'goleiro');
  const { error } = await supabase.from('pagamentos').insert({ user_id: params.userId, jogo_id: params.jogoId, tipo: 'goleiro', valor: params.valor, status: 'pago' });
  return { error: error?.message ?? null };
}
