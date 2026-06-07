'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { usePelada } from '@/hooks/usePelada';
import {
  useMeusPagamentos, useResumoMensalistas, useJogosComAvulsos,
  useMarcarMensalidadePaga, useMarcarAvulsoPago,
  useJogosComGoleiros, useMarcarGoleiroPago,
} from '@/hooks/useFinanceiro';
import { Spinner } from '@/components/ui/Spinner';
import { ResumoJogoAvulso } from '@/services/financeiro.service';

type Aba = 'mensalistas' | 'avulsos' | 'goleiros' | 'total';

// ── helpers ──────────────────────────────────────────────────────────────────
function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function mesLabel(mes: string) {
  const [ano, m] = mes.split('-');
  const nomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  return `${nomes[parseInt(m) - 1]} ${ano}`;
}
function mesAnterior(mes: string) {
  const [ano, m] = mes.split('-').map(Number);
  const d = new Date(ano, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function mesProximo(mes: string) {
  const [ano, m] = mes.split('-').map(Number);
  const d = new Date(ano, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function dataLabel(data: string) {
  return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });
}
function fmt(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ── Stats mini cards ──────────────────────────────────────────────────────────
function StatsRow({ pagos, pendentes }: { pagos: number; pendentes: number }) {
  return (
    <div className="flex gap-3">
      <div className="flex-1 bg-white border-2 border-green-400 rounded-xl p-3 flex flex-col items-center gap-1">
        <span className="text-xl font-bold text-green-600">{pagos}</span>
        <span className="text-xs text-gray-400">Pagos</span>
      </div>
      <div className="flex-1 bg-white border-2 border-orange-400 rounded-xl p-3 flex flex-col items-center gap-1">
        <span className="text-xl font-bold text-orange-500">{pendentes}</span>
        <span className="text-xs text-gray-400">Pendentes</span>
      </div>
    </div>
  );
}

// ── Arrecadado row ────────────────────────────────────────────────────────────
function ArrCard({ label, valor, cor }: { label: string; valor: string; cor: string }) {
  return (
    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className={`text-base font-bold ${cor}`}>{valor}</span>
    </div>
  );
}

// ── Nav de mês ────────────────────────────────────────────────────────────────
function MesNav({ mes, onChange }: { mes: string; onChange: (m: string) => void }) {
  const isAtual = mes >= mesAtual();
  return (
    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-2.5">
      <button onClick={() => onChange(mesAnterior(mes))} className="p-1 text-xl font-bold text-green-600 hover:bg-gray-100 rounded-lg">‹</button>
      <span className="font-bold text-gray-800 text-sm">{mesLabel(mes)}</span>
      <button onClick={() => onChange(mesProximo(mes))} disabled={isAtual} className="p-1 text-xl font-bold text-green-600 disabled:text-gray-300 hover:bg-gray-100 rounded-lg">›</button>
    </div>
  );
}

// ── Jogo card (avulsos / goleiros) ────────────────────────────────────────────
function JogoCard({ title, pagos, total, dataStr, aberto, onToggle, children }: {
  title: string; pagos: number; total: number; dataStr: string; aberto: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  const todos = pagos === total;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors">
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-sm">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{dataStr}</p>
        </div>
        <div className={`rounded-lg px-2.5 py-1 text-xs font-bold ${todos ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-500'}`}>
          {todos ? '✓ Todos' : `${total - pagos} pendente${total - pagos > 1 ? 's' : ''}`}
        </div>
        <span className="text-xs text-gray-400">{aberto ? '▲' : '▼'}</span>
      </button>
      {aberto && <div className="border-t border-gray-100">{children}</div>}
    </div>
  );
}

// ── Jogador row dentro do card ────────────────────────────────────────────────
function JogadorRow({ nome, valor, pago, convidado, onPagar, loading }: {
  nome: string; valor: string; pago: boolean; convidado?: boolean; onPagar: () => void; loading: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-50">
      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-green-700">{nome.charAt(0).toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">
          {nome}{convidado && <span className="text-gray-400 font-normal text-xs"> · convidado</span>}
        </p>
        <p className="text-xs text-gray-400">{valor}</p>
      </div>
      {pago ? (
        <span className="bg-green-100 text-green-600 text-xs font-bold px-3 py-1 rounded-lg">✓ Pago</span>
      ) : (
        <button onClick={onPagar} disabled={loading} className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
          Marcar pago
        </button>
      )}
    </div>
  );
}

// ── Tela do jogador ──────────────────────────────────────────────────────────
function MinhaFinanceiroView({ userId }: { userId: string }) {
  const { data: pelada } = usePelada();
  const { profile } = useAuthStore();
  const { data: pagamentos = [], isLoading } = useMeusPagamentos(userId);

  const pagos    = pagamentos.filter(p => p.status === 'pago').length;
  const pendentes = pagamentos.filter(p => p.status === 'pendente').length;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>

      {pelada && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Seu plano</p>
          <p className="text-base font-bold text-gray-900">
            {profile?.tipo === 'mensalista' ? '📅 Mensalista' : '🎯 Avulso'}
          </p>
          <p className="text-2xl font-bold text-green-700">
            {profile?.tipo === 'mensalista'
              ? `${fmt(pelada.valor_mensalista)} / mês`
              : `${fmt(pelada.valor_avulso)} / jogo`}
          </p>
        </div>
      )}

      {pagamentos.length > 0 && <StatsRow pagos={pagos} pendentes={pendentes} />}

      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Histórico</p>

      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : pagamentos.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">Nenhum pagamento registrado ainda.</div>
      ) : pagamentos.map(pag => (
        <div key={pag.id} className="flex items-center bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">
              {pag.tipo === 'mensalidade' ? '📅 Mensalidade' : '🎯 Avulso'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {pag.mes_referencia
                ? mesLabel(pag.mes_referencia)
                : pag.jogos?.data
                ? dataLabel(pag.jogos.data)
                : '—'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="font-bold text-gray-900 text-sm">{fmt(pag.valor)}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${pag.status === 'pago' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-500'}`}>
              {pag.status === 'pago' ? '✓ Pago' : 'Pendente'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Aba mensalistas ───────────────────────────────────────────────────────────
function MensalistasTab() {
  const [mes, setMes] = useState(mesAtual());
  const { data: pelada } = usePelada();
  const { data: mensalistas = [], isLoading } = useResumoMensalistas(mes);
  const marcarMutation = useMarcarMensalidadePaga(mes);

  const pagos    = mensalistas.filter(m => m.pago).length;
  const pendentes = mensalistas.filter(m => !m.pago).length;

  function confirmar(jogador: typeof mensalistas[0]) {
    const valor = pelada?.valor_mensalista ?? 0;
    if (!confirm(`Registrar mensalidade de ${jogador.apelido ?? jogador.nome}?\n${fmt(valor)}`)) return;
    marcarMutation.mutate({ userId: jogador.id, valor });
  }

  return (
    <div className="space-y-3">
      <MesNav mes={mes} onChange={setMes} />

      {mensalistas.length > 0 && (
        <>
          <StatsRow pagos={pagos} pendentes={pendentes} />
          <ArrCard label="Arrecadado" valor={fmt(pagos * (pelada?.valor_mensalista ?? 0))} cor="text-green-600" />
        </>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : mensalistas.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">Nenhum mensalista cadastrado.</div>
      ) : mensalistas.map(jogador => (
        <div key={jogador.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3.5">
          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-green-700">
              {(jogador.apelido ?? jogador.nome).charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{jogador.apelido ?? jogador.nome}</p>
            {pelada && <p className="text-xs text-gray-400">{fmt(pelada.valor_mensalista)}</p>}
          </div>
          {jogador.pago ? (
            <span className="bg-green-100 text-green-600 text-xs font-bold px-3 py-1 rounded-lg">✓ Pago</span>
          ) : (
            <button onClick={() => confirmar(jogador)} disabled={marcarMutation.isPending}
              className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
              Marcar pago
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Aba avulsos ───────────────────────────────────────────────────────────────
function AvulsosTab() {
  const { data: pelada } = usePelada();
  const { data: jogos = [], isLoading } = useJogosComAvulsos();
  const [jogoAberto, setJogoAberto] = useState<string | null>(null);
  const marcarMutation = useMarcarAvulsoPago();

  const valorAvulso = pelada?.valor_avulso ?? 0;
  const totalPagos      = jogos.reduce((s, j) => s + j.avulsos.filter(a => a.pago).length, 0);
  const totalPendentes  = jogos.reduce((s, j) => s + j.avulsos.filter(a => !a.pago).length, 0);
  const totalArrecadado = jogos.reduce((s, j) => s + j.avulsos.filter(a => a.pago).reduce((sub, a) => sub + (a.valor ?? valorAvulso), 0), 0);

  function confirmarPagamento(avulso: ResumoJogoAvulso['avulsos'][0], jogoId: string) {
    const label = avulso.isConvidado ? `${avulso.nome} (convidado)` : (avulso.apelido ?? avulso.nome);
    if (!confirm(`Registrar pagamento de ${label}?\n${fmt(valorAvulso)}`)) return;
    marcarMutation.mutate({ userId: avulso.userId, jogoId, presencaId: avulso.presencaId, valor: valorAvulso });
  }

  return (
    <div className="space-y-3">
      {jogos.length > 0 && (
        <>
          <StatsRow pagos={totalPagos} pendentes={totalPendentes} />
          <ArrCard label="Arrecadado" valor={fmt(totalArrecadado)} cor="text-green-600" />
        </>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : jogos.length === 0 ? (
        <div className="flex flex-col items-center py-10 gap-2">
          <span className="text-5xl">🎯</span>
          <p className="text-gray-400 text-sm">Nenhum avulso confirmado em jogos ainda.</p>
        </div>
      ) : jogos.map((jogo: ResumoJogoAvulso) => {
        const pagosJogo = jogo.avulsos.filter(a => a.pago).length;
        const totalJogo = jogo.avulsos.length;
        const arrecadado = jogo.avulsos.filter(a => a.pago).reduce((s, a) => s + (a.valor ?? valorAvulso), 0);
        return (
          <JogoCard
            key={jogo.jogoId}
            title={`${pagosJogo}/${totalJogo} pagos · ${fmt(arrecadado)} arrecadado`}
            pagos={pagosJogo} total={totalJogo}
            dataStr={dataLabel(jogo.data)}
            aberto={jogoAberto === jogo.jogoId}
            onToggle={() => setJogoAberto(jogoAberto === jogo.jogoId ? null : jogo.jogoId)}
          >
            {jogo.avulsos.map(avulso => (
              <JogadorRow
                key={avulso.presencaId}
                nome={avulso.apelido ?? avulso.nome}
                valor={fmt(valorAvulso)}
                pago={avulso.pago}
                convidado={avulso.isConvidado}
                loading={marcarMutation.isPending}
                onPagar={() => confirmarPagamento(avulso, jogo.jogoId)}
              />
            ))}
          </JogoCard>
        );
      })}
    </div>
  );
}

// ── Aba goleiros ──────────────────────────────────────────────────────────────
function GoleirosTab() {
  const { data: pelada } = usePelada();
  const { data: jogos = [], isLoading } = useJogosComGoleiros();
  const marcarMutation = useMarcarGoleiroPago();
  const [jogoAberto, setJogoAberto] = useState<string | null>(null);

  const valorGoleiro   = pelada?.valor_goleiro ?? 50;
  const totalPagos     = jogos.reduce((s, j) => s + j.goleiros.filter(g => g.pago).length, 0);
  const totalPendentes = jogos.reduce((s, j) => s + j.goleiros.filter(g => !g.pago).length, 0);
  const totalPago      = jogos.reduce((s, j) => s + j.goleiros.filter(g => g.pago).reduce((sub, g) => sub + (g.valor ?? valorGoleiro), 0), 0);

  function confirmarPagamento(goleiro: { userId: string; nome: string; apelido: string | null }, jogoId: string) {
    if (!confirm(`Pagar ${goleiro.apelido ?? goleiro.nome}?\n${fmt(valorGoleiro)}`)) return;
    marcarMutation.mutate({ userId: goleiro.userId, jogoId, valor: valorGoleiro });
  }

  return (
    <div className="space-y-3">
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
        <p className="text-sm font-medium text-green-700">🧤 Goleiros recebem {fmt(valorGoleiro)} por jogo</p>
      </div>

      {jogos.length > 0 && (
        <>
          <StatsRow pagos={totalPagos} pendentes={totalPendentes} />
          <ArrCard label="Total pago aos goleiros" valor={fmt(totalPago)} cor="text-red-500" />
        </>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : jogos.length === 0 ? (
        <div className="flex flex-col items-center py-10 gap-2">
          <span className="text-5xl">🧤</span>
          <p className="text-gray-400 text-sm">Nenhum goleiro confirmado ainda.</p>
        </div>
      ) : jogos.map(jogo => {
        const pagosJogo = jogo.goleiros.filter(g => g.pago).length;
        const totalJogo = jogo.goleiros.length;
        return (
          <JogoCard
            key={jogo.jogoId}
            title={`${pagosJogo}/${totalJogo} pagos · ${fmt(pagosJogo * valorGoleiro)} pagos`}
            pagos={pagosJogo} total={totalJogo}
            dataStr={dataLabel(jogo.data)}
            aberto={jogoAberto === jogo.jogoId}
            onToggle={() => setJogoAberto(jogoAberto === jogo.jogoId ? null : jogo.jogoId)}
          >
            {jogo.goleiros.map(goleiro => (
              <JogadorRow
                key={goleiro.presencaId}
                nome={goleiro.apelido ?? goleiro.nome}
                valor={fmt(valorGoleiro)}
                pago={goleiro.pago}
                loading={marcarMutation.isPending}
                onPagar={() => confirmarPagamento(goleiro, jogo.jogoId)}
              />
            ))}
          </JogoCard>
        );
      })}
    </div>
  );
}

// ── Aba total ─────────────────────────────────────────────────────────────────
function TotalTab() {
  const [mes, setMes] = useState(mesAtual());
  const { data: pelada } = usePelada();
  const { data: mensalistas = [], isLoading: loadMens }    = useResumoMensalistas(mes);
  const { data: jogos = [],       isLoading: loadAvulsos } = useJogosComAvulsos();
  const { data: jogosGol = [],    isLoading: loadGol }     = useJogosComGoleiros();

  const valorMens    = pelada?.valor_mensalista ?? 0;
  const valorAvulso  = pelada?.valor_avulso ?? 0;
  const valorGoleiro = pelada?.valor_goleiro ?? 50;

  const mensPagos      = mensalistas.filter(m => m.pago).length;
  const mensPendentes  = mensalistas.filter(m => !m.pago).length;
  const mensArr        = mensalistas.filter(m => m.pago).reduce((s, m) => s + (m.valor ?? valorMens), 0);
  const mensPendVal    = mensPendentes * valorMens;

  const avulsosPagos  = jogos.reduce((s, j) => s + j.avulsos.filter(a => a.pago).length, 0);
  const avulsosPend   = jogos.reduce((s, j) => s + j.avulsos.filter(a => !a.pago).length, 0);
  const avulsosArr    = jogos.reduce((s, j) => s + j.avulsos.filter(a => a.pago).reduce((sub, a) => sub + (a.valor ?? valorAvulso), 0), 0);
  const avulsosPendVal = avulsosPend * valorAvulso;

  const golPagos    = jogosGol.reduce((s, j) => s + j.goleiros.filter(g => g.pago).length, 0);
  const golPend     = jogosGol.reduce((s, j) => s + j.goleiros.filter(g => !g.pago).length, 0);
  const golGasto    = jogosGol.reduce((s, j) => s + j.goleiros.filter(g => g.pago).reduce((sub, g) => sub + (g.valor ?? valorGoleiro), 0), 0);
  const golPendVal  = golPend * valorGoleiro;

  const totalArr     = mensArr + avulsosArr;
  const totalPend    = mensPendVal + avulsosPendVal;
  const saldoLiquido = totalArr - golGasto;
  const isLoading    = loadMens || loadAvulsos || loadGol;

  if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <MesNav mes={mes} onChange={setMes} />

      {/* Saldo geral */}
      <div className="bg-green-700 rounded-2xl p-5 space-y-3">
        <p className="text-xs font-bold text-white/70 uppercase tracking-wide">Saldo do período</p>
        <div className="flex justify-around items-center">
          <div className="text-center">
            <p className="text-xl font-bold text-white">{fmt(totalArr)}</p>
            <p className="text-xs text-white/60">Arrecadado</p>
          </div>
          <div className="w-px h-10 bg-white/30" />
          <div className="text-center">
            <p className="text-xl font-bold text-orange-300">-{fmt(golGasto)}</p>
            <p className="text-xs text-white/60">Goleiros</p>
          </div>
          <div className="w-px h-10 bg-white/30" />
          <div className="text-center">
            <p className={`text-xl font-bold ${saldoLiquido >= 0 ? 'text-green-200' : 'text-red-300'}`}>{fmt(saldoLiquido)}</p>
            <p className="text-xs text-white/60">Líquido</p>
          </div>
        </div>
        {totalPend > 0 && (
          <p className="text-xs text-yellow-300 text-center">⚠ {fmt(totalPend)} ainda a receber</p>
        )}
      </div>

      {/* Mensalistas */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <p className="font-bold text-gray-900">📅 Mensalistas — {mesLabel(mes)}</p>
        <StatsRow pagos={mensPagos} pendentes={mensPendentes} />
        <ArrCard label="Arrecadado" valor={fmt(mensArr)} cor="text-green-600" />
        {mensPendentes > 0 && <p className="text-sm text-orange-500 font-medium">⚠ {fmt(mensPendVal)} pendentes</p>}
      </div>

      {/* Avulsos */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <p className="font-bold text-gray-900">🎯 Avulsos — todos os jogos</p>
        <StatsRow pagos={avulsosPagos} pendentes={avulsosPend} />
        <ArrCard label="Arrecadado" valor={fmt(avulsosArr)} cor="text-green-600" />
        {avulsosPend > 0 && <p className="text-sm text-orange-500 font-medium">⚠ {fmt(avulsosPendVal)} pendentes</p>}
      </div>

      {/* Goleiros (despesa) */}
      <div className="bg-white border border-orange-200 rounded-2xl p-4 space-y-3">
        <p className="font-bold text-gray-900">🧤 Goleiros — despesa</p>
        <div className="flex gap-3">
          <div className="flex-1 bg-white border-2 border-green-400 rounded-xl p-3 flex flex-col items-center gap-1">
            <span className="text-xl font-bold text-green-600">{golPagos}</span>
            <span className="text-xs text-gray-400">Pagos</span>
          </div>
          <div className="flex-1 bg-white border-2 border-orange-400 rounded-xl p-3 flex flex-col items-center gap-1">
            <span className="text-xl font-bold text-orange-500">{golPend}</span>
            <span className="text-xs text-gray-400">A pagar</span>
          </div>
        </div>
        <ArrCard label="Total gasto" valor={fmt(golGasto)} cor="text-red-500" />
        {golPend > 0 && <p className="text-sm text-orange-500 font-medium">⚠ {fmt(golPendVal)} a pagar</p>}
      </div>
    </div>
  );
}

// ── Admin view ────────────────────────────────────────────────────────────────
function AdminFinanceiroView() {
  const [aba, setAba] = useState<Aba>('mensalistas');
  const { data: jogos = [] }          = useJogosComAvulsos();
  const { data: mensalistas = [] }    = useResumoMensalistas(mesAtual());
  const { data: jogosGoleiros = [] }  = useJogosComGoleiros();

  const pendMens    = mensalistas.filter(m => !m.pago).length;
  const pendAvulsos = jogos.reduce((acc, j) => acc + j.avulsos.filter(a => !a.pago).length, 0);
  const pendGol     = jogosGoleiros.reduce((acc, j) => acc + j.goleiros.filter(g => !g.pago).length, 0);

  const tabs: { key: Aba; label: string }[] = [
    { key: 'mensalistas', label: `📅${pendMens > 0    ? ` (${pendMens})`    : ' Mens.'}` },
    { key: 'avulsos',     label: `🎯${pendAvulsos > 0 ? ` (${pendAvulsos})` : ' Avul.'}` },
    { key: 'goleiros',    label: `🧤${pendGol > 0     ? ` (${pendGol})`     : ' Gol.'}` },
    { key: 'total',       label: '📊 Total' },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>

      {/* Abas */}
      <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setAba(t.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
              aba === t.key ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {aba === 'mensalistas' && <MensalistasTab />}
      {aba === 'avulsos'     && <AvulsosTab />}
      {aba === 'goleiros'    && <GoleirosTab />}
      {aba === 'total'       && <TotalTab />}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function FinanceiroPage() {
  const { profile } = useAuthStore();
  const isAdmin = profile?.is_admin ?? false;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 px-4 pt-8 pb-5">
        <p className="text-green-200 text-sm">
          {isAdmin ? 'Gestão de pagamentos' : 'Meus pagamentos'}
        </p>
      </div>
      <div className="px-4 py-4 pb-24">
        {isAdmin
          ? <AdminFinanceiroView />
          : <MinhaFinanceiroView userId={profile?.id ?? ''} />}
      </div>
    </div>
  );
}
