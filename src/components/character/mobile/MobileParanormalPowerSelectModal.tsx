/**
 * MobileParanormalPowerSelectModal - Modal de seleção de poderes paranormais para mobile
 * Permite escolher poderes ao usar Transcender com sub-escolhas
 */

import { useState, useMemo, memo, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Check, 
  Lock, 
  Sparkles, 
  Droplet, 
  Skull, 
  BookOpen, 
  Zap, 
  Star,
  Search,
  ChevronRight,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ParanormalPower,
  ParanormalElement,
  PARANORMAL_POWERS,
  getPowersByElement,
  canChoosePower,
  getElementPowerCount,
  ELEMENT_LABELS,
  ELEMENT_COLORS,
  ELEMENT_BG_COLORS,
} from '@/lib/paranormal-powers';

// Ícones por elemento
const ELEMENT_ICONS: Record<ParanormalElement | 'generic', React.ComponentType<{ className?: string }>> = {
  sangue: Droplet,
  morte: Skull,
  conhecimento: BookOpen,
  energia: Zap,
  generic: Star,
};

interface MobileParanormalPowerSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPower: (power: ParanormalPower) => void;
  characterPowers: ParanormalPower[];
  elementalAffinity?: ParanormalElement | null;
  affinityActive?: boolean;
  sanCost?: number;
}

