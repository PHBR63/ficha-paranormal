// Painel de combate unificado para sessões presenciais
// Ordem Paranormal RPG v1.3

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Heart, 
  Zap, 
  Brain,
  Minus,
  Plus,
  Shield,
  Skull,
  Swords,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAutoConditions, type ActiveCondition } from '@/hooks/useAutoConditions';
import type { SessionLogEntry } from './SessionLog';

interface SessionCombatPanelProps {
  // Recursos atuais
  hp: number;
  hpMax: number;
  pe: number;
  peMax: number;
  san: number;
  sanMax: number;
  // Defesa e RD
  defense: number;
  rd: number;
  // Condições ativas
  conditions: ActiveCondition[];
  // Callbacks
  onHPChange: (newHP: number, damage?: number) => void;
  onPEChange: (newPE: number) => void;
  onSANChange: (newSAN: number) => void;
  onConditionsChange: (conditions: ActiveCondition[]) => void;
  onLogEntry?: (entry: Omit<SessionLogEntry, 'id' | 'timestamp'>) => void;
  className?: string;
}

export function SessionCombatPanel({
  hp,
  hpMax,
  pe,
  peMax,
  san,
  sanMax,
  defense,
  rd,
  conditions,
  onHPChange,
  onPEChange,
  onSANChange,
  onConditionsChange,
  onLogEntry,
  className
}: SessionCombatPanelProps) {
  const [damageInput, setDamageInput] = useState('');
  const [isTrueDamage, setIsTrueDamage] = useState(false);
  const [healInput, setHealInput] = useState('');
  const [sanDamageInput, setSanDamageInput] = useState('');
  const [lastDamageResult, setLastDamageResult] = useState<{
    original: number;
    reduced: number;
    final: number;
  } | null>(null);

  const { processResourceChange, processDamageWhileDying } = useAutoConditions();

  // Cálculos de estado
  const hpPercent = Math.max(0, Math.min(100, (hp / hpMax) * 100));
  const pePercent = Math.max(0, Math.min(100, (pe / peMax) * 100));
  const sanPercent = Math.max(0, Math.min(100, (san / sanMax) * 100));

  const isCritical = hp <= 0;
  const isLow = hp > 0 && hp <= hpMax * 0.25;
  const isMorrendo = conditions.some(c => c.id === 'morrendo');
  const isInconsciente = conditions.some(c => c.id === 'inconsciente');

  // Aplica dano com cálculo de RD
  const handleApplyDamage = useCallback(() => {
    const damageValue = parseInt(damageInput);
    if (isNaN(damageValue) || damageValue <= 0) return;

    const rdApplied = isTrueDamage ? 0 : rd;
    const finalDamage = Math.max(0, damageValue - rdApplied);
    const newHP = hp - finalDamage;

    setLastDamageResult({
      original: damageValue,
      reduced: rdApplied,
      final: finalDamage
    });

    // Se está morrendo, processa dano adicional
    if (isMorrendo) {
      const result = processDamageWhileDying(conditions, finalDamage);
      onConditionsChange(result.newConditions);
      
      if (result.isDead) {
        onLogEntry?.({
          type: 'death',
          message: '💀 MORTE! Dano recebido enquanto morrendo.',
          canUndo: false
        });
      }
    }

    onHPChange(newHP, finalDamage);

    // Processa condições automáticas
    const conditionResult = processResourceChange(newHP, hpMax, san, sanMax, conditions);
    if (conditionResult.newConditions.length !== conditions.length ||
        conditionResult.newConditions.some((c, i) => c.id !== conditions[i]?.id)) {
      onConditionsChange(conditionResult.newConditions);
    }

    // Log
    const rdText = isTrueDamage ? ' (dano verdadeiro)' : rdApplied > 0 ? ` (RD: -${rdApplied})` : '';
    onLogEntry?.({
      type: 'damage',
      message: `HP -${finalDamage}${rdText}`,
      details: { value: finalDamage, previousValue: hp },
      canUndo: true
    });

    setDamageInput('');
  }, [damageInput, isTrueDamage, rd, hp, hpMax, san, sanMax, conditions, isMorrendo, 
      onHPChange, onConditionsChange, processResourceChange, processDamageWhileDying, onLogEntry]);

  // Aplica cura
  const handleApplyHeal = useCallback((amount?: number) => {
    const healValue = amount ?? parseInt(healInput);
    if (isNaN(healValue) || healValue <= 0) return;

    const newHP = Math.min(hpMax, hp + healValue);
    onHPChange(newHP);

    // Processa condições automáticas
    const conditionResult = processResourceChange(newHP, hpMax, san, sanMax, conditions);
    if (conditionResult.newConditions.length !== conditions.length) {
      onConditionsChange(conditionResult.newConditions);
    }

    onLogEntry?.({
      type: 'heal',
      message: `HP +${healValue} (${hp} → ${newHP})`,
      details: { value: healValue, previousValue: hp },
      canUndo: true
    });

    setHealInput('');
  }, [healInput, hp, hpMax, san, sanMax, conditions, onHPChange, onConditionsChange, 
      processResourceChange, onLogEntry]);

  // Aplica dano de sanidade
  const handleApplySanDamage = useCallback((amount?: number) => {
    const sanValue = amount ?? parseInt(sanDamageInput);
    if (isNaN(sanValue) || sanValue <= 0) return;

    const newSAN = Math.max(0, san - sanValue);
    onSANChange(newSAN);

    // Processa condições automáticas
    const conditionResult = processResourceChange(hp, hpMax, newSAN, sanMax, conditions);
    if (conditionResult.newConditions.length !== conditions.length) {
      onConditionsChange(conditionResult.newConditions);
    }

    onLogEntry?.({
      type: 'san',
      message: `SAN -${sanValue} (${san} → ${newSAN})`,
      details: { value: sanValue, previousValue: san },
      canUndo: true
    });

    setSanDamageInput('');
  }, [sanDamageInput, san, sanMax, hp, hpMax, conditions, onSANChange, onConditionsChange,
      processResourceChange, onLogEntry]);

  // Ajuste rápido de HP
  const handleQuickHP = useCallback((delta: number) => {
    const newHP = Math.max(-hpMax, Math.min(hpMax, hp + delta));
    onHPChange(newHP, delta < 0 ? Math.abs(delta) : undefined);

    const conditionResult = processResourceChange(newHP, hpMax, san, sanMax, conditions);
    if (conditionResult.newConditions.length !== conditions.length) {
      onConditionsChange(conditionResult.newConditions);
    }

    onLogEntry?.({
      type: delta < 0 ? 'damage' : 'heal',
      message: `HP ${delta > 0 ? '+' : ''}${delta} (${hp} → ${newHP})`,
      canUndo: true
    });
  }, [hp, hpMax, san, sanMax, conditions, onHPChange, onConditionsChange, processResourceChange, onLogEntry]);

  // Ajuste rápido de PE
  const handleQuickPE = useCallback((delta: number) => {
    const newPE = Math.max(0, Math.min(peMax, pe + delta));
    onPEChange(newPE);

    onLogEntry?.({
      type: 'pe',
      message: `PE ${delta > 0 ? '+' : ''}${delta} (${pe} → ${newPE})`,
      canUndo: true
    });
  }, [pe, peMax, onPEChange, onLogEntry]);

  // Ajuste rápido de SAN
  const handleQuickSAN = useCallback((delta: number) => {
    const newSAN = Math.max(0, Math.min(sanMax, san + delta));
    onSANChange(newSAN);

    const conditionResult = processResourceChange(hp, hpMax, newSAN, sanMax, conditions);
    if (conditionResult.newConditions.length !== conditions.length) {
      onConditionsChange(conditionResult.newConditions);
    }

    onLogEntry?.({
      type: 'san',
      message: `SAN ${delta > 0 ? '+' : ''}${delta} (${san} → ${newSAN})`,
      canUndo: true
    });
  }, [san, sanMax, hp, hpMax, conditions, onSANChange, onConditionsChange, processResourceChange, onLogEntry]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Barras de Recursos */}
      <div className="space-y-3">
        {/* HP */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Heart className={cn(
                "w-4 h-4",
                isCritical ? "text-destructive" : isLow ? "text-warning" : "text-health"
              )} />
              <span className="text-sm font-medium">HP</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[-5, -1].map(v => (
                  <Button
                    key={v}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:bg-destructive/10"
                    onClick={() => handleQuickHP(v)}
                  >
                    <span className="text-xs font-mono">{v}</span>
                  </Button>
                ))}
              </div>
              <span className={cn(
                "font-mono text-sm min-w-[60px] text-center",
                isCritical && "text-destructive font-bold",
                isLow && "text-warning"
              )}>
                {hp}/{hpMax}
              </span>
              <div className="flex items-center gap-0.5">
                {[1, 5].map(v => (
                  <Button
                    key={v}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-green-500 hover:bg-green-500/10"
                    onClick={() => handleQuickHP(v)}
                  >
                    <span className="text-xs font-mono">+{v}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <Progress 
            value={hpPercent} 
            className={cn(
              "h-3",
              isCritical && "[&>div]:bg-destructive",
              isLow && "[&>div]:bg-warning"
            )}
          />
        </div>

        {/* PE */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-energy" />
              <span className="text-sm font-medium">PE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[-3, -1].map(v => (
                  <Button
                    key={v}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-energy hover:bg-energy/10"
                    onClick={() => handleQuickPE(v)}
                  >
                    <span className="text-xs font-mono">{v}</span>
                  </Button>
                ))}
              </div>
              <span className="font-mono text-sm min-w-[60px] text-center text-energy">
                {pe}/{peMax}
              </span>
              <div className="flex items-center gap-0.5">
                {[1, 3].map(v => (
                  <Button
                    key={v}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-energy hover:bg-energy/10"
                    onClick={() => handleQuickPE(v)}
                  >
                    <span className="text-xs font-mono">+{v}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <Progress value={pePercent} className="h-2 [&>div]:bg-energy" />
        </div>

        {/* SAN */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Brain className={cn(
                "w-4 h-4",
                san === 0 ? "text-destructive" : san <= sanMax * 0.3 ? "text-warning" : "text-sanity"
              )} />
              <span className="text-sm font-medium">SAN</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[-3, -1].map(v => (
                  <Button
                    key={v}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-sanity hover:bg-sanity/10"
                    onClick={() => handleQuickSAN(v)}
                  >
                    <span className="text-xs font-mono">{v}</span>
                  </Button>
                ))}
              </div>
              <span className={cn(
                "font-mono text-sm min-w-[60px] text-center",
                san === 0 && "text-destructive font-bold",
                san > 0 && san <= sanMax * 0.3 && "text-warning"
              )}>
                {san}/{sanMax}
              </span>
              <div className="flex items-center gap-0.5">
                {[1, 3].map(v => (
                  <Button
                    key={v}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-sanity hover:bg-sanity/10"
                    onClick={() => handleQuickSAN(v)}
                  >
                    <span className="text-xs font-mono">+{v}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <Progress 
            value={sanPercent} 
            className={cn(
              "h-2",
              san === 0 && "[&>div]:bg-destructive",
              san > 0 && san <= sanMax * 0.3 && "[&>div]:bg-warning"
            )}
          />
        </div>
      </div>

      {/* Info de Combate */}
      <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border/50">
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">Defesa:</span>
          <span className="font-mono text-sm font-medium">{defense}</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5">
          <Swords className="w-4 h-4 text-amber-500" />
          <span className="text-xs text-muted-foreground">RD:</span>
          <span className="font-mono text-sm font-medium">{rd}</span>
        </div>
      </div>

      {/* Seção de Dano */}
      <div className="space-y-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
        <div className="flex items-center gap-2">
          <Skull className="w-4 h-4 text-destructive" />
          <span className="text-sm font-medium">Aplicar Dano</span>
        </div>
        
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Dano"
            value={damageInput}
            onChange={(e) => setDamageInput(e.target.value)}
            className="flex-1 h-9"
            min={0}
          />
          <Button
            variant="destructive"
            size="sm"
            onClick={handleApplyDamage}
            disabled={!damageInput || parseInt(damageInput) <= 0}
            className="px-4"
          >
            <Minus className="w-4 h-4 mr-1" />
            Aplicar
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="trueDamage"
            checked={isTrueDamage}
            onCheckedChange={(checked) => setIsTrueDamage(!!checked)}
          />
          <Label htmlFor="trueDamage" className="text-xs text-muted-foreground cursor-pointer">
            Dano Verdadeiro (ignora RD)
          </Label>
        </div>

        {/* Resultado do último dano */}
        <AnimatePresence>
          {lastDamageResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs bg-destructive/10 rounded p-2 mt-2"
            >
              <span className="text-muted-foreground">Último: </span>
              <span className="font-mono">
                {lastDamageResult.original}
                {lastDamageResult.reduced > 0 && (
                  <span className="text-green-500"> - {lastDamageResult.reduced} RD</span>
                )}
                <span className="text-destructive"> = {lastDamageResult.final} dano</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Seção de Cura */}
      <div className="space-y-2 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium">Cura Rápida</span>
        </div>
        
        <div className="flex gap-1 flex-wrap">
          {[5, 10, 15, 20].map(amount => (
            <Button
              key={amount}
              variant="outline"
              size="sm"
              className="text-green-500 border-green-500/30 hover:bg-green-500/10"
              onClick={() => handleApplyHeal(amount)}
            >
              +{amount}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="text-green-500 border-green-500/30 hover:bg-green-500/10"
            onClick={() => handleApplyHeal(hpMax - hp)}
            disabled={hp >= hpMax}
          >
            Max
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Valor"
            value={healInput}
            onChange={(e) => setHealInput(e.target.value)}
            className="flex-1 h-8"
            min={0}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleApplyHeal()}
            disabled={!healInput || parseInt(healInput) <= 0}
            className="text-green-500 border-green-500/30 hover:bg-green-500/10"
          >
            <Plus className="w-4 h-4 mr-1" />
            Curar
          </Button>
        </div>
      </div>

      {/* Seção de Dano SAN */}
      <div className="space-y-2 p-3 rounded-lg bg-sanity/5 border border-sanity/20">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-sanity" />
          <span className="text-sm font-medium">Dano de Sanidade</span>
        </div>
        
        <div className="flex gap-1 flex-wrap">
          {[1, 2, 3, 5].map(amount => (
            <Button
              key={amount}
              variant="outline"
              size="sm"
              className="text-sanity border-sanity/30 hover:bg-sanity/10"
              onClick={() => handleApplySanDamage(amount)}
            >
              -{amount}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Valor"
            value={sanDamageInput}
            onChange={(e) => setSanDamageInput(e.target.value)}
            className="flex-1 h-8"
            min={0}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleApplySanDamage()}
            disabled={!sanDamageInput || parseInt(sanDamageInput) <= 0}
            className="text-sanity border-sanity/30 hover:bg-sanity/10"
          >
            <Minus className="w-4 h-4 mr-1" />
            Aplicar
          </Button>
        </div>
      </div>

      {/* Alertas de Estado */}
      <AnimatePresence>
        {isMorrendo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-destructive/20 border border-destructive text-destructive"
          >
            <Skull className="w-5 h-5" />
            <div>
              <div className="font-bold">MORRENDO!</div>
              <div className="text-xs opacity-80">
                Contador: {conditions.find(c => c.id === 'morrendo')?.dyingCounter ?? '?'} rodadas
              </div>
            </div>
          </motion.div>
        )}

        {isInconsciente && !isMorrendo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-warning/20 border border-warning text-warning"
          >
            <span className="text-lg">💤</span>
            <div className="font-medium">Inconsciente</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
