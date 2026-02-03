/**
 * FlagsSection - Exibe flags de estado ativas
 * 
 * Mostra condições booleanas especiais como "imune a X", "ignora Y", etc.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ComputedEffects } from '@/hooks';

interface FlagsSectionProps {
  flags: ComputedEffects['flags'];
  compact?: boolean;
}

/**
 * Seção de flags/condições booleanas ativas
 */
export function FlagsSection({ flags, compact }: FlagsSectionProps) {
  const activeFlags = Object.entries(flags).filter(([_, value]) => value);
  
  if (activeFlags.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <span className="text-sm font-medium">Flags Ativas</span>
      </div>
      <div className="flex flex-wrap gap-1 pl-6">
        {activeFlags.map(([flag]) => (
          <Badge key={flag} variant="destructive" className="text-xs">
            {flag}
          </Badge>
        ))}
      </div>
    </div>
  );
}
