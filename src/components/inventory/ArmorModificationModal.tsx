/**
 * Modal de Modificações para Proteções
 * Baseado na Tabela 3.7 do livro oficial - Ordem Paranormal RPG
 * 
 * Modificações disponíveis:
 * - Antibombas (apenas pesada)
 * - Blindada (apenas pesada)
 * - Discreta (apenas leve)
 * - Reforçada (leve e pesada)
 * 
 * Cada modificação aumenta a categoria do item em I.
 * Modificações iguais não se acumulam.
 * Uma proteção não pode ser reforçada e discreta ao mesmo tempo.
 */

import { useState, useMemo } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Shield, ArrowUp, ArrowDown, Check, Wrench, Bomb, ShieldPlus, EyeOff, ShieldCheck } from 'lucide-react';
import {
  type CatalogArmor,
  type ArmorModification,
  type ArmorModificationData,
  ARMOR_MODIFICATIONS,
  calculateModifiedArmorStats,
  getArmorModificationById,
} from '@/lib/catalogs';

// Ícones por modificação
const MOD_ICONS: Record<ArmorModification, React.ComponentType<{ className?: string }>> = {
  antibombas: Bomb,
  blindada: ShieldPlus,
  discreta: EyeOff,
  reforcada: ShieldCheck,
};

// Ordem de categorias para cálculo
const CATEGORY_ORDER = ['0', 'I', 'II', 'III', 'IV'] as const;

interface ArmorModificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  armor: CatalogArmor;
  currentModifications: ArmorModification[];
  onApplyModifications: (modifications: ArmorModification[]) => void;
}

