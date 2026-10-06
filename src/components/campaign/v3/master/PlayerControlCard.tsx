/**
 * PlayerControlCard - Card expandido de controle de personagem para o Mestre
 * 
 * Barras de progresso coloridas, inputs numéricos, presets de ajuste,
 * indicador de perigo e badges de condições visíveis.
 * 
 * @module components/campaign/v3/master/PlayerControlCard
 */

import { memo, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart as HeartIcon, 
  Brain as BrainIcon, 
  Lightning as LightningIcon,
  Skull as SkullIcon,
  FirstAid as FirstAidIcon,
  CaretDown as CaretDownIcon,
  CaretUp as CaretUpIcon,
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CharacterActivityPanel } from '@/components/character/CharacterActivityPanel';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ConditionSelector, OP_CONDITIONS } from './ConditionSelector';
import { getConditionPresentation, resolveConditionId } from '@/lib/conditions/condition-identity';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';

// Presets de ajuste rápido
const HP_PRESETS = [-10, -5, -1, 1, 5, 10];
const SAN_PE_PRESETS = [-5, -3, -1, 1, 3, 5];

interface PlayerControlCardProps {
  member: CampaignMemberV2;
  onModifyHP?: (characterId: string, delta: number) => Promise<boolean>;
  onModifySAN?: (characterId: string, delta: number) => Promise<boolean>;
  onModifyPE?: (characterId: string, delta: number) => Promise<boolean>;
  onApplyCondition?: (characterId: string, conditionName: string) => Promise<boolean>;
  onRemoveCondition?: (characterId: string, conditionName: string) => Promise<boolean>;
  /** Restaura PV e PE ao máximo */
  onRestFull?: (characterId: string) => Promise<boolean>;
  isUpdating?: boolean;
}

/** Barra de recurso com gradiente de cor e input inline */
const ResourceBar = memo(function ResourceBar({
  icon: Icon,
  label,
  current,
  max,
  color,
  presets,
  onModify,
  isUpdating,
}: {
  icon: React.ElementType;
  label: string;
  current: number;
  max: number;
  color: 'hp' | 'san' | 'pe';
  presets: number[];
  onModify: (delta: number) => Promise<boolean>;
  isUpdating?: boolean;
}) {
  const [customValue, setCustomValue] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);
  const pendingAdjustment = useRef(false);
  const isBusy = isUpdating || isApplying;

  const percentage = max > 0 ? (current / max) * 100 : 0;

  // Cores condicionais por tipo de recurso
  const colorClasses = {
    hp: percentage <= 25 
      ? 'bg-destructive' 
      : percentage <= 50 
        ? 'bg-yellow-500' 
        : 'bg-emerald-500',
    san: 'bg-purple-500',
    pe: 'bg-primary',
  };

  /** Envia um delta inteiro e aguarda confirmação; falhas conservam a entrada. */
  const applyAdjustment = useCallback(async (value: number) => {
    if (pendingAdjustment.current || isUpdating) return false;
    if (!Number.isSafeInteger(value) || value === 0 || Math.abs(value) > 1000000) {
      setAdjustmentError('Informe um ajuste inteiro diferente de zero.');
      return false;
    }
    pendingAdjustment.current = true;
    setIsApplying(true);
    setAdjustmentError(null);
    try {
      const confirmed = await onModify(value);
      if (!confirmed) setAdjustmentError('Alteração não confirmada. Confira o histórico antes de tentar novamente.');
      return confirmed;
    } catch {
      setAdjustmentError('Alteração não confirmada. Confira o histórico antes de tentar novamente.');
      return false;
    } finally {
      pendingAdjustment.current = false;
      setIsApplying(false);
    }
  }, [isUpdating, onModify]);

  const handleCustomApply = useCallback(async () => {
    if (await applyAdjustment(customValue.trim() ? Number(customValue) : NaN)) {
      setCustomValue('');
      setShowInput(false);
    }
  }, [customValue, applyAdjustment]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon weight="duotone" className={cn(
            'h-4 w-4',
            color === 'hp' && 'text-destructive',
            color === 'san' && 'text-purple-500',
            color === 'pe' && 'text-primary',
          )} />
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>

        {/* Valor clicável para abrir input */}
        {showInput ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              aria-label={`Ajuste de ${label}`}
              step={1}
              disabled={isBusy}
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomApply()}
              placeholder="±"
              className="h-6 w-16 text-xs text-center"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCustomApply}
              aria-label={`Aplicar ajuste de ${label}`}
              disabled={isBusy}
            >
              <CaretUpIcon weight="bold" className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => { setShowInput(false); setCustomValue(''); }}
              aria-label={`Cancelar ajuste de ${label}`}
              disabled={isBusy}
            >
              <CaretDownIcon weight="bold" className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            aria-label={`${label}: ajustar quantidade`}
            disabled={isBusy}
            className="text-xs font-bold tabular-nums hover:underline cursor-pointer"
            title="Digite quanto acrescentar ou retirar; o valor informado é um ajuste."
          >
            {current}/{max}
          </button>
        )}
      </div>

      {/* Barra de progresso */}
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', colorClasses[color])}
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Botões de preset */}
      <div className="flex items-center gap-0.5 flex-wrap">
        {presets.map((val) => (
          <Button
            key={val}
            variant="outline"
            size="sm"
            className={cn(
              'h-6 px-1.5 text-[10px] font-mono',
              val < 0 && 'text-destructive hover:bg-destructive/10',
              val > 0 && 'text-emerald-600 hover:bg-emerald-500/10',
            )}
            onClick={() => void applyAdjustment(val)}
            aria-label={`${label}: ${val > 0 ? 'aumentar' : 'reduzir'} ${Math.abs(val)}`}
            disabled={isBusy}
          >
            {val > 0 ? `+${val}` : val}
          </Button>
        ))}
      </div>
      {adjustmentError && <p role="alert" className="text-xs text-destructive">{adjustmentError}</p>}
    </div>
  );
});

