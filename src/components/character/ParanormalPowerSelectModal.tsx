/**
 * Modal de Seleção de Poderes Paranormais
 * 
 * Permite ao jogador escolher poderes paranormais ao usar a habilidade Transcender.
 * Exibe poderes agrupados por elemento com indicadores de pré-requisitos.
 * Mostra efeito base e efeito de afinidade quando aplicável.
 */

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Lock, Sparkles, Droplet, Skull, BookOpen, Zap, Star } from 'lucide-react';
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

interface ParanormalPowerSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPower: (power: ParanormalPower) => void;
  characterPowers: ParanormalPower[];
  elementalAffinity?: ParanormalElement | null;
  affinityActive?: boolean;
}

export function ParanormalPowerSelectModal({
  open,
  onOpenChange,
  onSelectPower,
  characterPowers,
  elementalAffinity,
  affinityActive = false,
}: ParanormalPowerSelectModalProps) {
  // Aba selecionada (elemento)
  const [selectedTab, setSelectedTab] = useState<ParanormalElement | 'generic' | 'all'>('all');

  // IDs dos poderes já escolhidos
  const chosenPowerIds = useMemo(() => 
    characterPowers.map(p => p.id), 
    [characterPowers]
  );

  // Verifica se um poder pode ser escolhido (pré-requisitos atendidos e não duplicado)
  const isPowerAvailable = (power: ParanormalPower): boolean => {
    // Não pode escolher o mesmo poder duas vezes (exceto se tiver afinidade e for do elemento)
    const alreadyHas = chosenPowerIds.includes(power.id);
    if (alreadyHas) {
      // Pode escolher novamente apenas se tiver afinidade ativa e for do elemento de afinidade
      if (affinityActive && power.element === elementalAffinity) {
        // Verifica se já não escolheu duas vezes
        const timesPicked = characterPowers.filter(p => p.id === power.id).length;
        if (timesPicked >= 2) return false;
      } else {
        return false;
      }
    }
    
    return canChoosePower(power, chosenPowerIds);
  };

  // Filtra poderes pela aba selecionada
  const filteredPowers = useMemo(() => {
    if (selectedTab === 'all') {
      return PARANORMAL_POWERS;
    }
    if (selectedTab === 'generic') {
      return getPowersByElement('generic');
    }
    return getPowersByElement(selectedTab as ParanormalElement);
  }, [selectedTab]);

  // Agrupa poderes por elemento para exibição
  const powersByElement = useMemo(() => {
    const elements: (ParanormalElement | 'generic')[] = ['sangue', 'morte', 'conhecimento', 'energia', 'generic'];
    return elements.map(element => ({
      element,
      powers: getPowersByElement(element),
      count: element === 'generic' ? 0 : getElementPowerCount(element, chosenPowerIds),
    }));
  }, [chosenPowerIds]);

  // Renderiza um card de poder
  const renderPowerCard = (power: ParanormalPower) => {
    const available = isPowerAvailable(power);
    const alreadyHas = chosenPowerIds.includes(power.id);
    const isAffinityElement = power.element === elementalAffinity;
    const showAffinityEffect = affinityActive && isAffinityElement && power.affinityEffect;
    
    const ElementIcon = ELEMENT_ICONS[power.element];
    const elementColor = ELEMENT_COLORS[power.element];
    const elementBg = ELEMENT_BG_COLORS[power.element];

    return (
      <Card
        key={power.id}
        className={`
          relative cursor-pointer transition-all duration-200
          ${available ? 'hover:border-primary hover:shadow-md' : 'opacity-50 cursor-not-allowed'}
          ${alreadyHas ? 'border-primary/50 bg-primary/5' : ''}
          ${isAffinityElement && affinityActive ? 'ring-2 ring-primary/30' : ''}
        `}
        onClick={() => available && onSelectPower(power)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded ${elementBg}`}>
                <ElementIcon className={`h-4 w-4 ${elementColor}`} />
              </div>
              <CardTitle className="text-base">{power.name}</CardTitle>
            </div>
            
            <div className="flex items-center gap-1">
              {alreadyHas && (
                <Badge variant="secondary" className="text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Possui
                </Badge>
              )}
              {!available && !alreadyHas && (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
              {isAffinityElement && affinityActive && (
                <Sparkles className="h-4 w-4 text-primary" />
              )}
            </div>
          </div>
          
          <Badge variant="outline" className={`w-fit text-xs ${elementColor}`}>
            {ELEMENT_LABELS[power.element]}
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-2">
          {/* Pré-requisito */}
          {power.prerequisite && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Pré-requisito: </span>
              {power.prerequisite.element && (
                <span>
                  {ELEMENT_LABELS[power.prerequisite.element]} {power.prerequisite.count}
                  {getElementPowerCount(power.prerequisite.element, chosenPowerIds) >= (power.prerequisite.count || 0) 
                    ? ' ✓' 
                    : ` (você tem ${getElementPowerCount(power.prerequisite.element, chosenPowerIds)})`
                  }
                </span>
              )}
            </div>
          )}
          
          {/* Descrição */}
          <CardDescription className="text-sm">
            {power.description}
          </CardDescription>
          
          {/* Efeito Base */}
          <div className="p-2 rounded bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground mb-1">Efeito Base:</p>
            <p className="text-sm">{power.description}</p>
          </div>
          
          {/* Efeito de Afinidade */}
          {power.affinityEffect && (
            <div className={`p-2 rounded ${showAffinityEffect ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30'}`}>
              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Com Afinidade:
              </p>
              <p className={`text-sm ${showAffinityEffect ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {power.affinityEffect}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Escolher Poder Paranormal
          </DialogTitle>
          <DialogDescription>
            Selecione um poder paranormal através da habilidade Transcender.
            {elementalAffinity && (
              <span className="block mt-1">
                <Badge variant="secondary" className="text-xs">
                  Afinidade: {ELEMENT_LABELS[elementalAffinity]}
                  {affinityActive ? ' (Ativa)' : ' (Inativa)'}
                </Badge>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Resumo de poderes por elemento */}
        <div className="flex flex-wrap gap-2 py-2">
          {powersByElement.map(({ element, count }) => {
            const ElementIcon = ELEMENT_ICONS[element];
            const isAffinity = element === elementalAffinity;
            return (
              <Badge
                key={element}
                variant={isAffinity ? 'default' : 'outline'}
                className="flex items-center gap-1"
              >
                <ElementIcon className="h-3 w-3" />
                {ELEMENT_LABELS[element]}: {count}
              </Badge>
            );
          })}
        </div>

        {/* Tabs de filtro por elemento */}
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as typeof selectedTab)}>
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="sangue" className="flex items-center gap-1">
              <Droplet className="h-3 w-3" />
              <span className="hidden sm:inline">Sangue</span>
            </TabsTrigger>
            <TabsTrigger value="morte" className="flex items-center gap-1">
              <Skull className="h-3 w-3" />
              <span className="hidden sm:inline">Morte</span>
            </TabsTrigger>
            <TabsTrigger value="conhecimento" className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              <span className="hidden sm:inline">Conhecimento</span>
            </TabsTrigger>
            <TabsTrigger value="energia" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span className="hidden sm:inline">Energia</span>
            </TabsTrigger>
            <TabsTrigger value="generic" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              <span className="hidden sm:inline">Genérico</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[50vh] mt-4 pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPowers.map(renderPowerCard)}
            </div>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
