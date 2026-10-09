import { ConhecimentoSymbol, EnergiaSymbol, MedoSymbol, MorteSymbol, SangueSymbol } from '@/components/icons/element-symbols';
/**
 * SustainedRitualsPanel - Painel para gerenciar rituais sustentados ativos
 * Exibe lista de rituais ativos com opções para encerrar e ver efeitos
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Sparkles, X, Brain, Shield, Swords, Zap, Flame, Heart, Trash2 } from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';
import { SustainedRitual } from '@/hooks';
import { getElementConfig } from '@/lib/element-config';

// Ícones por elemento
const ELEMENT_ICONS: Record<string, typeof Sparkles> = {
  'Sangue': SangueSymbol,
  'Morte': MorteSymbol,
  'Energia': EnergiaSymbol,
  'Conhecimento': ConhecimentoSymbol,
  'Medo': MedoSymbol,
  'Fogo': Flame,
  'default': Sparkles,
};

interface SustainedRitualsPanelProps {
  rituals: SustainedRitual[];
  onDeactivate: (id: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function SustainedRitualsPanel({
  rituals,
  onDeactivate,
  onClearAll,
  className,
}: SustainedRitualsPanelProps) {
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  if (rituals.length === 0) {
    return null;
  }

  return (
    <Card className={cn("border-primary/30 bg-card/50", className)}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Rituais Sustentados
          <Badge variant="secondary" className="ml-1">{rituals.length}</Badge>
        </CardTitle>
        
        {rituals.length > 1 && (
          <AlertDialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3 h-3 mr-1" />
                Encerrar todos
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Encerrar todos os rituais?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso irá encerrar {rituals.length} rituais sustentados ativos. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => { onClearAll(); setConfirmClearAll(false); }}>
                  Encerrar Todos
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <ScrollArea className="max-h-[200px]">
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {rituals.map((ritual) => (
                <SustainedRitualCard
                  key={ritual.id}
                  ritual={ritual}
                  onDeactivate={() => onDeactivate(ritual.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface SustainedRitualCardProps {
  ritual: SustainedRitual;
  onDeactivate: () => void;
}

function SustainedRitualCard({ ritual, onDeactivate }: SustainedRitualCardProps) {
  const elementConfig = getElementConfig(ritual.element);
  const ElementIcon = ELEMENT_ICONS[ritual.element] || ELEMENT_ICONS.default;
  
  // Extrai efeitos para exibição
  const effect = ritual.effect;
  const hasDefense = effect?.defenseModifier !== undefined;
  const hasAttack = effect?.attackModifier !== undefined;
  const hasDamage = effect?.damageModifier !== undefined;
  const hasWeaponEffect = effect?.weaponEffect !== undefined;
  const hasTempHP = effect?.tempHP !== undefined;
  const hasDamageReduction = effect?.damageReduction !== undefined;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg",
        "bg-secondary/30 border border-border/50",
        "hover:border-primary/30 transition-colors"
      )}
    >
      {/* Ícone do elemento */}
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
        "bg-gradient-to-br from-background to-muted border",
        elementConfig?.border || "border-border"
      )}>
        <ElementIcon className={cn("w-4 h-4", elementConfig?.text)} />
      </div>

      {/* Info do ritual */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-sm truncate">{ritual.ritualName}</span>
          <Badge variant="outline" className="text-[10px] shrink-0">
            {ritual.circle}º
          </Badge>
        </div>
        
        {/* Efeitos ativos */}
        <div className="flex flex-wrap gap-1 mt-0.5">
          <TooltipProvider delayDuration={300}>
            {hasDefense && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 gap-0.5">
                    <Shield className="w-2.5 h-2.5 text-blue-400" />
                    +{effect!.defenseModifier}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  +{effect!.defenseModifier} Defesa
                </TooltipContent>
              </Tooltip>
            )}
            
            {hasAttack && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 gap-0.5">
                    <Swords className="w-2.5 h-2.5 text-green-400" />
                    +{effect!.attackModifier}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  +{effect!.attackModifier} Ataque
                </TooltipContent>
              </Tooltip>
            )}
            
            {hasDamage && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 gap-0.5">
                    <Zap className="w-2.5 h-2.5 text-red-400" />
                    +{effect!.damageModifier}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  +{effect!.damageModifier} Dano
                </TooltipContent>
              </Tooltip>
            )}
            
            {hasWeaponEffect && effect!.weaponEffect?.extraDice && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 gap-0.5">
                    <Flame className="w-2.5 h-2.5 text-orange-400" />
                    +{effect!.weaponEffect.extraDice.count}d{effect!.weaponEffect.extraDice.type}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  +{effect!.weaponEffect.extraDice.count}d{effect!.weaponEffect.extraDice.type} {effect!.weaponEffect.damageType || 'dano'}
                </TooltipContent>
              </Tooltip>
            )}
            
            {hasTempHP && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 gap-0.5">
                    <Heart className="w-2.5 h-2.5 text-pink-400" />
                    PV temp
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {effect!.tempHP!.diceCount}d{effect!.tempHP!.diceType}
                  {effect!.tempHP!.bonus ? `+${effect!.tempHP!.bonus}` : ''} PV temporários
                </TooltipContent>
              </Tooltip>
            )}
            
            {hasDamageReduction && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 gap-0.5">
                    <Shield className="w-2.5 h-2.5 text-amber-400" />
                    RD {effect!.damageReduction!.amount}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  RD {effect!.damageReduction!.amount} contra {effect!.damageReduction!.types.join(', ')}
                </TooltipContent>
              </Tooltip>
            )}
            
            {ritual.isConcentrating && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 gap-0.5 border-yellow-500/50">
                    <Brain className="w-2.5 h-2.5 text-yellow-400" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Requer concentração
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </div>

      {/* Botão de encerrar */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onDeactivate}
          aria-label={`Encerrar ${ritual.ritualName}`}
          title={`Encerrar ${ritual.ritualName}`}
        className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      >
        <X className="w-4 h-4" />
      </Button>
    </motion.div>
  );
}
