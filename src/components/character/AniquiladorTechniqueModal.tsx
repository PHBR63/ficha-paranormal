/**
 * AniquiladorTechniqueModal - Modal de Técnicas do Aniquilador
 * 
 * Permite selecionar técnicas da Técnica Secreta e Técnica Sublime:
 * - Amplo: Atinge alvo adicional adjacente (NEX 40%+)
 * - Destruidor: +1 multiplicador de crítico (NEX 40%+)
 * - Letal: +2 margem de ameaça, pode ser escolhido 2x para +5 (NEX 65%+)
 * - Perfurante: Ignora até 5 RD do alvo (NEX 65%+)
 * 
 * Custo de PE: 2 PE base + 2 PE por técnica adicional
 * 
 * @module AniquiladorTechniqueModal
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sword, 
  Target, 
  Crosshair, 
  Shield, 
  Zap,
  Check,
  Info,
  Sparkles,
} from '@/components/icons/ordem-icons';
import {
  MobileModal,
  MobileModalContent,
  MobileModalHeader,
  MobileModalBody,
  MobileModalFooter,
  MobileModalTitle,
  MobileModalDescription,
} from '@/components/ui/mobile-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Definição de uma técnica disponível
export interface AniquiladorTechnique {
  id: string;
  name: string;
  description: string;
  minNex: number;
  effects: {
    additionalTargets?: number;      // Amplo
    criticalMultiplierBonus?: number; // Destruidor
    criticalMarginBonus?: number;     // Letal
    ignoreResistance?: number;        // Perfurante
  };
  canSelectTwice?: boolean; // Letal pode ser selecionado 2x
  doubleEffectDescription?: string; // Descrição do efeito dobrado
}

// Catálogo de técnicas do Aniquilador
const ANIQUILADOR_TECHNIQUES: AniquiladorTechnique[] = [
  {
    id: 'amplo',
    name: 'Amplo',
    description: 'O ataque pode atingir um alvo adicional em seu alcance e adjacente ao original (usa o mesmo teste de ataque para ambos).',
    minNex: 40,
    effects: { additionalTargets: 1 },
  },
  {
    id: 'destruidor',
    name: 'Destruidor',
    description: 'Aumenta o multiplicador de crítico da arma em +1.',
    minNex: 40,
    effects: { criticalMultiplierBonus: 1 },
  },
  {
    id: 'letal',
    name: 'Letal',
    description: 'Aumenta a margem de ameaça em +2.',
    minNex: 65,
    effects: { criticalMarginBonus: 2 },
    canSelectTwice: true,
    doubleEffectDescription: 'Pode ser escolhido 2x para +5 de margem de ameaça total.',
  },
  {
    id: 'perfurante',
    name: 'Perfurante',
    description: 'Ignora até 5 pontos de resistência a dano de qualquer tipo do alvo.',
    minNex: 65,
    effects: { ignoreResistance: 5 },
  },
];

// Efeitos consolidados das técnicas selecionadas
export interface TechniqueEffects {
  additionalTargets: number;
  criticalMultiplierBonus: number;
  criticalMarginBonus: number;
  ignoreResistance: number;
  peCost: number;
  selectedTechniques: string[];
  letalCount: number; // Quantas vezes Letal foi selecionado
}

// Props do modal
interface AniquiladorTechniqueModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (effects: TechniqueEffects) => void;
  nex: number;
  currentPE: number;
  weaponName: string;
}

// Ícone por técnica
function TechniqueIcon({ techniqueId }: { techniqueId: string }) {
  switch (techniqueId) {
    case 'amplo':
      return <Target className="w-4 h-4" />;
    case 'destruidor':
      return <Sword className="w-4 h-4" />;
    case 'letal':
      return <Crosshair className="w-4 h-4" />;
    case 'perfurante':
      return <Shield className="w-4 h-4" />;
    default:
      return <Zap className="w-4 h-4" />;
  }
}

export function AniquiladorTechniqueModal({
  open,
  onClose,
  onConfirm,
  nex,
  currentPE,
  weaponName,
}: AniquiladorTechniqueModalProps) {
  // Estado das técnicas selecionadas
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
  const [letalCount, setLetalCount] = useState(0); // 0, 1 ou 2

  // Técnicas disponíveis baseado no NEX
  const availableTechniques = useMemo(() => {
    return ANIQUILADOR_TECHNIQUES.filter(tech => nex >= tech.minNex);
  }, [nex]);

  // Calcula custo de PE: 2 base + 2 por técnica adicional
  const peCost = useMemo(() => {
    const techniqueCount = selectedTechniques.length + (letalCount > 1 ? 1 : 0);
    if (techniqueCount === 0) return 0;
    // Primeira técnica = 2 PE, cada adicional = +2 PE
    return 2 + (techniqueCount - 1) * 2;
  }, [selectedTechniques, letalCount]);

  // Verifica se pode pagar o PE
  const canAffordPE = currentPE >= peCost;

  // Toggle de técnica
  const toggleTechnique = useCallback((techniqueId: string) => {
    if (techniqueId === 'letal') {
      // Letal tem tratamento especial - cicla entre 0, 1, 2
      if (!selectedTechniques.includes('letal')) {
        setSelectedTechniques(prev => [...prev, 'letal']);
        setLetalCount(1);
      } else if (letalCount === 1) {
        setLetalCount(2);
      } else {
        setSelectedTechniques(prev => prev.filter(id => id !== 'letal'));
        setLetalCount(0);
      }
    } else {
      // Outras técnicas - toggle simples
      setSelectedTechniques(prev => 
        prev.includes(techniqueId)
          ? prev.filter(id => id !== techniqueId)
          : [...prev, techniqueId]
      );
    }
  }, [selectedTechniques, letalCount]);

  // Calcula efeitos consolidados
  const consolidatedEffects = useMemo((): TechniqueEffects => {
    let additionalTargets = 0;
    let criticalMultiplierBonus = 0;
    let criticalMarginBonus = 0;
    let ignoreResistance = 0;

    selectedTechniques.forEach(techId => {
      const tech = ANIQUILADOR_TECHNIQUES.find(t => t.id === techId);
      if (!tech) return;

      if (tech.effects.additionalTargets) {
        additionalTargets += tech.effects.additionalTargets;
      }
      if (tech.effects.criticalMultiplierBonus) {
        criticalMultiplierBonus += tech.effects.criticalMultiplierBonus;
      }
      if (tech.effects.criticalMarginBonus) {
        // Letal especial: 1x = +2, 2x = +5
        criticalMarginBonus += letalCount === 2 ? 5 : tech.effects.criticalMarginBonus;
      }
      if (tech.effects.ignoreResistance) {
        ignoreResistance += tech.effects.ignoreResistance;
      }
    });

    return {
      additionalTargets,
      criticalMultiplierBonus,
      criticalMarginBonus,
      ignoreResistance,
      peCost,
      selectedTechniques,
      letalCount,
    };
  }, [selectedTechniques, letalCount, peCost]);

  // Handler de confirmação
  const handleConfirm = () => {
    if (!canAffordPE || selectedTechniques.length === 0) return;
    onConfirm(consolidatedEffects);
    // Reset estado
    setSelectedTechniques([]);
    setLetalCount(0);
    onClose();
  };

  // Handler de fechamento
  const handleClose = () => {
    setSelectedTechniques([]);
    setLetalCount(0);
    onClose();
  };

  // Verifica se a técnica está selecionada
  const isSelected = (techniqueId: string) => selectedTechniques.includes(techniqueId);

  return (
    <MobileModal open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <MobileModalContent size="sm">
        <MobileModalHeader>
          <MobileModalTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Técnica Secreta
          </MobileModalTitle>
          <MobileModalDescription>
            Selecione as técnicas para usar com <span className="font-semibold text-foreground">{weaponName}</span>
          </MobileModalDescription>
        </MobileModalHeader>

        <MobileModalBody useScrollArea={true}>
          <div className="space-y-4">
            {/* Lista de técnicas */}
            <div className="space-y-3">
              {availableTechniques.map((tech) => {
                const selected = isSelected(tech.id);
                const isLetal = tech.id === 'letal';
                
                return (
                  <motion.div
                    key={tech.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-3 rounded-lg border transition-all cursor-pointer",
                      selected 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                    onClick={() => toggleTechnique(tech.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        <TechniqueIcon techniqueId={tech.id} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tech.name}</span>
                          <Badge variant="outline" className="text-[10px]">
                            NEX {tech.minNex}%+
                          </Badge>
                          {isLetal && selected && (
                            <Badge 
                              variant={letalCount === 2 ? "default" : "secondary"}
                              className="text-[10px]"
                            >
                              {letalCount}x (+{letalCount === 2 ? 5 : 2} margem)
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {tech.description}
                        </p>
                        {tech.canSelectTwice && (
                          <p className="text-[10px] text-amber-400/80 mt-1 flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            {tech.doubleEffectDescription}
                          </p>
                        )}
                      </div>

                      <div className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center",
                        selected ? "bg-primary border-primary" : "border-muted-foreground/50"
                      )}>
                        {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Resumo dos efeitos */}
            <AnimatePresence>
              {selectedTechniques.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Efeitos Aplicados:</h4>
                    <div className="flex flex-wrap gap-2">
                      {consolidatedEffects.additionalTargets > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          <Target className="w-3 h-3" />
                          +{consolidatedEffects.additionalTargets} alvo(s)
                        </Badge>
                      )}
                      {consolidatedEffects.criticalMultiplierBonus > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          <Sword className="w-3 h-3" />
                          +{consolidatedEffects.criticalMultiplierBonus} mult. crítico
                        </Badge>
                      )}
                      {consolidatedEffects.criticalMarginBonus > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          <Crosshair className="w-3 h-3" />
                          +{consolidatedEffects.criticalMarginBonus} margem
                        </Badge>
                      )}
                      {consolidatedEffects.ignoreResistance > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          <Shield className="w-3 h-3" />
                          Ignora {consolidatedEffects.ignoreResistance} RD
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </MobileModalBody>

        <MobileModalFooter>
          {/* Custo de PE */}
          <div className="flex items-center gap-2 mr-auto">
            <Zap className={cn(
              "w-4 h-4",
              canAffordPE ? "text-blue-400" : "text-destructive"
            )} />
            <span className={cn(
              "text-sm font-medium",
              !canAffordPE && "text-destructive"
            )}>
              {peCost} PE
            </span>
            <span className="text-xs text-muted-foreground">
              ({currentPE} disponível)
            </span>
          </div>

          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!canAffordPE || selectedTechniques.length === 0}
          >
            Confirmar Técnica
          </Button>
        </MobileModalFooter>
      </MobileModalContent>
    </MobileModal>
  );
}

// Re-export do catálogo para uso externo
export { ANIQUILADOR_TECHNIQUES };