export const PlayerControlCard = memo(function PlayerControlCard({
  member,
  onModifyHP,
  onModifySAN,
  onModifyPE,
  onApplyCondition,
  onRemoveCondition,
  onRestFull,
  isUpdating,
}: PlayerControlCardProps) {
  const character = member.characters;
  const characterId = character?.id || '';

  // Handlers memoizados
  const handleHP = useCallback(async (delta: number) => {
    return characterId && onModifyHP ? onModifyHP(characterId, delta) : false;
  }, [characterId, onModifyHP]);

  const handleSAN = useCallback(async (delta: number) => {
    return characterId && onModifySAN ? onModifySAN(characterId, delta) : false;
  }, [characterId, onModifySAN]);

  const handlePE = useCallback(async (delta: number) => {
    return characterId && onModifyPE ? onModifyPE(characterId, delta) : false;
  }, [characterId, onModifyPE]);

  const handleApplyCondition = useCallback((conditionId: string) => {
    if (characterId) onApplyCondition?.(characterId, conditionId);
  }, [characterId, onApplyCondition]);

  const handleRemoveCondition = useCallback((conditionId: string) => {
    if (characterId) onRemoveCondition?.(characterId, conditionId);
  }, [characterId, onRemoveCondition]);

  const handleRestFull = useCallback(() => {
    if (characterId) onRestFull?.(characterId);
  }, [characterId, onRestFull]);

  if (!character) return null;

  const displayName = character.name;
  const initials = displayName.substring(0, 2).toUpperCase();
  const activeConditions = character.conditions || [];

  // Indicadores de perigo
  const hpPercentage = character.hp_max > 0 ? (character.hp_current / character.hp_max) * 100 : 0;
  const isDying = character.hp_current === 0;
  const isDanger = hpPercentage <= 25 && !isDying;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        'overflow-hidden backdrop-blur-sm border transition-colors duration-300',
        isDying && 'border-destructive/60 bg-destructive/5',
        isDanger && !isDying && 'border-yellow-500/50 bg-yellow-500/5',
      )}>
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Avatar className="h-9 w-9">
                <AvatarImage src={character.photo_url || undefined} alt={displayName} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              {isDying && (
                <div className="absolute -top-1 -right-1 animate-pulse">
                  <SkullIcon weight="duotone" className="h-4 w-4 text-destructive" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold truncate">{displayName}</h4>
              <p className="text-[11px] text-muted-foreground">
                {character.class} • NEX {character.nex}%
              </p>
            </div>

            {/* Ações: descanso + condições */}
            <div className="flex items-center gap-1">
              <CharacterActivityPanel characterId={characterId} characterName={displayName} compact />
              {onRestFull && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleRestFull}
                  disabled={isUpdating}
                  title="Descanso completo (restaurar PV e PE)"
                >
                  <FirstAidIcon weight="duotone" className="h-4 w-4 text-emerald-500" />
                </Button>
              )}
              <ConditionSelector
                activeConditions={activeConditions}
                onApply={handleApplyCondition}
                onRemove={handleRemoveCondition}
                isLoading={isUpdating}
                compact
              />
            </div>
          </div>

          {/* Badges de condições ativas */}
          <AnimatePresence>
            {activeConditions.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex flex-wrap gap-1 mt-2"
              >
                {activeConditions.map((condId) => {
                  const known = OP_CONDITIONS.find(c => c.id === resolveConditionId(condId));
                  const presentation = getConditionPresentation(condId, condId);
                  const cond = known ?? { name: presentation.name, description: presentation.effect, color: 'bg-muted-foreground' };
                  return (
                    <Badge
                      key={condId}
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-5 gap-1 cursor-pointer hover:bg-destructive/10"
                      onClick={() => handleRemoveCondition(condId)}
                      title={`${cond.name}: ${cond.description}. Clique para remover.`}
                    >
                      <span className={cn('w-1.5 h-1.5 rounded-full', cond.color)} />
                      {cond.name}
                    </Badge>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </CardHeader>

        <CardContent className="px-3 pb-3 space-y-3">
          <ResourceBar
            icon={HeartIcon}
            label="PV"
            current={character.hp_current}
            max={character.hp_max}
            color="hp"
            presets={HP_PRESETS}
            onModify={handleHP}
            isUpdating={isUpdating}
          />
          <ResourceBar
            icon={BrainIcon}
            label="SAN"
            current={character.san_current}
            max={character.san_max}
            color="san"
            presets={SAN_PE_PRESETS}
            onModify={handleSAN}
            isUpdating={isUpdating}
          />
          <ResourceBar
            icon={LightningIcon}
            label="PE"
            current={character.pe_current}
            max={character.pe_max}
            color="pe"
            presets={SAN_PE_PRESETS}
            onModify={handlePE}
            isUpdating={isUpdating}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
});

export default PlayerControlCard;
