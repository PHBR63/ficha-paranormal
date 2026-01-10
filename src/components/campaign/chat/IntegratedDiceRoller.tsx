/**
 * IntegratedDiceRoller - Rolador de dados integrado ao chat
 * Suporta comandos de texto e interface visual
 */
import { useState, useCallback } from 'react';
import { Dices, ChevronDown, ChevronUp, Minus, Plus, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { rollSkillTest, rollDamage, type DiceRollResult, type DamageResult } from '@/lib/dice-roller';

interface IntegratedDiceRollerProps {
  onRoll: (content: string, type: string, metadata: any) => void;
  characterName?: string;
  disabled?: boolean;
}

// Tipos de rolagem pré-definidos
const ROLL_PRESETS = [
  { id: 'quick', label: 'Teste Rápido', dice: 1, bonus: 0 },
  { id: 'd20', label: '1d20', dice: 1, bonus: 0 },
  { id: '2d20', label: '2d20 (maior)', dice: 2, bonus: 0 },
  { id: '3d20', label: '3d20 (maior)', dice: 3, bonus: 0 },
];

// Parser de comandos de dados no chat
// Formatos: /r 2d20, /roll 3d20+5, /d 1d20 Percepção
export function parseDiceCommand(input: string): { 
  isCommand: boolean; 
  diceCount?: number; 
  bonus?: number; 
  label?: string;
  damageType?: { count: number; sides: number; bonus: number };
} {
  // Remove espaços extras
  const text = input.trim().toLowerCase();
  
  // Verifica se é comando de rolagem
  const commandMatch = text.match(/^\/(?:r|roll|d|rolar|dado)\s+(.+)$/i);
  if (!commandMatch) {
    return { isCommand: false };
  }

  const rollPart = commandMatch[1];

  // Tenta parsear como NdM+B (dano)
  const damageMatch = rollPart.match(/^(\d+)d(\d+)(?:\s*\+\s*(\d+))?(?:\s+(.+))?$/i);
  if (damageMatch) {
    const [, count, sides, bonus, label] = damageMatch;
    const sidesNum = parseInt(sides);
    
    // Se for d20, é teste de atributo
    if (sidesNum === 20) {
      return {
        isCommand: true,
        diceCount: parseInt(count),
        bonus: bonus ? parseInt(bonus) : 0,
        label: label?.trim() || 'Teste',
      };
    }
    
    // Senão é dano
    return {
      isCommand: true,
      damageType: {
        count: parseInt(count),
        sides: sidesNum,
        bonus: bonus ? parseInt(bonus) : 0,
      },
      label: label?.trim() || 'Dano',
    };
  }

  // Formato simples: /r 2 ou /r 3 Força
  const simpleMatch = rollPart.match(/^(\d+)(?:\s+(.+))?$/);
  if (simpleMatch) {
    return {
      isCommand: true,
      diceCount: parseInt(simpleMatch[1]),
      label: simpleMatch[2]?.trim() || 'Teste',
    };
  }

  return { isCommand: false };
}

export function IntegratedDiceRoller({ onRoll, characterName, disabled }: IntegratedDiceRollerProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [diceCount, setDiceCount] = useState(1);
  const [skillBonus, setSkillBonus] = useState(0);
  const [otherBonus, setOtherBonus] = useState(0);
  const [rollLabel, setRollLabel] = useState('');
  const [critThreshold, setCritThreshold] = useState(20);

  // Rolagem de teste de perícia/atributo
  const handleSkillRoll = useCallback(() => {
    const result = rollSkillTest({
      attributeValue: diceCount,
      skillBonus,
      otherBonuses: otherBonus,
      label: rollLabel || 'Teste',
      criticalThreshold: critThreshold,
    });

    const bonusText = (skillBonus + otherBonus) > 0 
      ? ` +${skillBonus + otherBonus}` 
      : '';

    const critText = result.isCritical ? ' ★ CRÍTICO!' : '';
    const content = `🎲 ${result.label}: [${result.dice.join(', ')}]${bonusText} → **${result.total}**${critText}`;

    onRoll(content, 'dice_roll', {
      dice: result.dice,
      keptDice: result.keptDice,
      skillBonus: result.skillBonus,
      otherBonuses: result.otherBonuses,
      total: result.total,
      isCritical: result.isCritical,
      isDisadvantage: result.isDisadvantage,
      label: result.label,
    });

    setOpen(false);
  }, [diceCount, skillBonus, otherBonus, rollLabel, critThreshold, onRoll]);

  // Rolagem rápida de preset
  const handleQuickRoll = useCallback((preset: typeof ROLL_PRESETS[0]) => {
    const result = rollSkillTest({
      attributeValue: preset.dice,
      skillBonus: preset.bonus,
      label: preset.label,
    });

    const content = `🎲 ${preset.label}: [${result.dice.join(', ')}] → **${result.keptDice}**${result.isCritical ? ' ★ CRÍTICO!' : ''}`;

    onRoll(content, 'dice_roll', {
      dice: result.dice,
      keptDice: result.keptDice,
      total: result.keptDice,
      isCritical: result.isCritical,
      label: preset.label,
    });
  }, [onRoll]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={disabled}
          title="Rolar dados"
          className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0"
        >
          <Dices className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-0" 
        align="start"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Dices className="w-4 h-4 text-primary" />
            <span className="font-display text-sm tracking-wider">ROLAGEM</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-6 px-2"
          >
            {expanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </Button>
        </div>

        {/* Quick Rolls */}
        <div className="p-3 border-b border-border">
          <Label className="text-xs text-muted-foreground mb-2 block">Rolagem Rápida</Label>
          <div className="grid grid-cols-4 gap-1.5">
            {ROLL_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                variant="outline"
                size="sm"
                onClick={() => handleQuickRoll(preset)}
                className="text-xs h-8"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Rolagem Customizada */}
        <div className="p-3 space-y-4">
          {/* Pool de dados */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              Pool de Dados (d20)
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setDiceCount(Math.max(0, diceCount - 1))}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <div className="flex-1 text-center">
                <span className={cn(
                  'font-display text-2xl',
                  diceCount === 0 && 'text-destructive'
                )}>
                  {diceCount}
                </span>
                <span className="text-xs text-muted-foreground ml-1">d20</span>
                {diceCount === 0 && (
                  <p className="text-[10px] text-destructive">Desvantagem</p>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setDiceCount(Math.min(5, diceCount + 1))}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="roll-label" className="text-xs text-muted-foreground">
              Descrição
            </Label>
            <Input
              id="roll-label"
              value={rollLabel}
              onChange={(e) => setRollLabel(e.target.value)}
              placeholder="Ex: Percepção, Ocultismo..."
              className="h-8 text-sm mt-1"
            />
          </div>

          {/* Opções avançadas */}
          {expanded && (
            <>
              {/* Bônus de perícia */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Bônus de Perícia: +{skillBonus}
                </Label>
                <Slider
                  value={[skillBonus]}
                  onValueChange={([v]) => setSkillBonus(v)}
                  max={20}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Outros bônus */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Outros Bônus: {otherBonus >= 0 ? '+' : ''}{otherBonus}
                </Label>
                <Slider
                  value={[otherBonus]}
                  onValueChange={([v]) => setOtherBonus(v)}
                  max={10}
                  min={-10}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Margem de crítico */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Crítico em: {critThreshold}+
                </Label>
                <Slider
                  value={[critThreshold]}
                  onValueChange={([v]) => setCritThreshold(v)}
                  max={20}
                  min={15}
                  step={1}
                  className="w-full"
                />
              </div>
            </>
          )}

          {/* Botão de rolar */}
          <Button
            onClick={handleSkillRoll}
            className="w-full font-display tracking-wider"
          >
            <Target className="w-4 h-4 mr-2" />
            ROLAR {diceCount}d20
            {(skillBonus + otherBonus) !== 0 && ` ${skillBonus + otherBonus >= 0 ? '+' : ''}${skillBonus + otherBonus}`}
          </Button>
        </div>

        {/* Dica de comando */}
        <div className="p-2 bg-muted/50 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            💡 Digite <code className="bg-muted px-1 rounded">/r 2d20 Percepção</code> no chat
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
