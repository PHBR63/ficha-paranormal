/**
 * MaquinaDeMatarIndicator - Indicador visual para o poder Máquina de Matar (Aniquilador NEX 99%)
 * Exibe quando o poder está ativo e qual dado extra está sendo aplicado à arma favorita
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Skull, Crosshair, Sparkles } from '@/components/icons/ordem-icons';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MaquinaDeMatarIndicatorProps {
  /** Trilha de classe do personagem */
  classTrack: string | null | undefined;
  /** NEX atual do personagem (0-99) */
  nex: number;
  /** Arma favorita selecionada (se houver) */
  favoriteWeapon?: {
    id: string;
    name: string;
    damage?: string; // Ex: "2d10", "3d8+2"
  } | null;
  /** Classe CSS adicional */
  className?: string;
  /** Variante de exibição */
  variant?: 'full' | 'compact' | 'badge-only';
}

/**
 * Extrai o tamanho do dado principal de uma fórmula de dano
 * Ex: "2d10" -> 10, "3d8+2" -> 8, "1d6+1d4" -> 6
 */
function extractPrimaryDieSize(damageFormula: string | undefined): number | null {
  if (!damageFormula) return null;
  
  // Regex para capturar o primeiro grupo de dados (NdS)
  const match = damageFormula.match(/(\d+)d(\d+)/i);
  if (match) {
    return parseInt(match[2], 10);
  }
  return null;
}

/**
 * Extrai a quantidade de dados da fórmula para exibição
 * Ex: "2d10" -> "2d10 → 3d10", "3d8" -> "3d8 → 4d8"
 */
function getExtraDieDisplay(damageFormula: string | undefined): { original: string; withBonus: string } | null {
  if (!damageFormula) return null;
  
  const match = damageFormula.match(/(\d+)d(\d+)/i);
  if (match) {
    const count = parseInt(match[1], 10);
    const size = parseInt(match[2], 10);
    return {
      original: `${count}d${size}`,
      withBonus: `${count + 1}d${size}`,
    };
  }
  return null;
}

export const MaquinaDeMatarIndicator = memo(function MaquinaDeMatarIndicator({
  classTrack,
  nex,
  favoriteWeapon,
  className,
  variant = 'full',
}: MaquinaDeMatarIndicatorProps) {
  // Verifica se é Aniquilador NEX 99%
  const isAniquiladorNex99 = useMemo(() => {
    if (!classTrack) return false;
    const trackNorm = classTrack.toLowerCase().replace(/\s+/g, '-');
    return trackNorm.includes('aniquilador') && nex >= 99;
  }, [classTrack, nex]);

  // Extrai info do dado extra
  const dieInfo = useMemo(() => {
    if (!favoriteWeapon?.damage) return null;
    return getExtraDieDisplay(favoriteWeapon.damage);
  }, [favoriteWeapon?.damage]);

  const primaryDie = useMemo(() => {
    if (!favoriteWeapon?.damage) return null;
    return extractPrimaryDieSize(favoriteWeapon.damage);
  }, [favoriteWeapon?.damage]);

  // Se não é Aniquilador NEX 99%, não renderiza
  if (!isAniquiladorNex99) return null;

  // Variante badge-only para uso em listas compactas
  if (variant === 'badge-only') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn(
                'gap-1 bg-amber-500/20 text-amber-400 border-amber-500/40 cursor-help',
                className
              )}
            >
              <Skull className="w-3 h-3" />
              NEX 99%
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="font-medium text-amber-400">Máquina de Matar</p>
            <p className="text-xs text-muted-foreground">
              Categoria -III, Margem -2, +1 dado de dano
              {primaryDie && ` (d${primaryDie})`}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Variante compacta para mobile ou espaços reduzidos
  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg',
          'bg-amber-500/15 border border-amber-500/40',
          className
        )}
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="p-1 rounded bg-amber-500/20"
        >
          <Skull className="w-4 h-4 text-amber-400" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-amber-400">Máquina de Matar</span>
          {favoriteWeapon && primaryDie && (
            <p className="text-[10px] text-muted-foreground truncate">
              {favoriteWeapon.name}: +1d{primaryDie}
            </p>
          )}
        </div>
        <Badge 
          variant="outline" 
          className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/40 shrink-0"
        >
          ATIVO
        </Badge>
      </motion.div>
    );
  }

  // Variante completa (padrão)
  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        'relative overflow-hidden rounded-lg border',
        'bg-gradient-to-r from-amber-950/50 via-amber-900/30 to-amber-950/50',
        'border-amber-500/40',
        className
      )}
    >
      {/* Efeito de brilho animado */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      <div className="relative p-3 flex items-center gap-3">
        {/* Ícone com animação de pulso */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            boxShadow: [
              '0 0 0 0 rgba(245, 158, 11, 0)',
              '0 0 15px 5px rgba(245, 158, 11, 0.3)',
              '0 0 0 0 rgba(245, 158, 11, 0)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30"
        >
          <Skull className="w-5 h-5 text-amber-400" />
        </motion.div>

        {/* Informações do poder */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-amber-400">Máquina de Matar</span>
            <Badge 
              variant="outline" 
              className="text-[9px] px-1.5 py-0 h-4 bg-amber-500/20 text-amber-300 border-amber-500/40"
            >
              NEX 99%
            </Badge>
          </div>
          
          {/* Efeitos do poder */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-amber-500/70" />
              Margem -2
            </span>
            {primaryDie && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500/70" />
                +1d{primaryDie} dano
              </span>
            )}
          </div>
        </div>

        {/* Arma favorita com dado extra */}
        {favoriteWeapon && dieInfo && (
          <div className="text-right shrink-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Arma Favorita
            </p>
            <p className="text-xs font-medium text-amber-300 truncate max-w-[100px]">
              {favoriteWeapon.name}
            </p>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <span className="text-[10px] text-muted-foreground line-through">
                {dieInfo.original}
              </span>
              <span className="text-[10px] text-amber-400">→</span>
              <span className="text-xs font-bold text-amber-400">
                {dieInfo.withBonus}
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default MaquinaDeMatarIndicator;
