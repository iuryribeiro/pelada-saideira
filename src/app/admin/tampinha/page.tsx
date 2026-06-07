'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface ResultadoJogador { numero: number; ordem: number; }
type Fase = 'config' | 'sorteio' | 'resultado';

export default function TampinhaPage() {
  const router = useRouter();
  const [quantosSorteiam, setQuantosSorteiam] = useState('');
  const [quantosFicam,    setQuantosFicam]    = useState('');
  const [fase,       setFase]       = useState<Fase>('config');
  const [resultados, setResultados] = useState<ResultadoJogador[]>([]);
  const [esperando,  setEsperando]  = useState(false);
  const [animando,   setAnimando]   = useState(false);
  const numerosBaralhados = useRef<number[]>([]);

  const total        = parseInt(quantosSorteiam, 10) || 0;
  const ficam        = parseInt(quantosFicam, 10) || 0;
  const jogadorAtual = resultados.length + 1;
  const todosJogaram = resultados.length >= total;

  function embaralhar(arr: number[]) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function iniciar() {
    if (!total || !ficam) { alert('Preencha os dois campos.'); return; }
    if (ficam >= total)   { alert('Quem fica precisa ser menor que o total.'); return; }
    if (ficam < 1)        { alert('Pelo menos 1 jogador deve ficar.'); return; }
    if (total > 20)       { alert('Máximo de 20 jogadores por sorteio.'); return; }
    numerosBaralhados.current = embaralhar(Array.from({ length: 20 }, (_, i) => i + 1));
    setResultados([]);
    setFase('sorteio');
  }

  function tocarMoeda() {
    if (esperando || todosJogaram) return;
    setEsperando(true);
    setAnimando(true);

    const numero = numerosBaralhados.current[resultados.length];

    setTimeout(() => {
      setAnimando(false);
      setResultados(prev => [...prev, { numero, ordem: prev.length + 1 }]);
      setEsperando(false);
    }, 400);
  }

  function reiniciar() {
    setResultados([]);
    setQuantosSorteiam('');
    setQuantosFicam('');
    setFase('config');
  }

  const ranking = [...resultados]
    .map((r, i) => ({ ...r, jogador: i + 1 }))
    .sort((a, b) => b.numero - a.numero);

  const ultimoResultado = resultados.length > 0 ? resultados[resultados.length - 1] : null;
  const configValida    = total > 0 && ficam > 0 && ficam < total;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 px-4 pt-8 pb-5 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 bg-white/20 rounded-full hover:bg-white/30">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-xl font-bold text-white">🪙 Tampinha</h1>
      </div>

      <div className="px-4 py-4 pb-16 space-y-5">

        {/* ── CONFIG ── */}
        {fase === 'config' && (
          <>
            <p className="text-sm text-gray-500 text-center">
              Cada jogador toca a moeda. Os maiores números ficam em campo.
            </p>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-800">Quantos vão sortear?</label>
              <input
                type="number" inputMode="numeric"
                value={quantosSorteiam}
                onChange={e => setQuantosSorteiam(e.target.value)}
                placeholder="Ex: 10"
                maxLength={3}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xl text-center font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-800">Quantos ficam em campo?</label>
              <input
                type="number" inputMode="numeric"
                value={quantosFicam}
                onChange={e => setQuantosFicam(e.target.value)}
                placeholder="Ex: 5"
                maxLength={3}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xl text-center font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {configValida && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                <p className="text-sm font-medium text-green-700">
                  ✅ {ficam} ficam em campo · 🪙 {total - ficam} pagam tampinha
                </p>
              </div>
            )}

            <button
              onClick={iniciar}
              disabled={!configValida}
              className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold text-lg hover:bg-green-700 disabled:opacity-40 transition-colors"
            >
              Iniciar Sorteio
            </button>
          </>
        )}

        {/* ── SORTEIO ── */}
        {fase === 'sorteio' && (
          <>
            {/* Barra de progresso */}
            <div className="space-y-2">
              <p className="text-base font-bold text-gray-800 text-center">
                {todosJogaram ? 'Todos jogaram!' : `Vez do jogador ${jogadorAtual} de ${total}`}
              </p>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-green-600 rounded-full transition-all duration-300"
                  style={{ width: `${(resultados.length / total) * 100}%` }}
                />
              </div>
            </div>

            {!todosJogaram ? (
              <div className="flex flex-col items-center gap-5">
                <p className="text-base font-medium text-gray-500">
                  {esperando ? 'Sorteando...' : 'Toque na moeda!'}
                </p>

                {/* Moeda com animação CSS */}
                <button
                  onClick={tocarMoeda}
                  disabled={esperando}
                  className="focus:outline-none"
                >
                  <div className={`
                    w-40 h-40 rounded-full bg-yellow-400 border-4 border-yellow-500
                    flex items-center justify-center
                    shadow-[0_4px_20px_rgba(0,0,0,0.25)]
                    transition-transform duration-150 active:scale-95
                    ${animando ? 'scale-[0.3]' : 'scale-100 hover:scale-105'}
                  `}
                    style={{ transition: animando ? 'transform 0.15s ease-in' : 'transform 0.2s ease-out' }}
                  >
                    <span className="text-7xl">{esperando ? '🌀' : '🪙'}</span>
                  </div>
                </button>

                {/* Último resultado */}
                {ultimoResultado && (
                  <div className="w-full bg-white border border-gray-200 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-400 mb-1">Jogador {resultados.length} tirou:</p>
                    <p className="text-5xl font-bold text-green-700">{ultimoResultado.numero}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <p className="text-xl font-bold text-green-700">🎉 Todos jogaram!</p>
                <button
                  onClick={() => setFase('resultado')}
                  className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold text-lg hover:bg-green-700 transition-colors"
                >
                  Ver Resultado
                </button>
              </div>
            )}

            {/* Resultados parciais */}
            {resultados.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-bold text-gray-500 mb-1">Resultados até agora</p>
                {resultados.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-700">Jogador {i + 1}</span>
                    <span className="bg-green-100 text-green-700 font-bold text-sm px-3 py-0.5 rounded-lg">
                      {r.numero}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── RESULTADO ── */}
        {fase === 'resultado' && (
          <>
            {/* Ficam em campo */}
            <div className="space-y-2">
              <p className="text-base font-bold text-green-600">✅ Ficam em campo ({ficam})</p>
              {ranking.slice(0, ficam).map((r, i) => (
                <div key={i} className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
                  <span className="text-sm font-bold text-gray-400 w-7">#{i + 1}</span>
                  <span className="flex-1 text-sm font-semibold text-gray-900">Jogador {r.jogador}</span>
                  <span className="bg-green-100 text-green-700 font-bold text-base px-4 py-0.5 rounded-xl">
                    {r.numero}
                  </span>
                </div>
              ))}
            </div>

            {/* Pagam tampinha */}
            <div className="space-y-2">
              <p className="text-base font-bold text-orange-500">🪙 Pagam tampinha ({total - ficam})</p>
              {ranking.slice(ficam).map((r, i) => (
                <div key={i} className="flex items-center gap-3 bg-yellow-50 border border-yellow-300 rounded-xl p-3">
                  <span className="text-sm font-bold text-gray-400 w-7">#{ficam + i + 1}</span>
                  <span className="flex-1 text-sm font-semibold text-gray-900">Jogador {r.jogador}</span>
                  <span className="bg-yellow-100 text-yellow-600 font-bold text-base px-4 py-0.5 rounded-xl">
                    {r.numero}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={reiniciar}
              className="w-full py-3 border-2 border-green-600 text-green-700 rounded-2xl font-bold text-base hover:bg-green-50 transition-colors"
            >
              🔄 Novo sorteio
            </button>
          </>
        )}
      </div>
    </div>
  );
}
