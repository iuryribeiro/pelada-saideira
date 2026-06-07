'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { usePelada } from '@/hooks/usePelada';
import { useAtualizarPelada, useCriarJogo } from '@/hooks/useAdmin';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import { JogoTipo } from '@/types/database';

const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function EditarPeladaPage() {
  const router = useRouter();
  const { profile, isLoading: authLoading } = useAuthStore();
  const { data: pelada, isLoading: peladaLoading } = usePelada();
  const atualizarMutation = useAtualizarPelada();
  const criarJogoMutation = useCriarJogo();

  const [form, setForm] = useState({
    nome: '',
    quadra_nome: '',
    quadra_endereco: '',
    horario_inicio: '',
    horario_fim: '',
    dia_semana: 0,
    max_jogadores: 16,
    max_goleiros: 2,
    valor_mensalista: 0,
    valor_avulso: 0,
    valor_goleiro: 0,
  });

  function todayDisplay() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  function displayToISO(display: string): string {
    // DD/MM/YYYY → YYYY-MM-DD
    const [dd, mm, yyyy] = display.split('/');
    if (!dd || !mm || !yyyy || yyyy.length < 4) return '';
    return `${yyyy}-${mm}-${dd}`;
  }

  function handleDataInput(raw: string) {
    // Remove non-digits
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    let masked = digits;
    if (digits.length > 4) masked = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    else if (digits.length > 2) masked = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    setNewJogoData(masked);
  }

  const [newJogoData, setNewJogoData] = useState(todayDisplay);
  const [newJogoTipo, setNewJogoTipo] = useState<JogoTipo>('fixo');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [jogoSuccess, setJogoSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && !profile?.is_admin) router.replace('/home');
  }, [profile, authLoading, router]);

  useEffect(() => {
    if (pelada) {
      setForm({
        nome: pelada.nome || '',
        quadra_nome: pelada.quadra_nome || '',
        quadra_endereco: pelada.quadra_endereco || '',
        horario_inicio: pelada.horario_inicio || '',
        horario_fim: pelada.horario_fim || '',
        dia_semana: pelada.dia_semana || 0,
        max_jogadores: pelada.max_jogadores || 16,
        max_goleiros: pelada.max_goleiros || 2,
        valor_mensalista: pelada.valor_mensalista || 0,
        valor_avulso: pelada.valor_avulso || 0,
        valor_goleiro: pelada.valor_goleiro || 0,
      });
    }
  }, [pelada]);

  if (authLoading || peladaLoading) return <FullPageSpinner />;
  if (!profile?.is_admin) return null;

  const handleSave = async () => {
    if (!pelada) return;
    setError('');
    try {
      await atualizarMutation.mutateAsync({
        peladaId: pelada.id,
        dados: {
          nome: form.nome,
          quadra_nome: form.quadra_nome || null,
          quadra_endereco: form.quadra_endereco || null,
          horario_inicio: form.horario_inicio,
          horario_fim: form.horario_fim,
          dia_semana: form.dia_semana,
          max_jogadores: Number(form.max_jogadores),
          max_goleiros: Number(form.max_goleiros),
          valor_mensalista: Number(form.valor_mensalista),
          valor_avulso: Number(form.valor_avulso),
          valor_goleiro: Number(form.valor_goleiro),
        },
      });
      setSuccess('Salvo com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    }
  };

  const handleCriarJogo = async () => {
    const iso = displayToISO(newJogoData);
    if (!pelada || !iso) {
      setError('Data inválida. Use o formato DD/MM/AAAA.');
      return;
    }
    setError('');
    try {
      await criarJogoMutation.mutateAsync({
        peladaId: pelada.id,
        data: iso,
        tipo: newJogoTipo,
      });
      setJogoSuccess('Jogo criado com sucesso!');
      setNewJogoData(todayDisplay());
      setTimeout(() => setJogoSuccess(''), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao criar jogo');
    }
  };

  const Field = ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );

  const inputClass = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 px-4 pt-8 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 bg-white/20 rounded-full hover:bg-white/30">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Editar Pelada</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
        {success && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">{success}</div>}

        {/* Pelada Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <h2 className="font-semibold text-gray-900">Informações da Pelada</h2>

          <Field label="Nome">
            <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className={inputClass} />
          </Field>

          <Field label="Dia da semana">
            <select
              value={form.dia_semana}
              onChange={e => setForm(f => ({ ...f, dia_semana: Number(e.target.value) }))}
              className={inputClass}
            >
              {diasSemana.map((dia, i) => (
                <option key={i} value={i}>{dia}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Horário início">
              <input type="time" value={form.horario_inicio} onChange={e => setForm(f => ({ ...f, horario_inicio: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Horário fim">
              <input type="time" value={form.horario_fim} onChange={e => setForm(f => ({ ...f, horario_fim: e.target.value }))} className={inputClass} />
            </Field>
          </div>

          <Field label="Nome da quadra">
            <input type="text" value={form.quadra_nome} onChange={e => setForm(f => ({ ...f, quadra_nome: e.target.value }))} placeholder="Ex: Arena Verde" className={inputClass} />
          </Field>

          <Field label="Endereço">
            <input type="text" value={form.quadra_endereco} onChange={e => setForm(f => ({ ...f, quadra_endereco: e.target.value }))} placeholder="Rua..." className={inputClass} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Máx. jogadores">
              <input type="number" value={form.max_jogadores} onChange={e => setForm(f => ({ ...f, max_jogadores: Number(e.target.value) }))} min={1} className={inputClass} />
            </Field>
            <Field label="Máx. goleiros">
              <input type="number" value={form.max_goleiros} onChange={e => setForm(f => ({ ...f, max_goleiros: Number(e.target.value) }))} min={1} className={inputClass} />
            </Field>
          </div>

          <h3 className="font-medium text-gray-800 pt-1">Valores (R$)</h3>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Mensalista">
              <input type="number" value={form.valor_mensalista} onChange={e => setForm(f => ({ ...f, valor_mensalista: Number(e.target.value) }))} min={0} step={0.01} className={inputClass} />
            </Field>
            <Field label="Avulso">
              <input type="number" value={form.valor_avulso} onChange={e => setForm(f => ({ ...f, valor_avulso: Number(e.target.value) }))} min={0} step={0.01} className={inputClass} />
            </Field>
            <Field label="Goleiro">
              <input type="number" value={form.valor_goleiro} onChange={e => setForm(f => ({ ...f, valor_goleiro: Number(e.target.value) }))} min={0} step={0.01} className={inputClass} />
            </Field>
          </div>

          <button
            onClick={handleSave}
            disabled={atualizarMutation.isPending}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50"
          >
            {atualizarMutation.isPending ? <Spinner size="sm" /> : <><Save className="w-4 h-4" /> Salvar</>}
          </button>
        </div>

        {/* Create new game */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <h2 className="font-semibold text-gray-900">Criar Novo Jogo</h2>
          {jogoSuccess && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">{jogoSuccess}</div>}

          <Field label="Data do jogo">
            <input
              type="text"
              value={newJogoData}
              onChange={e => handleDataInput(e.target.value)}
              placeholder="DD/MM/AAAA"
              inputMode="numeric"
              maxLength={10}
              className={inputClass}
            />
          </Field>

          <Field label="Tipo">
            <div className="flex gap-2">
              {(['fixo', 'extra'] as JogoTipo[]).map(t => (
                <button
                  key={t}
                  onClick={() => setNewJogoTipo(t)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    newJogoTipo === t ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {t === 'fixo' ? 'Fixo' : 'Extra'}
                </button>
              ))}
            </div>
          </Field>

          <button
            onClick={handleCriarJogo}
            disabled={!newJogoData || criarJogoMutation.isPending}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
          >
            {criarJogoMutation.isPending ? <Spinner size="sm" /> : <><Plus className="w-4 h-4" /> Criar Jogo</>}
          </button>
        </div>
      </div>
    </div>
  );
}
