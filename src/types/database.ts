export type UserTipo = 'mensalista' | 'avulso';
export type UserPosicao = 'linha' | 'goleiro';
export type PresencaStatus = 'confirmado' | 'pendente' | 'recusado' | 'lista_espera';
export type JogoStatus = 'aberto' | 'encerrado' | 'cancelado';
export type JogoTipo = 'fixo' | 'extra';
export type PagamentoTipo = 'mensalidade' | 'avulso' | 'goleiro';
export type PagamentoStatus = 'pendente' | 'pago';

export interface Profile {
  id: string;
  nome: string;
  apelido: string | null;
  email: string | null;
  telefone: string | null;
  foto_url: string | null;
  tipo: UserTipo;
  nivel: number;
  posicao: UserPosicao;
  is_admin: boolean;
  ativo: boolean;
  push_token: string | null;
  created_at: string;
}

export interface Pelada {
  id: string;
  nome: string;
  dia_semana: number;
  horario_inicio: string;
  horario_fim: string;
  quadra_nome: string | null;
  quadra_endereco: string | null;
  valor_mensalista: number;
  valor_avulso: number;
  valor_goleiro: number;
  max_jogadores: number;
  max_goleiros: number;
  created_at: string;
  updated_at: string;
}

export interface Jogo {
  id: string;
  pelada_id: string;
  data: string;
  tipo: JogoTipo;
  status: JogoStatus;
  created_at: string;
}

export interface Presenca {
  id: string;
  jogo_id: string;
  user_id: string | null;
  convidado_nome: string | null;
  adicionado_por: string | null;
  status: PresencaStatus;
  posicao: UserPosicao;
  chegou: boolean;
  ordem_fila: number | null;
  created_at: string;
}

export interface PresencaComPerfil extends Presenca {
  profile?: Profile | null;
  adicionado_por_profile?: Profile | null;
}

export interface Aviso {
  id: string;
  titulo: string;
  mensagem: string;
  admin_id: string;
  push_sent: boolean;
  created_at: string;
}

export interface Pagamento {
  id: string;
  user_id: string;
  jogo_id: string | null;
  mes_referencia: string | null;
  tipo: PagamentoTipo;
  valor: number;
  status: PagamentoStatus;
  created_at: string;
}

export interface PagamentoComDetalhes extends Pagamento {
  profile?: Profile | null;
  jogo?: Jogo | null;
}
