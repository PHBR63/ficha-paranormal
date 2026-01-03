/**
 * MobileSustainedRitualsPanel - Painel de rituais sustentados para mobile
 * Exibe lista de rituais ativos com swipe para desativar
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Sparkles,
  X,
  Timer,
  Brain,
  Shield,
  Swords,
  Zap,
  Flame,
  Droplet,
  Ghost,
  Skull,
  Heart,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SustainedRitual } from '@/hooks';
import { getElementConfig } from '@/lib/element-config';

// Ícones por elemento
const ELEMENT_ICONS: Record<string, typeof Sparkles> = {
  'Sangue': Droplet,
  'Morte': Skull,
  'Energia': Zap,
  'Conhecimento': Brain,
  'Medo': Ghost,
  'Fogo': Flame,
  'default': Sparkles,
};

interface MobileSustainedRitualsPanelProps {
  rituals: SustainedRitual[];
  onDeactivate: (id: string) => void;
  onClearAll: () => void;
  className?: string;
}

// Card de ritual com swipe
const RitualCard = memo(function RitualCard({
  ritual,
  onDeactivate,
}: {
  ritual: SustainedRitual;
  onDeactivate: () => void;
}) {
  const [dragX, setDragX] = useState(0);
  const elementConfig = getElementConfig(ritual.element);
  const ElementIcon = ELEMENT_ICONS[ritual.element] || ELEMENT_ICONS.default;
  
  const effect = ritual.effect;
  const hasDefense = effect?.defenseModifier !== undefined;
  const hasAttack = effect?.attackModifier !== undefined;
  const hasDamage = effect?.damageModifier !== undefined;
  const hasWeaponEffect = effect?.weaponEffect !== undefined;
  const hasTempHP = effect?.tempHP !== undefined;
  const hasDamageReduction = effect?.damageReduction !== undefined;

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -100) {
      if ('vibrate' in navigator) navigator.vibrate(30);
      onDeactivate();
    }
    setDragX(0);
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Background de deleção */}
      <div className={cn(
        "absolute inset-y-0 right-0 w-24 flex items-center justify-end pr-4",
        "bg-destructive/80 transition-opacity",
        dragX < -50 ? "opacity-100" : "opacity-0"
      )}>
        <X className="w-5 h-5 text-destructive-foreground" />
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        onDrag={(_, info) => setDragX(info.offset.x)}
        onDragEnd={handleDragEnd}
        animate={{ x: 0 }}
        className={cn(
          "relative flex items-center gap-2 p-3",
          "bg-secondary/30 border border-border/50 rounded-lg",
          elementConfig?.border
        )}
      >
        {/* Ícone do elemento */}
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          "bg-gradient-to-br from-background to-muted border",
          elementConfig?.border || "border-border"
        )}>
          <ElementIcon className={cn("w-5 h-5", elementConfig?.text)} />
        </div>

        {/* Info do ritual */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm truncate">{ritual.ritualName}</span>
            <Badge variant="outline" className="text-[10px] shrink-0">
              {ritual.circle}º
            </Badge>
            {ritual.isConcentrating && (
              <Brain className="w-3 h-3 text-warning shrink-0" />
            )}
          </div>
          
          {/* Efeitos ativos */}
          <div className="flex flex-wrap gap-1 mt-1">
            {hasDefense && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 gap-0.5">
                <Shield className="w-2.5 h-2.5 text-blue-400" />
                +{effect!.defenseModifier}
              </Badge>
            )}
            {hasAttack && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 gap-0.5">
                <Swords className="w-2.5 h-2.5 text-green-400" />
                +{effect!.attackModifier}
              </Badge>
            )}
            {hasDamage && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 gap-0.5">
                <Zap className="w-2.5 h-2.5 text-red-400" />
                +{effect!.damageModifier}
              </Badge>
            )}
            {hasWeaponEffect && effect!.weaponEffect?.extraDice && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 gap-0.5">
                <Flame className="w-2.5 h-2.5 text-orange-400" />
                +{effect!.weaponEffect.extraDice.count}d{effect!.weaponEffect.extraDice.type}
              </Badge>
            )}
            {hasTempHP && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 gap-0.5">
                <Heart className="w-2.5 h-2.5 text-pink-400" />
                PV temp
              </Badge>
            )}
            {hasDamageReduction && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 gap-0.5">
                <Shield className="w-2.5 h-2.5 text-amber-400" />
                RD {effect!.damageReduction!.amount}
              </Badge>
            )}
          </div>
        </div>

        {/* Botão de encerrar */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDeactivate}
          className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-destructive"
        >
          <X className="w-4 h-4" />
        </Button>
      </motion.div>
    </div>
  );
});

export const MobileSustainedRitualsPanel = memo(function MobileSustainedRitualsPanel({
  rituals,
  onDeactivate,
  onClearAll,
  className,
}: MobileSustainedRitualsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  if (rituals.length === 0) return null;

  return (
    <div className={cn("ordo-panel", className)}>
      {/* Header colapsável */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-paranormal" />
          <span className="text-sm font-medium">Rituais Sustentados</span>
          <Badge variant="secondary" className="text-[10px]">
            {rituals.length}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {rituals.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmClearAll(true);
              }}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Limpar
            </Button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Conteúdo */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 space-y-2">
              <AnimatePresence mode="popLayout">
                {rituals.map((ritual) => (
                  <motion.div
                    key={ritual.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, height: 0 }}
                  >
                    <RitualCard
                      ritual={ritual}
                      onDeactivate={() => onDeactivate(ritual.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              
              <p className="text-[10px] text-muted-foreground text-center pt-1">
                Deslize para a esquerda para encerrar
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmação limpar tudo */}
      <AlertDialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
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
    </div>
  );
});

export default MobileSustainedRitualsPanel;
