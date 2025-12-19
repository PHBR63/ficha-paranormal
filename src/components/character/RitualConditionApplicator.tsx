/**
 * RitualConditionApplicator - Aplica condições de rituais automaticamente
 * Fase 6: Sistema de condições automáticas quando rituais são conjurados
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Check, X, Timer, Target, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CONDITIONS } from '@/lib/conditions';
import { RitualEffect, ResistanceType, ResistanceEffect } from '@/lib/rituals/legacy-exports';
import { ActiveCondition } from './ConditionManager';

// Interface para condição pendente de aplicação
export interface PendingCondition {
  conditionId: string;
  conditionName: string;
  duration: 'rodada' | 'cena' | 'sustentado' | 'permanente';
  turnsCount?: number;
  resistanceRequired?: {
    type: ResistanceType;
    effect: ResistanceEffect;
    passed: boolean;
  };
}

// Props do modal
interface RitualConditionModalProps {
  open: boolean;
  onClose: () => void;
  ritualName: string;
  ritualElement: string;
  pendingConditions: PendingCondition[];
  targetName?: string;
  resistancePassed?: boolean;
  resistanceEffect?: ResistanceEffect;
  onApplyConditions: (conditions: ActiveCondition[]) => void;
}

// Mapeamento de duração para turnos
function durationToTurns(duration: PendingCondition['duration'], turnsCount?: number): number | null {
  switch (duration) {
    case 'rodada':
      return turnsCount || 1;
    case 'cena':
      return null; // Permanente até fim da cena (manual)
    case 'sustentado':
      return null; // Permanente enquanto sustentado
    case 'permanente':
      return null;
    default:
      return null;
  }
}

// Componente de badge de condição
function ConditionPreviewBadge({ 
  conditionId, 
  duration, 
  turnsCount,
  willApply = true,
}: { 
  conditionId: string; 
  duration: PendingCondition['duration'];
  turnsCount?: number;
  willApply?: boolean;
}) {
  const condition = CONDITIONS[conditionId];
  if (!condition) return null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: willApply ? 1 : 0.5 }}
      className={cn(
        'flex items-center gap-2 p-3 rounded-lg border',
        willApply 
          ? 'bg-orange-500/10 border-orange-500/30' 
          : 'bg-muted/30 border-border line-through'
      )}
    >
      <span className="text-2xl">{condition.icon}</span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{condition.name}</span>
          {willApply ? (
            <Badge variant="outline" className="text-xs">
              <Timer className="w-3 h-3 mr-1" />
              {duration === 'rodada' ? `${turnsCount || 1} turno${(turnsCount || 1) > 1 ? 's' : ''}` : duration}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">Resistido</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{condition.effect}</p>
      </div>
      {willApply ? (
        <Check className="w-5 h-5 text-orange-500" />
      ) : (
        <X className="w-5 h-5 text-muted-foreground" />
      )}
    </motion.div>
  );
}

// Modal principal
export function RitualConditionModal({
  open,
  onClose,
  ritualName,
  ritualElement,
  pendingConditions,
  targetName = 'Alvo',
  resistancePassed = false,
  resistanceEffect,
  onApplyConditions,
}: RitualConditionModalProps) {
  // Filtra condições baseado no resultado da resistência
  const conditionsToApply = pendingConditions.filter(pc => {
    // Se passou na resistência e o efeito é 'anula', não aplica
    if (resistancePassed && resistanceEffect === 'anula') {
      return false;
    }
    // 'parcial' e 'reduz_metade' ainda aplicam condições (podem ter efeito reduzido)
    return true;
  });

  const handleApply = () => {
    const newConditions: ActiveCondition[] = conditionsToApply.map(pc => ({
      id: pc.conditionId,
      name: CONDITIONS[pc.conditionId]?.name || pc.conditionName,
      turnsRemaining: durationToTurns(pc.duration, pc.turnsCount),
      addedAt: new Date(),
    }));

    onApplyConditions(newConditions);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Condições do Ritual
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-primary">{ritualName}</span> aplica as seguintes condições em{' '}
            <span className="font-medium">{targetName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Indicador de resistência */}
          {resistanceEffect && (
            <div className={cn(
              'flex items-center gap-2 p-2 rounded-lg text-sm',
              resistancePassed 
                ? 'bg-green-500/10 text-green-400' 
                : 'bg-red-500/10 text-red-400'
            )}>
              <Shield className="w-4 h-4" />
              {resistancePassed ? (
                <span>
                  Resistência bem-sucedida! 
                  {resistanceEffect === 'anula' && ' Condições anuladas.'}
                  {resistanceEffect === 'parcial' && ' Efeito parcial.'}
                </span>
              ) : (
                <span>Resistência falhou. Condições aplicadas completamente.</span>
              )}
            </div>
          )}

          {/* Lista de condições */}
          <div className="space-y-2">
            <AnimatePresence>
              {pendingConditions.map((pc, index) => {
                const willApply = !resistancePassed || resistanceEffect !== 'anula';
                return (
                  <ConditionPreviewBadge
                    key={`${pc.conditionId}-${index}`}
                    conditionId={pc.conditionId}
                    duration={pc.duration}
                    turnsCount={pc.turnsCount}
                    willApply={willApply}
                  />
                );
              })}
            </AnimatePresence>
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleApply} 
              className="flex-1"
              disabled={conditionsToApply.length === 0}
            >
              <Target className="w-4 h-4 mr-2" />
              Aplicar {conditionsToApply.length > 0 ? `(${conditionsToApply.length})` : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook para gerenciar aplicação de condições de rituais
export function useRitualConditions(
  onConditionsChange: (conditions: ActiveCondition[]) => void,
  currentConditions: ActiveCondition[]
) {
  const [conditionModalOpen, setConditionModalOpen] = useState(false);
  const [pendingConditions, setPendingConditions] = useState<PendingCondition[]>([]);
  const [ritualInfo, setRitualInfo] = useState<{ name: string; element: string }>({ name: '', element: '' });
  const [targetName, setTargetName] = useState('Alvo');
  const [resistanceResult, setResistanceResult] = useState<{ passed: boolean; effect: ResistanceEffect } | null>(null);

  // Abre o modal com condições do ritual
  const openConditionModal = useCallback((
    ritualName: string,
    ritualElement: string,
    conditions: PendingCondition[],
    target?: string,
    resistance?: { passed: boolean; effect: ResistanceEffect }
  ) => {
    setRitualInfo({ name: ritualName, element: ritualElement });
    setPendingConditions(conditions);
    setTargetName(target || 'Alvo');
    setResistanceResult(resistance || null);
    setConditionModalOpen(true);
  }, []);

  // Aplica condições ao personagem/alvo
  const handleApplyConditions = useCallback((newConditions: ActiveCondition[]) => {
    // Filtra duplicatas
    const uniqueConditions = newConditions.filter(
      nc => !currentConditions.some(cc => cc.id === nc.id)
    );
    
    onConditionsChange([...currentConditions, ...uniqueConditions]);
  }, [currentConditions, onConditionsChange]);

  // Fecha o modal
  const closeConditionModal = useCallback(() => {
    setConditionModalOpen(false);
    setPendingConditions([]);
    setResistanceResult(null);
  }, []);

  return {
    conditionModalOpen,
    openConditionModal,
    closeConditionModal,
    handleApplyConditions,
    pendingConditions,
    ritualInfo,
    targetName,
    resistanceResult,
  };
}

// Utilitário para extrair condições de um efeito de ritual
export function extractConditionsFromEffect(effect: RitualEffect): PendingCondition[] {
  if (!effect.appliesConditions || effect.appliesConditions.length === 0) {
    return [];
  }

  return effect.appliesConditions.map(ac => {
    // Suporta tanto id quanto conditionId (compatibilidade)
    const conditionId = ac.id || ac.conditionId || '';
    
    // Converte duração numérica para 'rodada' com turnsCount
    let duration: PendingCondition['duration'] = 'cena';
    let turnsCount = ac.turnsCount;
    
    if (typeof ac.duration === 'number') {
      duration = 'rodada';
      turnsCount = ac.duration;
    } else if (ac.duration === 'rodada' || ac.duration === 'cena' || ac.duration === 'sustentado' || ac.duration === 'permanente') {
      duration = ac.duration;
    } else if (ac.isPermanent) {
      duration = 'permanente';
    }
    
    return {
      conditionId,
      conditionName: CONDITIONS[conditionId]?.name || conditionId,
      duration,
      turnsCount,
    };
  });
}
