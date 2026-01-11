/**
 * OpportunityAttackAlert - Modal/Alerta para ataques de oportunidade
 * 
 * Exibe quando um combatente sai da adjacência de um inimigo,
 * permitindo ao jogador/mestre decidir se realiza o ataque.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sword,
  X,
  ArrowRight,
  Footprints,
  Target,
  SkipForward,
  Zap,
} from 'lucide-react';
import type { OpportunityAttack } from '@/hooks/campaign/useOpportunityAttacks';

interface OpportunityAttackAlertProps {
  attacks: OpportunityAttack[];
  onResolve: (attackId: string, resolution: 'attack' | 'pass' | 'cancelled') => void;
  onResolveAll: (resolution: 'pass' | 'cancelled') => void;
  isMaster?: boolean;
  className?: string;
}

export function OpportunityAttackAlert({
  attacks,
  onResolve,
  onResolveAll,
  isMaster = false,
  className,
}: OpportunityAttackAlertProps) {
  // Filtra apenas ataques não resolvidos
  const unresolvedAttacks = attacks.filter(a => !a.resolved);
  
  if (unresolvedAttacks.length === 0) return null;

  // Agrupa por atacante para exibição compacta
  const attacksByAttacker = unresolvedAttacks.reduce((acc, attack) => {
    if (!acc[attack.attackerId]) {
      acc[attack.attackerId] = [];
    }
    acc[attack.attackerId].push(attack);
    return acc;
  }, {} as Record<string, OpportunityAttack[]>);

  const attackerCount = Object.keys(attacksByAttacker).length;
  const singleAttack = unresolvedAttacks.length === 1 ? unresolvedAttacks[0] : null;

  return (
    <AlertDialog open={unresolvedAttacks.length > 0}>
      <AlertDialogContent className={cn('max-w-md', className)}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-destructive/20 rounded-lg">
              <Sword className="w-5 h-5 text-destructive" />
            </div>
            <span>Ataque de Oportunidade!</span>
          </AlertDialogTitle>
          
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {/* Descrição do contexto */}
              <p className="text-sm text-muted-foreground">
                {singleAttack ? (
                  <>
                    <span className="font-medium text-foreground">
                      {singleAttack.movingCombatantName}
                    </span>
                    {' '}está saindo da área de ameaça de{' '}
                    <span className="font-medium text-foreground">
                      {singleAttack.attackerName}
                    </span>.
                  </>
                ) : (
                  <>
                    <span className="font-medium text-foreground">
                      {unresolvedAttacks[0]?.movingCombatantName}
                    </span>
                    {' '}está provocando{' '}
                    <span className="font-medium text-destructive">
                      {unresolvedAttacks.length} ataques de oportunidade
                    </span>
                    {' '}ao sair da área de ameaça.
                  </>
                )}
              </p>

              {/* Lista de atacantes */}
              <div className="space-y-2">
                {Object.entries(attacksByAttacker).map(([attackerId, attackerAttacks]) => {
                  const attack = attackerAttacks[0];
                  return (
                    <motion.div
                      key={attackerId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                          <Target className="w-4 h-4 text-destructive" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{attack.attackerName}</p>
                          <p className="text-xs text-muted-foreground">
                            Pode realizar ataque corpo-a-corpo
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onResolve(attack.id, 'attack')}
                          className="gap-1"
                        >
                          <Sword className="w-3 h-3" />
                          Atacar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onResolve(attack.id, 'pass')}
                        >
                          <SkipForward className="w-3 h-3" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Informação visual do movimento */}
              {singleAttack && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground p-2 bg-muted/30 rounded-lg">
                  <Footprints className="w-4 h-4" />
                  <span>
                    ({singleAttack.fromCell.x}, {singleAttack.fromCell.y})
                  </span>
                  <ArrowRight className="w-3 h-3" />
                  <span>
                    ({singleAttack.toCell.x}, {singleAttack.toCell.y})
                  </span>
                </div>
              )}

              {/* Regra do sistema */}
              <div className="flex items-start gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
                <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Regra OP:</span> Ao sair da 
                  área de ameaça de um inimigo (1,5m), ele pode realizar um ataque 
                  corpo-a-corpo como reação, a menos que você use a ação Esquivar.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          {unresolvedAttacks.length > 1 && (
            <Button
              variant="outline"
              onClick={() => onResolveAll('pass')}
              className="w-full sm:w-auto gap-2"
            >
              <SkipForward className="w-4 h-4" />
              Ignorar Todos
            </Button>
          )}
          
          {isMaster && (
            <Button
              variant="ghost"
              onClick={() => onResolveAll('cancelled')}
              className="w-full sm:w-auto gap-2 text-muted-foreground"
            >
              <X className="w-4 h-4" />
              Cancelar (Mestre)
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Versão compacta para exibir na interface de combate
 */
export function OpportunityAttackBadge({
  count,
  onClick,
  className,
}: {
  count: number;
  onClick?: () => void;
  className?: string;
}) {
  if (count === 0) return null;

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 bg-destructive/20 border border-destructive/30',
        'rounded-full text-destructive text-xs font-medium',
        'hover:bg-destructive/30 transition-colors cursor-pointer',
        className
      )}
    >
      <Sword className="w-3 h-3 animate-pulse" />
      <span>{count} Ataque{count > 1 ? 's' : ''} de Oportunidade</span>
    </motion.button>
  );
}
