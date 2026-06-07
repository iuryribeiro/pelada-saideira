import React from 'react';
import { PresencaStatus, UserTipo, UserPosicao, PagamentoStatus } from '@/types/database';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'yellow' | 'blue' | 'red' | 'gray' | 'orange' | 'purple';
  size?: 'sm' | 'md';
}

const variantClasses = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue: 'bg-blue-100 text-blue-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-700',
  orange: 'bg-orange-100 text-orange-800',
  purple: 'bg-purple-100 text-purple-800',
};

export function Badge({ children, variant = 'gray', size = 'sm' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClass}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: PresencaStatus }) {
  const map: Record<PresencaStatus, { label: string; variant: BadgeProps['variant'] }> = {
    confirmado: { label: 'Confirmado', variant: 'green' },
    pendente: { label: 'Pendente', variant: 'yellow' },
    lista_espera: { label: 'Lista de Espera', variant: 'blue' },
    recusado: { label: 'Recusado', variant: 'red' },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function TipoBadge({ tipo }: { tipo: UserTipo }) {
  return (
    <Badge variant={tipo === 'mensalista' ? 'green' : 'orange'}>
      {tipo === 'mensalista' ? 'Mensalista' : 'Avulso'}
    </Badge>
  );
}

export function PosicaoBadge({ posicao }: { posicao: UserPosicao }) {
  return (
    <Badge variant={posicao === 'goleiro' ? 'purple' : 'blue'}>
      {posicao === 'goleiro' ? 'Goleiro' : 'Linha'}
    </Badge>
  );
}

export function PagamentoStatusBadge({ status }: { status: PagamentoStatus }) {
  return (
    <Badge variant={status === 'pago' ? 'green' : 'yellow'}>
      {status === 'pago' ? 'Pago' : 'Pendente'}
    </Badge>
  );
}