// Card de poder
const PowerCard = memo(function PowerCard({
  power,
  available,
  alreadyHas,
  isAffinityElement,
  affinityActive,
  chosenPowerIds,
  onSelect,
}: {
  power: ParanormalPower;
  available: boolean;
  alreadyHas: boolean;
  isAffinityElement: boolean;
  affinityActive: boolean;
  chosenPowerIds: string[];
  onSelect: () => void;
}) {
  const ElementIcon = ELEMENT_ICONS[power.element];
  const elementColor = ELEMENT_COLORS[power.element];
  const elementBg = ELEMENT_BG_COLORS[power.element];
  const showAffinityEffect = affinityActive && isAffinityElement && power.affinityEffect;

  return (
    <button
      disabled={!available}
      onClick={() => {
        if (available) {
          if ('vibrate' in navigator) navigator.vibrate(15);
          onSelect();
        }
      }}
      className={cn(
        "w-full p-3 rounded-lg border text-left transition-all active:scale-[0.98]",
        available ? "hover:border-primary" : "opacity-50 cursor-not-allowed",
        alreadyHas && "border-primary/50 bg-primary/5",
        isAffinityElement && affinityActive && "ring-1 ring-paranormal/30"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Ícone */}
        <div className={cn("p-1.5 rounded shrink-0", elementBg)}>
          <ElementIcon className={cn("h-4 w-4", elementColor)} />
        </div>
        
        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{power.name}</span>
            <Badge variant="outline" className={cn("text-[9px] px-1", elementColor)}>
              {ELEMENT_LABELS[power.element]}
            </Badge>
            {alreadyHas && (
              <Badge variant="secondary" className="text-[9px] gap-0.5">
                <Check className="h-2.5 w-2.5" />
                Possui
              </Badge>
            )}
          </div>
          
          {/* Pré-requisito */}
          {power.prerequisite && (
            <p className="text-[10px] text-muted-foreground mt-1">
              <span className="font-medium">Requer: </span>
              {ELEMENT_LABELS[power.prerequisite.element!]} {power.prerequisite.count}
              {getElementPowerCount(power.prerequisite.element!, chosenPowerIds) >= (power.prerequisite.count || 0) 
                ? ' ✓' 
                : ` (você tem ${getElementPowerCount(power.prerequisite.element!, chosenPowerIds)})`
              }
            </p>
          )}
          
          {/* Descrição */}
          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
            {power.description}
          </p>
          
          {/* Efeito de afinidade */}
          {showAffinityEffect && (
            <div className="flex items-start gap-1.5 p-2 mt-2 rounded bg-paranormal/10 border border-paranormal/30">
              <Sparkles className="w-3 h-3 text-paranormal shrink-0 mt-0.5" />
              <p className="text-[10px] text-paranormal font-medium line-clamp-2">
                {power.affinityEffect}
              </p>
            </div>
          )}
        </div>
        
        {/* Indicadores */}
        <div className="flex items-center gap-1 shrink-0">
          {!available && !alreadyHas && (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
          {isAffinityElement && affinityActive && (
            <Sparkles className="h-4 w-4 text-paranormal" />
          )}
          {available && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
    </button>
  );
});

export const MobileParanormalPowerSelectModal = memo(function MobileParanormalPowerSelectModal({
  open,
  onOpenChange,
  onSelectPower,
  characterPowers,
  elementalAffinity,
  affinityActive = false,
  sanCost = 0,
}: MobileParanormalPowerSelectModalProps) {
  const [search, setSearch] = useState('');
  const [selectedElement, setSelectedElement] = useState<ParanormalElement | 'generic' | 'all'>('all');

  // IDs dos poderes já escolhidos
  const chosenPowerIds = useMemo(() => 
    characterPowers.map(p => p.id), 
    [characterPowers]
  );

  // Verifica disponibilidade
  const isPowerAvailable = useCallback((power: ParanormalPower): boolean => {
    const alreadyHas = chosenPowerIds.includes(power.id);
    if (alreadyHas) {
      if (affinityActive && power.element === elementalAffinity) {
        const timesPicked = characterPowers.filter(p => p.id === power.id).length;
        if (timesPicked >= 2) return false;
      } else {
        return false;
      }
    }
    return canChoosePower(power, chosenPowerIds);
  }, [chosenPowerIds, characterPowers, affinityActive, elementalAffinity]);

  // Filtra poderes
  const filteredPowers = useMemo(() => {
    let powers = selectedElement === 'all' 
      ? PARANORMAL_POWERS 
      : getPowersByElement(selectedElement);
    
    if (search) {
      const query = search.toLowerCase();
      powers = powers.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }
    
    return powers;
  }, [selectedElement, search]);

  // Contagem por elemento
  const elementCounts = useMemo(() => {
    const elements: (ParanormalElement | 'generic')[] = ['sangue', 'morte', 'conhecimento', 'energia', 'generic'];
    return elements.map(element => ({
      element,
      count: element === 'generic' ? 0 : getElementPowerCount(element, chosenPowerIds),
    }));
  }, [chosenPowerIds]);

  const handleSelect = useCallback((power: ParanormalPower) => {
    onSelectPower(power);
    onOpenChange(false);
    setSearch('');
  }, [onSelectPower, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh]">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-paranormal" />
            Escolher Poder Paranormal
          </SheetTitle>
          {elementalAffinity && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Afinidade: {ELEMENT_LABELS[elementalAffinity]}
                {affinityActive ? ' (Ativa)' : ' (Inativa)'}
              </Badge>
              {sanCost > 0 && (
                <Badge variant="outline" className="text-xs text-san">
                  <Brain className="w-3 h-3 mr-1" />
                  -{sanCost} SAN
                </Badge>
              )}
            </div>
          )}
        </SheetHeader>

        {/* Resumo por elemento */}
        <div className="flex gap-1.5 pb-3 overflow-x-auto scrollbar-hide">
          {elementCounts.map(({ element, count }) => {
            const ElementIcon = ELEMENT_ICONS[element];
            const isAffinity = element === elementalAffinity;
            return (
              <Badge
                key={element}
                variant={isAffinity ? 'default' : 'outline'}
                className="flex items-center gap-1 shrink-0"
              >
                <ElementIcon className="h-3 w-3" />
                {ELEMENT_LABELS[element]}: {count}
              </Badge>
            );
          })}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 pb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar poder..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Tabs de elemento */}
        <div className="flex gap-1 pb-3 overflow-x-auto scrollbar-hide">
          <Button
            variant={selectedElement === 'all' ? 'default' : 'outline'}
            size="sm"
            className="shrink-0 text-xs h-7"
            onClick={() => setSelectedElement('all')}
          >
            Todos
          </Button>
          {(['sangue', 'morte', 'conhecimento', 'energia', 'generic'] as const).map(element => {
            const Icon = ELEMENT_ICONS[element];
            return (
              <Button
                key={element}
                variant={selectedElement === element ? 'default' : 'outline'}
                size="sm"
                className="shrink-0 text-xs h-7 gap-1"
                onClick={() => setSelectedElement(element)}
              >
                <Icon className="h-3 w-3" />
                {element === 'generic' ? 'Gen' : ELEMENT_LABELS[element].slice(0, 3)}
              </Button>
            );
          })}
        </div>

        {/* Lista de poderes */}
        <ScrollArea className="h-[calc(90vh-280px)]">
          <div className="space-y-2 pr-4">
            {filteredPowers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum poder encontrado</p>
              </div>
            ) : (
              filteredPowers.map(power => (
                <PowerCard
                  key={power.id}
                  power={power}
                  available={isPowerAvailable(power)}
                  alreadyHas={chosenPowerIds.includes(power.id)}
                  isAffinityElement={power.element === elementalAffinity}
                  affinityActive={affinityActive}
                  chosenPowerIds={chosenPowerIds}
                  onSelect={() => handleSelect(power)}
                />
              ))
            )}
          </div>
        </ScrollArea>

        <div className="pt-4 border-t">
          <Button variant="outline" className="w-full h-10" onClick={() => onOpenChange(false)}>
            <span className="text-sm">Cancelar</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
});

export default MobileParanormalPowerSelectModal;