export function ArmorModificationModal({
  open,
  onOpenChange,
  armor,
  currentModifications,
  onApplyModifications,
}: ArmorModificationModalProps) {
  const [selectedMods, setSelectedMods] = useState<ArmorModification[]>(currentModifications);

  // Modificações já aplicadas previamente (permanentes)
  const alreadyAppliedMods = useMemo(
    () => new Set(currentModifications),
    [currentModifications]
  );

  // Modificações disponíveis para este tipo de proteção
  const availableMods = useMemo(() => {
    return ARMOR_MODIFICATIONS.filter(mod => mod.applicableTo.includes(armor.type));
  }, [armor.type]);

  // Stats calculados com modificações selecionadas
  const modifiedStats = useMemo(() => {
    return calculateModifiedArmorStats(armor, selectedMods);
  }, [armor, selectedMods]);

  // Categoria final (cada modificação nova aumenta em I)
  const finalCategory = useMemo(() => {
    const baseIndex = CATEGORY_ORDER.indexOf(armor.category as typeof CATEGORY_ORDER[number]);
    const newModsCount = selectedMods.filter(m => !alreadyAppliedMods.has(m)).length;
    const newIndex = Math.min(baseIndex + newModsCount + alreadyAppliedMods.size, CATEGORY_ORDER.length - 1);
    return CATEGORY_ORDER[newIndex];
  }, [armor.category, selectedMods, alreadyAppliedMods]);

  // Verifica conflito: Discreta + Reforçada não podem coexistir
  const hasConflict = selectedMods.includes('discreta') && selectedMods.includes('reforcada');

  // Toggle de modificação
  const toggleModification = (modId: ArmorModification) => {
    if (alreadyAppliedMods.has(modId)) return;

    setSelectedMods(prev =>
      prev.includes(modId)
        ? prev.filter(m => m !== modId)
        : [...prev, modId]
    );
  };

  // Aplicar modificações
  const handleApply = () => {
    if (hasConflict) return;
    onApplyModifications(selectedMods);
    onOpenChange(false);
  };

  // Há novas modificações para aplicar?
  const hasNewMods = selectedMods.some(m => !alreadyAppliedMods.has(m));

  return (
    <MobileModal open={open} onOpenChange={onOpenChange}>
      <MobileModalContent size="md" className="h-[85vh] max-h-[85vh] flex flex-col p-0">
        <MobileModalHeader bordered className="p-4 sm:p-6 shrink-0">
          <MobileModalTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Modificações: {armor.name}
          </MobileModalTitle>
          <MobileModalDescription>
            Tabela 3.7 — Cada modificação aumenta a categoria em I. Modificações iguais não se acumulam.
          </MobileModalDescription>
        </MobileModalHeader>

        <MobileModalBody className="px-4 sm:px-6 py-4 flex-1 overflow-y-auto">
          {/* Resumo da proteção */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border mb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm font-medium text-foreground">{armor.name}</span>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  Base: Cat {armor.category}
                </Badge>
                {finalCategory !== armor.category && (
                  <Badge variant="outline" className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">
                    → Cat {finalCategory}
                  </Badge>
                )}
              </div>
            </div>

            <Separator className="my-2" />

            {/* Stats comparativos */}
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center">
                <div className="text-muted-foreground text-xs mb-1">Defesa</div>
                <div className="flex items-center justify-center gap-1">
                  <span className="font-bold text-primary">+{modifiedStats.defenseBonus}</span>
                  {modifiedStats.defenseBonus !== armor.defenseBonus && (
                    <ArrowUp className="w-3 h-3 text-green-400" />
                  )}
                </div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground text-xs mb-1">RD</div>
                <div className="flex items-center justify-center gap-1">
                  <span className="font-bold text-blue-400">{modifiedStats.rd}</span>
                  {modifiedStats.rd !== (armor.rd || 0) && (
                    <ArrowUp className="w-3 h-3 text-green-400" />
                  )}
                </div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground text-xs mb-1">Espaços</div>
                <div className="flex items-center justify-center gap-1">
                  <span className="font-bold text-muted-foreground">{modifiedStats.spaces}</span>
                  {modifiedStats.spaces !== armor.spaces && (
                    modifiedStats.spaces > armor.spaces
                      ? <ArrowUp className="w-3 h-3 text-red-400" />
                      : <ArrowDown className="w-3 h-3 text-green-400" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Alerta de conflito */}
          {hasConflict && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm mb-4">
              ⚠️ Uma proteção não pode ser reforçada e discreta ao mesmo tempo.
            </div>
          )}

          {/* Lista de modificações */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Modificações Disponíveis ({availableMods.length})
            </h3>
            {availableMods.map(mod => {
              const isSelected = selectedMods.includes(mod.id);
              const isLocked = alreadyAppliedMods.has(mod.id);
              const Icon = MOD_ICONS[mod.id];

              return (
                <div
                  key={mod.id}
                  className={`
                    p-3 rounded-lg border transition-all
                    ${isLocked
                      ? 'bg-green-500/10 border-green-500/50 opacity-75 cursor-default'
                      : isSelected
                        ? 'bg-primary/10 border-primary/50 cursor-pointer'
                        : 'bg-muted/20 border-border hover:border-primary/30 cursor-pointer'
                    }
                  `}
                  onClick={isLocked ? undefined : () => toggleModification(mod.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={isLocked ? undefined : () => toggleModification(mod.id)}
                      disabled={isLocked}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Icon className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-semibold text-foreground text-sm">{mod.name}</span>
                        <Badge variant="outline" className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">
                          +1 Cat
                        </Badge>
                        {isLocked && (
                          <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                            <Check className="w-3 h-3 mr-1" />
                            Aplicada
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{mod.description}</p>
                      <p className="text-xs text-primary/80 mt-1 font-medium">Efeito: {mod.effect}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {availableMods.length === 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">
                Nenhuma modificação disponível para este tipo de proteção.
              </p>
            )}
          </div>
        </MobileModalBody>

        <MobileModalFooter className="p-4 sm:p-6 shrink-0">
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleApply}
              disabled={!hasNewMods || hasConflict}
              className="flex-1"
            >
              <Wrench className="w-4 h-4 mr-2" />
              Aplicar Modificações
            </Button>
          </div>
        </MobileModalFooter>
      </MobileModalContent>
    </MobileModal>
  );
}
