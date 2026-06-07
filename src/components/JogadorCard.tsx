'use client';

import { Profile, PresencaComPerfil } from '@/types/database';
import { Badge, StatusBadge, TipoBadge, PosicaoBadge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { CheckCircle, UserCircle } from 'lucide-react';

interface JogadorCardProps {
  presenca: PresencaComPerfil;
  showActions?: boolean;
  isAdmin?: boolean;
  onMarcarChegou?: (presencaId: string, chegou: boolean) => void;
  onRemover?: (presencaId: string) => void;
  onAtualizarStatus?: (presencaId: string, status: 'confirmado' | 'lista_espera') => void;
}

export function JogadorCard({
  presenca,
  showActions = false,
  isAdmin = false,
  onMarcarChegou,
  onRemover,
}: JogadorCardProps) {
  const profile = presenca.profile;
  const nome = profile?.nome || presenca.convidado_nome || 'Convidado';
  const apelido = profile?.apelido;
  const nivel = profile?.nivel || 3;

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
        <UserCircle className="w-6 h-6 text-green-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 truncate">
            {apelido || nome}
          </span>
          {apelido && (
            <span className="text-xs text-gray-400 truncate">({nome})</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <StarRating value={nivel} readonly size="sm" />
          {profile && <TipoBadge tipo={profile.tipo} />}
          <StatusBadge status={presenca.status} />
          {presenca.chegou && (
            <Badge variant="green">
              <CheckCircle className="w-3 h-3 mr-1" />
              Chegou
            </Badge>
          )}
          {presenca.convidado_nome && !presenca.user_id && (
            <Badge variant="gray">Convidado</Badge>
          )}
        </div>
      </div>
      {showActions && isAdmin && (
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {onMarcarChegou && (
            <button
              onClick={() => onMarcarChegou(presenca.id, !presenca.chegou)}
              className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
                presenca.chegou
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {presenca.chegou ? 'Chegou' : 'Marcar'}
            </button>
          )}
          {onRemover && (
            <button
              onClick={() => onRemover(presenca.id)}
              className="text-xs px-2 py-1 rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              Remover
            </button>
          )}
        </div>
      )}
    </div>
  );
}
