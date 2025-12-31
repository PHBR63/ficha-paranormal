/**
 * AttackSystem - Sistema de ataques com rolagem automática
 * 
 * @deprecated Este componente foi substituído pelo CombatRollModal e CombatWeaponsTable
 * que estão integrados ao SUE (Sistema Unificado de Efeitos).
 * Mantido por compatibilidade legada, mas deve ser removido em versão futura.
 * 
 * Funcionalidades (LEGACY):
 * - Lista armas equipadas
 * - Rolagem de ataque (d20 + atributo + perícia)
 * - Rolagem de dano automática
 * - Detecção de crítico e falha crítica
 * - Histórico de ataques
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sword,
  Target,
  Crosshair,
  Zap,
  ChevronDown,
  ChevronUp,
  Flame,
  Skull,
  AlertTriangle,
  Plus,
  Minus,
  Dices,
  History,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

// Interface para arma
export interface WeaponData {
  id: string;
  name: string;
  attackAttribute: 'agility' | 'strength' | 'intellect' | 'presence';
  damage: string; // Ex: "2d6", "1d8+2"
  damageType: string; // Ex: "Balístico", "Corte", "Impacto"
  range?: string; // Ex: "Curto", "Médio", "Longo"
  critical?: number; // Margem de crítico (default 20)
  criticalMultiplier?: number; // Multiplicador de crítico (default x2)
  special?: string; // Efeitos especiais
  ammoType?: string;
  ammoCurrent?: number;
}

// Interface para resultado de ataque
interface AttackResult {
  id: string;
  timestamp: Date;
  weaponName: string;
  attackRoll: number;
  attackModifier: number;
  attackTotal: number;
  isCritical: boolean;
  isCriticalFail: boolean;
  damageRolls?: number[];
  damageBonus?: number;
  damageTotal?: number;
  damageType?: string;
}

// Interface para atributos do personagem
interface CharacterAttributes {
  agility: number;
  strength: number;
  intellect: number;
  presence: number;
  vigor: number;
}

interface AttackSystemProps {
  weapons: WeaponData[];
  attributes: CharacterAttributes;
  skillBonuses?: Record<string, number>; // Bônus de perícias como Luta, Pontaria
  onAmmoConsume?: (weaponId: string) => void;
}

// Função para parsear string de dano (ex: "2d6+3")
function parseDamage(damageStr: string): { diceCount: number; diceSize: number; bonus: number } {
  const match = damageStr.match(/(\d+)d(\d+)([+-]\d+)?/i);
  if (!match) return { diceCount: 1, diceSize: 6, bonus: 0 };
  
  return {
    diceCount: parseInt(match[1]),
    diceSize: parseInt(match[2]),
    bonus: match[3] ? parseInt(match[3]) : 0,
  };
}

// Função para rolar dados
function rollDice(count: number, size: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * size) + 1);
}

// Função para rolar d20
function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

// Mapeamento de atributos para nomes em PT-BR
const ATTRIBUTE_NAMES: Record<string, string> = {
  agility: 'AGI',
  strength: 'FOR',
  intellect: 'INT',
  presence: 'PRE',
  vigor: 'VIG',
};

export function AttackSystem({
  weapons,
  attributes,
  skillBonuses = {},
  onAmmoConsume,
}: AttackSystemProps) {
  // Estado para expansão do painel
  const [isExpanded, setIsExpanded] = useState(false);
  // Estado para histórico de ataques
  const [attackHistory, setAttackHistory] = useState<AttackResult[]>([]);
  // Estado para modal de resultado
  const [showResultModal, setShowResultModal] = useState(false);
  const [currentResult, setCurrentResult] = useState<AttackResult | null>(null);
  // Estado para modificadores extras
  const [extraModifier, setExtraModifier] = useState(0);

  // Função para realizar ataque
  const performAttack = (weapon: WeaponData, rollDamage: boolean = true) => {
    // Rola d20
    const attackRoll = rollD20();
    
    // Calcula modificador de atributo
    const attributeValue = attributes[weapon.attackAttribute];
    
    // Pega bônus de perícia relevante
    const skillBonus = weapon.range 
      ? (skillBonuses['pontaria'] || 0) 
      : (skillBonuses['luta'] || 0);
    
    const attackModifier = attributeValue + skillBonus + extraModifier;
    const attackTotal = attackRoll + attackModifier;
    
    // Verifica crítico
    const criticalThreshold = weapon.critical || 20;
    const isCritical = attackRoll >= criticalThreshold;
    const isCriticalFail = attackRoll === 1;
    
    // Rola dano se acertou e rollDamage é true
    let damageRolls: number[] | undefined;
    let damageBonus: number | undefined;
    let damageTotal: number | undefined;
    
    if (rollDamage && !isCriticalFail) {
      const { diceCount, diceSize, bonus } = parseDamage(weapon.damage);
      
      // Crítico multiplica os dados
      const multiplier = isCritical ? (weapon.criticalMultiplier || 2) : 1;
      damageRolls = rollDice(diceCount * multiplier, diceSize);
      
      // Adiciona bônus de FOR para armas corpo a corpo
      const strengthBonus = !weapon.range ? attributes.strength : 0;
      damageBonus = bonus + strengthBonus;
      damageTotal = damageRolls.reduce((sum, r) => sum + r, 0) + damageBonus;
    }
    
    // Cria resultado
    const result: AttackResult = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      weaponName: weapon.name,
      attackRoll,
      attackModifier,
      attackTotal,
      isCritical,
      isCriticalFail,
      damageRolls,
      damageBonus,
      damageTotal,
      damageType: weapon.damageType,
    };
    
    // Adiciona ao histórico
    setAttackHistory(prev => [result, ...prev].slice(0, 20));
    
    // Mostra modal de resultado
    setCurrentResult(result);
    setShowResultModal(true);
    
    // Efeitos visuais para crítico
    if (isCritical) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff4444', '#ff8800', '#ffcc00'],
      });
    }
    
    // Consome munição se aplicável
    if (weapon.ammoType && weapon.ammoCurrent !== undefined && onAmmoConsume) {
      onAmmoConsume(weapon.id);
    }
    
    return result;
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="ordo-panel overflow-hidden">
        {/* Header colapsável */}
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            <Sword className="w-5 h-5 text-destructive" />
            <span className="font-display tracking-wider text-sm">ATAQUES</span>
            {weapons.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {weapons.length} arma(s)
              </Badge>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-4 border-t border-border">
            {/* Modificador extra */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Modificador extra:</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setExtraModifier(prev => prev - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className={cn(
                  "w-10 text-center font-mono font-bold",
                  extraModifier > 0 && "text-green-500",
                  extraModifier < 0 && "text-destructive"
                )}>
                  {extraModifier >= 0 ? '+' : ''}{extraModifier}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setExtraModifier(prev => prev + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {extraModifier !== 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setExtraModifier(0)}
                >
                  Resetar
                </Button>
              )}
            </div>

            {/* Lista de armas */}
            {weapons.length > 0 ? (
              <div className="space-y-2">
                {weapons.map((weapon) => (
                  <WeaponCard
                    key={weapon.id}
                    weapon={weapon}
                    attributes={attributes}
                    skillBonuses={skillBonuses}
                    extraModifier={extraModifier}
                    onAttack={() => performAttack(weapon)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Sword className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma arma equipada</p>
                <p className="text-xs">Equipe armas no inventário para atacar</p>
              </div>
            )}

            {/* Histórico de ataques */}
            {attackHistory.length > 0 && (
              <div className="pt-3 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <History className="w-3 h-3" />
                  Últimos ataques
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {attackHistory.slice(0, 5).map((result) => (
                    <div
                      key={result.id}
                      className={cn(
                        "text-xs p-2 rounded-lg cursor-pointer transition-colors",
                        result.isCritical && "bg-yellow-500/10 border border-yellow-500/30",
                        result.isCriticalFail && "bg-destructive/10 border border-destructive/30",
                        !result.isCritical && !result.isCriticalFail && "bg-muted/30"
                      )}
                      onClick={() => {
                        setCurrentResult(result);
                        setShowResultModal(true);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{result.weaponName}</span>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-mono",
                            result.isCritical && "text-yellow-500",
                            result.isCriticalFail && "text-destructive"
                          )}>
                            🎲{result.attackRoll} → {result.attackTotal}
                          </span>
                          {result.damageTotal !== undefined && (
                            <span className="text-destructive font-mono">
                              💥{result.damageTotal}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>

      {/* Modal de resultado */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sword className="w-5 h-5 text-destructive" />
              Resultado do Ataque
            </DialogTitle>
          </DialogHeader>

          {currentResult && (
            <div className="space-y-4">
              {/* Nome da arma */}
              <div className="text-center">
                <h3 className="font-display text-xl">{currentResult.weaponName}</h3>
              </div>

              {/* Resultado do ataque */}
              <div className={cn(
                "p-4 rounded-lg text-center",
                currentResult.isCritical && "bg-yellow-500/20 border-2 border-yellow-500",
                currentResult.isCriticalFail && "bg-destructive/20 border-2 border-destructive",
                !currentResult.isCritical && !currentResult.isCriticalFail && "bg-muted/50 border border-border"
              )}>
                {currentResult.isCritical && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center justify-center gap-2 text-yellow-500 font-display text-lg mb-2"
                  >
                    <Flame className="w-5 h-5" />
                    CRÍTICO!
                    <Flame className="w-5 h-5" />
                  </motion.div>
                )}
                {currentResult.isCriticalFail && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center justify-center gap-2 text-destructive font-display text-lg mb-2"
                  >
                    <Skull className="w-5 h-5" />
                    FALHA CRÍTICA!
                    <Skull className="w-5 h-5" />
                  </motion.div>
                )}

                <div className="flex items-center justify-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Teste de Ataque:</span>
                </div>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className={cn(
                    "font-mono text-2xl",
                    currentResult.attackRoll === 20 && "text-yellow-500",
                    currentResult.attackRoll === 1 && "text-destructive"
                  )}>
                    {currentResult.attackRoll}
                  </span>
                  <span className="text-muted-foreground">+</span>
                  <span className="font-mono text-lg text-muted-foreground">
                    {currentResult.attackModifier}
                  </span>
                  <span className="text-muted-foreground">=</span>
                  <span className="font-display text-3xl font-bold text-primary">
                    {currentResult.attackTotal}
                  </span>
                </div>
              </div>

              {/* Resultado do dano */}
              {currentResult.damageTotal !== undefined && !currentResult.isCriticalFail && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-center"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Crosshair className="w-4 h-4 text-destructive" />
                    <span className="text-sm text-muted-foreground">Dano:</span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {currentResult.damageRolls?.map((roll, i) => (
                      <span
                        key={i}
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center font-mono text-sm",
                          roll === Math.max(...(currentResult.damageRolls || []))
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-muted"
                        )}
                      >
                        {roll}
                      </span>
                    ))}
                    {currentResult.damageBonus !== undefined && currentResult.damageBonus !== 0 && (
                      <>
                        <span className="text-muted-foreground">+</span>
                        <span className="font-mono text-lg">{currentResult.damageBonus}</span>
                      </>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-center gap-2">
                    <span className="font-display text-4xl font-bold text-destructive">
                      {currentResult.damageTotal}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {currentResult.damageType}
                    </Badge>
                  </div>
                </motion.div>
              )}

              {/* Falha crítica - sem dano */}
              {currentResult.isCriticalFail && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-center">
                  <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
                  <p className="text-sm text-destructive">
                    Você errou feio! O Mestre pode aplicar uma consequência.
                  </p>
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => setShowResultModal(false)}
              >
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Collapsible>
  );
}

// Componente para cada arma
interface WeaponCardProps {
  weapon: WeaponData;
  attributes: CharacterAttributes;
  skillBonuses: Record<string, number>;
  extraModifier: number;
  onAttack: () => void;
}

function WeaponCard({ weapon, attributes, skillBonuses, extraModifier, onAttack }: WeaponCardProps) {
  const attributeValue = attributes[weapon.attackAttribute];
  const skillBonus = weapon.range 
    ? (skillBonuses['pontaria'] || 0) 
    : (skillBonuses['luta'] || 0);
  const totalModifier = attributeValue + skillBonus + extraModifier;

  const hasAmmo = weapon.ammoType === undefined || (weapon.ammoCurrent !== undefined && weapon.ammoCurrent > 0);

  return (
    <div className={cn(
      "p-4 rounded-lg border transition-all",
      hasAmmo 
        ? "bg-card/50 border-border hover:border-primary/50" 
        : "bg-muted/30 border-destructive/30 opacity-60"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Nome e tipo */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium truncate">{weapon.name}</span>
            {weapon.range && (
              <Badge variant="outline" className="text-xs">
                {weapon.range}
              </Badge>
            )}
          </div>

          {/* Stats da arma */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  <span>+{totalModifier}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{ATTRIBUTE_NAMES[weapon.attackAttribute]} ({attributeValue}) + 
                     Perícia ({skillBonus})
                     {extraModifier !== 0 && ` + Extra (${extraModifier})`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <span className="flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-destructive" />
              {weapon.damage} {weapon.damageType}
            </span>

            {weapon.critical && weapon.critical < 20 && (
              <span className="flex items-center gap-1 text-yellow-500">
                <Flame className="w-3 h-3" />
                Crit {weapon.critical}+
              </span>
            )}

            {weapon.ammoCurrent !== undefined && (
              <span className={cn(
                "flex items-center gap-1",
                weapon.ammoCurrent === 0 && "text-destructive"
              )}>
                <Sparkles className="w-3 h-3" />
                {weapon.ammoCurrent} munição
              </span>
            )}
          </div>

          {/* Especial */}
          {weapon.special && (
            <p className="text-xs text-primary/70 mt-1">
              ✨ {weapon.special}
            </p>
          )}
        </div>

        {/* Botão de ataque */}
        <Button
          onClick={onAttack}
          disabled={!hasAmmo}
          className="font-display"
          variant={hasAmmo ? "default" : "outline"}
        >
          <Dices className="w-4 h-4 mr-2" />
          ATACAR
        </Button>
      </div>
    </div>
  );
}
