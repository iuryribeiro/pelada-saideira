'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePresencas } from '@/hooks/usePresencas';
import { useProximoJogo } from '@/hooks/usePelada';
import { marcarChegou } from '@/services/presencas.service';
import { PresencaComPerfil } from '@/types/database';
import { ArrowLeft } from 'lucide-react';

const NIVEL_LABELS: Record<number, string> = {
  1: 'Perna de Pau', 2: 'Iniciante', 3: 'Mediano', 4: 'Bom', 5: 'Craque',
};
const MIN_LINHAS   = 10;
const MIN_GOLEIROS = 2;
const POR_TIME     = 5;

type Time = { nome: string; jogadores: PresencaComPerfil[]; isFora?: boolean };

function nomeJogador(p: PresencaComPerfil) {
  if (p.user_id === null) return p.convidado_nome ?? 'Convidado';
  return p.profile?.apelido ?? p.profile?.nome ?? '?';
}
function nivelJogador(p: PresencaComPerfil) { return p.profile?.nivel ?? 3; }
function posicaoJogador(p: PresencaComPerfil): 'goleiro' | 'linha' {
  return (p.profile?.posicao ?? p.posicao) === 'goleiro' ? 'goleiro' : 'linha';
}

export default function SorteioTimesPage() {
  const router = useRouter();
  const { data: jogo } = useProximoJogo();
  const { data: presencas = [] } = usePresencas(jogo?.id ?? '');

  const [times, setTimes]       = useState<Time[]>([]);
  const [sorteado, setSorteado] = useState(false);
  const [chegouIds, setChegouIds] = useState<Set<string>>(new Set());
  const inicializado = useRef(false);

  useEffect(() => {
    if (presencas.length > 0 && !inicializado.current) {
      setChegouIds(new Set(presencas.filter(p => p.chegou).map(p => p.id)));
      inicializado.current = true;
    }
  }, [presencas]);

  const confirmados      = presencas.filter(p => p.status === 'confirmado');
  const chegaram         = confirmados.filter(p => chegouIds.has(p.id));
  const linhasChegaram   = chegaram.filter(p => posicaoJogador(p) === 'linha');
  const goleirosChegaram = chegaram.filter(p => posicaoJogador(p) === 'goleiro');
  const podeSortear      = linhasChegaram.length >= MIN_LINHAS && goleirosChegaram.length >= MIN_GOLEIROS;

  function toggleChegou(p: PresencaComPerfil) {
    const novo = !chegouIds.has(p.id);
    setChegouIds(prev => {
      const next = new Set(prev);
      novo ? next.add(p.id) : next.delete(p.id);
      return next;
    });
    marcarChegou(p.id, novo).catch(() => {
      setChegouIds(prev => {
        const next = new Set(prev);
        !novo ? next.add(p.id) : next.delete(p.id);
        return next;
      });
    });
  }

  function sortear() {
    // Shuffle randomly first so Fora isn't always the weakest players
    const embaralhado = [...linhasChegaram].sort(() => Math.random() - 0.5);
    const jogando = embaralhado.slice(0, POR_TIME * 2);
    const foraL   = embaralhado.slice(POR_TIME * 2);

    // Sort only the playing players by skill for balanced snake draft
    const sorted = [...jogando].sort((a, b) => nivelJogador(b) - nivelJogador(a));
    const timeAL: PresencaComPerfil[] = [];
    const timeBL: PresencaComPerfil[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const round = Math.floor(i / 2);
      const pos   = i % 2;
      const toA   = round % 2 === 0 ? pos === 0 : pos === 1;
      (toA ? timeAL : timeBL).push(sorted[i]);
    }

    const golShuffle = [...goleirosChegaram].sort(() => Math.random() - 0.5);
    const foraGols   = golShuffle.slice(2);

    const ts: Time[] = [
      { nome: 'Time A', jogadores: [golShuffle[0], ...timeAL] },
      { nome: 'Time B', jogadores: [golShuffle[1], ...timeBL] },
    ];
    const fora = [...foraGols, ...foraL];
    if (fora.length > 0) ts.push({ nome: 'Fora', jogadores: fora, isFora: true });

    setTimes(ts);
    setSorteado(true);
  }

  function mediaLinhas(js: PresencaComPerfil[]) {
    const l = js.filter(j => posicaoJogador(j) === 'linha');
    return l.length ? (l.reduce((s, j) => s + nivelJogador(j), 0) / l.length).toFixed(1) : '—';
  }

  const faltaL = Math.max(0, MIN_LINHAS   - linhasChegaram.length);
  const faltaG = Math.max(0, MIN_GOLEIROS - goleirosChegaram.length);
  const golConf = confirmados.filter(p => posicaoJogador(p) === 'goleiro');
  const linConf = confirmados.filter(p => posicaoJogador(p) === 'linha');

  const CheckIcon = ({ on }: { on: boolean }) => (
    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${on ? 'bg-green-600 border-green-600' : 'border-gray-300'}`}>
      {on && <span className="text-white text-xs font-bold">✓</span>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 px-4 pt-8 pb-5 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 bg-white/20 rounded-full hover:bg-white/30">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-xl font-bold text-white">Sorteio de Times</h1>
      </div>

      <div className="px-4 py-4 space-y-4 pb-16">
        {!jogo ? (
          <div className="flex flex-col items-center pt-16 gap-3">
            <span className="text-6xl">⚽</span>
            <p className="text-gray-500">Nenhuma pelada aberta.</p>
          </div>

        ) : !sorteado ? (
          <>
            {/* Resumo de chegados */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-1">
              <div className="flex justify-around">
                <span className="text-sm font-medium text-green-700">
                  ⚽ {linhasChegaram.length} linha{linhasChegaram.length !== 1 ? 's' : ''}
                  {faltaL > 0 && <span className="text-orange-500 font-bold"> (falta {faltaL})</span>}
                </span>
                <span className="text-sm font-medium text-green-700">
                  🧤 {goleirosChegaram.length} goleiro{goleirosChegaram.length !== 1 ? 's' : ''}
                  {faltaG > 0 && <span className="text-orange-500 font-bold"> (falta {faltaG})</span>}
                </span>
              </div>
              {podeSortear && linhasChegaram.length > MIN_LINHAS && (
                <p className="text-xs text-gray-500 text-center italic">
                  {linhasChegaram.length - MIN_LINHAS} jogador{linhasChegaram.length - MIN_LINHAS !== 1 ? 'es' : ''} irá para o time Fora
                </p>
              )}
              {podeSortear && goleirosChegaram.length > MIN_GOLEIROS && (
                <p className="text-xs text-gray-500 text-center italic">
                  {goleirosChegaram.length - MIN_GOLEIROS} goleiro{goleirosChegaram.length - MIN_GOLEIROS !== 1 ? 's' : ''} irá para o time Fora
                </p>
              )}
            </div>

            <h2 className="font-bold text-gray-800">Marcar quem chegou</h2>

            {/* Goleiros */}
            {golConf.length > 0 && (
              <>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">🧤 Goleiros</p>
                <div className="space-y-2">
                  {golConf.map(p => (
                    <button key={p.id} onClick={() => toggleChegou(p)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${chegouIds.has(p.id) ? 'bg-green-50 border-green-400' : 'bg-purple-50 border-purple-300'}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{nomeJogador(p)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{NIVEL_LABELS[nivelJogador(p)]} · 🧤 Goleiro</p>
                      </div>
                      <CheckIcon on={chegouIds.has(p.id)} />
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Linhas */}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">⚽ Jogadores de linha</p>
            <div className="space-y-2">
              {linConf.map(p => (
                <button key={p.id} onClick={() => toggleChegou(p)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${chegouIds.has(p.id) ? 'bg-green-50 border-green-400' : 'bg-white border-gray-200'}`}
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{nomeJogador(p)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{NIVEL_LABELS[nivelJogador(p)]}</p>
                  </div>
                  <CheckIcon on={chegouIds.has(p.id)} />
                </button>
              ))}
            </div>

            <button onClick={sortear} disabled={!podeSortear}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-40 transition-colors mt-2"
            >
              {podeSortear
                ? `🎲 Sortear (${linhasChegaram.length} linhas + ${goleirosChegaram.length} goleiros)`
                : `🎲 Sortear — mínimo ${MIN_LINHAS} linhas + ${MIN_GOLEIROS} goleiros`}
            </button>
          </>

        ) : (
          <>
            <h2 className="font-bold text-gray-800">Times sorteados</h2>

            {times.map(time => {
              const gols  = time.jogadores.filter(j => posicaoJogador(j) === 'goleiro');
              const lins  = time.jogadores.filter(j => posicaoJogador(j) === 'linha');
              return (
                <div key={time.nome} className={`rounded-2xl border overflow-hidden ${time.isFora ? 'border-gray-300 opacity-85' : 'border-gray-100'}`}>
                  <div className={`flex items-center justify-between px-4 py-3 ${time.isFora ? 'bg-slate-500' : 'bg-green-600'}`}>
                    <div>
                      <p className="text-white font-bold text-base">{time.nome}</p>
                      <p className={`text-xs mt-0.5 ${time.isFora ? 'text-slate-200' : 'text-green-100'}`}>
                        {time.isFora ? 'Aguardando próxima rodada' : `⭐ média ${mediaLinhas(time.jogadores)}`}
                      </p>
                    </div>
                    <span className="text-white text-xs opacity-85">
                      {lins.length} linha{lins.length !== 1 ? 's' : ''}
                      {gols.length > 0 && ` + ${gols.length}🧤`}
                    </span>
                  </div>
                  {gols.map(j => (
                    <div key={j.id} className="flex items-center gap-3 px-4 py-3 bg-purple-50 border-t border-gray-100">
                      <span className="w-6 text-base">🧤</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{nomeJogador(j)}</p>
                        <p className="text-xs text-gray-400">Goleiro · {NIVEL_LABELS[nivelJogador(j)]}</p>
                      </div>
                      <span className="text-xs">{'⭐'.repeat(nivelJogador(j))}</span>
                    </div>
                  ))}
                  {lins.map((j, i) => (
                    <div key={j.id} className="flex items-center gap-3 px-4 py-3 bg-white border-t border-gray-100">
                      <span className="text-xs text-gray-400 w-6">{i + 1}.</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{nomeJogador(j)}</p>
                        <p className="text-xs text-gray-400">{NIVEL_LABELS[nivelJogador(j)]}</p>
                      </div>
                      <span className="text-xs">{'⭐'.repeat(nivelJogador(j))}</span>
                    </div>
                  ))}
                </div>
              );
            })}

            <button onClick={() => { setTimes([]); setSorteado(false); }}
              className="w-full py-3 border-2 border-green-600 text-green-700 rounded-xl font-bold text-sm hover:bg-green-50 transition-colors"
            >
              🔄 Novo sorteio
            </button>
          </>
        )}
      </div>
    </div>
  );
}
