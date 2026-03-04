/**
 * MasterQuickActions - Barra de ações rápidas do mestre
 * 
 * Pedir teste de perícia, dano em área, descanso do grupo, limpar condições.
 * 
 * @module components/campaign/v3/master/MasterQuickActions
 */

import { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Exam as ExamIcon,
  Sword as SwordIcon,
  Bed as BedIcon,
  Eraser as EraserIcon,
  Lightning as LightningIcon,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';

// Perícias oficiais do Ordem Paranormal RPG v1.3
const OP_SKILLS = [
  'Acrobacia', 'Adestramento', 'Arte', 'Atletismo',
  'Atualidades', 'Ciências', 'Crime', 'Diplomacia',
  'Enganação', 'Fortitude', 'Furtividade', 'Iniciativa',
  'Intimidação', 'Investigação', 'Luta', 'Medicina',
  'Ocultismo', 'Percepção', 'Pilotagem', 'Pontaria',
  'Profissão', 'Reflexos', 'Religião', 'Sobrevivência',
  'Tática', 'Tecnologia', 'Vontade',
] as const;

interface MasterQuickActionsProps {
  members: CampaignMemberV2[];
  /** Envia mensagem no chat da campanha */
  onSendMessage?: (content: string, type?: string, metadata?: Record<string, unknown>) => void;
  /** Restaura PV/PE de todos ao máximo */
  onGroupRest?: () => Promise<void>;
  /** Limpa condições de todos os personagens */
  onClearAllConditions?: () => Promise<void>;
  /** Abre modal de dano em área */
  onOpenBulkDamage?: () => void;
  isUpdating?: boolean;
  className?: string;
}

export const MasterQuickActions = memo(function MasterQuickActions({
  members,
  onSendMessage,
  onGroupRest,
  onClearAllConditions,
  onOpenBulkDamage,
  isUpdating,
  className,
}: MasterQuickActionsProps) {
  const [confirmAction, setConfirmAction] = useState<'rest' | 'clear' | null>(null);

  // Pedir teste de perícia — envia mensagem de sistema
  const handleRequestSkillTest = useCallback((skill: string) => {
    onSendMessage?.(
      `🎲 O Mestre pede um teste de **${skill}**!`,
      'system',
      { action: 'skill_test', skill }
    );
  }, [onSendMessage]);

  // Confirma ação destrutiva
  const handleConfirmAction = useCallback(async () => {
    if (confirmAction === 'rest') {
      await onGroupRest?.();
    } else if (confirmAction === 'clear') {
      await onClearAllConditions?.();
    }
    setConfirmAction(null);
  }, [confirmAction, onGroupRest, onClearAllConditions]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center gap-2 flex-wrap px-4 py-2.5 border-b border-border/30 bg-muted/30',
          className
        )}
      >
        <div className="flex items-center gap-1.5 mr-2">
          <LightningIcon weight="duotone" className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Ações Rápidas
          </span>
        </div>

        {/* Pedir Teste — dropdown com perícias */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
              <ExamIcon weight="duotone" className="h-3.5 w-3.5" />
              Pedir Teste
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-[300px] overflow-y-auto w-48">
            <DropdownMenuLabel className="text-xs">Perícias (OP v1.3)</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {OP_SKILLS.map((skill) => (
              <DropdownMenuItem
                key={skill}
                onClick={() => handleRequestSkillTest(skill)}
                className="text-sm cursor-pointer"
              >
                {skill}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dano em Área */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={onOpenBulkDamage}
          disabled={isUpdating}
        >
          <SwordIcon weight="duotone" className="h-3.5 w-3.5" />
          Dano em Área
        </Button>

        {/* Descanso do Grupo */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() => setConfirmAction('rest')}
          disabled={isUpdating}
        >
          <BedIcon weight="duotone" className="h-3.5 w-3.5" />
          Descanso
        </Button>

        {/* Limpar Condições */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() => setConfirmAction('clear')}
          disabled={isUpdating}
        >
          <EraserIcon weight="duotone" className="h-3.5 w-3.5" />
          Limpar Condições
        </Button>
      </motion.div>

      {/* Dialog de confirmação */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'rest' ? 'Descanso do Grupo' : 'Limpar Condições'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'rest'
                ? 'Restaurar PV e PE de todos os personagens ao máximo? Esta ação afeta todos os jogadores da campanha.'
                : 'Remover todas as condições de todos os personagens? Esta ação não pode ser desfeita.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

export default MasterQuickActions;
