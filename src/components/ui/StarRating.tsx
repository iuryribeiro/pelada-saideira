'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const NIVEL_LABELS: Record<number, string> = {
  1: 'Perna de Pau',
  2: 'Iniciante',
  3: 'Mediano',
  4: 'Bom',
  5: 'Craque',
};

export function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          disabled={readonly}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <Star
            className={`${sizes[size]} ${
              star <= Math.round(value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function NivelLabel({ nivel }: { nivel: number }) {
  return <span className="text-xs text-gray-500">{NIVEL_LABELS[Math.round(nivel)] || 'Mediano'}</span>;
}
