/**
 * Modal de Modificações para Munições
 * Baseado na Tabela 3.5 do livro oficial - Ordem Paranormal RPG
 * 
 * Modificações disponíveis (apenas para munições):
 * - Dum dum: +1 multiplicador de crítico (+1 Cat)
 * - Explosiva: +2d6 dano (+1 Cat)
 * 
 * Cada modificação aumenta a categoria da munição em I.
 * Cada modificação só pode ser aplicada uma vez.
 */

import { useState, useMemo, useEffect } from 'react';
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
import { Target, Wrench, Check, Skull, AlertTriangle } from '@/components/icons/ordem-icons';
import { type AmmoModification, AMMO_MODIFICATIONS } from '@/lib/catalogs';

// Ícones por modificação de munição
const AMMO_MOD_ICONS: Record<AmmoModification, React.ComponentType<{ className?: string }>> = {
  dum_dum: Skull,
  explosiva: AlertTriangle,
};

// Ordem de categorias
const CATEGORY_ORDER = ['0', 'I', 'II', 'III', 'IV'] as const;

interface AmmoModificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemCategory: string;
  currentModifications: AmmoModification[];
  onApplyModifications: (modifications: AmmoModification[]) => void | Promise<void>;
}

export function AmmoModificationModal({
  open,
  onOpenChange,
  itemName,
  itemCategory,
  currentModifications,
  onApplyModifications,
}: AmmoModificationModalProps) {
  const [selectedMods, setSelectedMods] = useState<AmmoModification[]>(() => [...new Set(currentModifications)]);

  const [isApplying, setIsApplying] = useState(false);
  // Abrir de novo ou receber a ficha atualizada deve refletir o registro persistido.
  useEffect(() => {
    if (open) setSelectedMods([...new Set(currentModifications)]);
  }, [open, currentModifications]);

  // Modificações já aplicadas previamente (permanentes, bloqueadas)
  const alreadyAppliedMods = useMemo(
    () => new Set(currentModifications),
    [currentModifications]
  );

  // Categoria final: base + total de mods selecionadas
  const finalCategory = useMemo(() => {
    const baseIndex = CATEGORY_ORDER.indexOf(itemCategory as typeof CATEGORY_ORDER[number]);
    const newModsCount = selectedMods.filter(m => !alreadyAppliedMods.has(m)).length;
    const newIndex = Math.min(baseIndex + newModsCount + alreadyAppliedMods.size, CATEGORY_ORDER.length - 1);
    return CATEGORY_ORDER[newIndex];
  }, [itemCategory, selectedMods, alreadyAppliedMods]);

  // Toggle de modificação
  const toggleModification = (modId: AmmoModification) => {
    if (alreadyAppliedMods.has(modId)) return;

    setSelectedMods(prev =>
      prev.includes(modId)
        ? prev.filter(m => m !== modId)
        : [...prev, modId]
    );
  };

  // Aplicar
  const handleApply = async () => {
    if (isApplying || !selectedMods.some(mod => !alreadyAppliedMods.has(mod))) return;
    setIsApplying(true);
    try {
      await onApplyModifications([...new Set([...currentModifications, ...selectedMods])]);
      onOpenChange(false);
    } catch {
      // O painel apresenta a falha; manter a seleção aberta permite repetir.
    } finally { setIsApplying(false); }
  };

  const hasNewMods = selectedMods.some(m => !alreadyAppliedMods.has(m));

  return (
    <MobileModal open={open} onOpenChange={onOpenChange}>
      <MobileModalContent size="md" className="flex flex-col p-0">
        <MobileModalHeader bordered className="p-4 sm:p-6 shrink-0">
          <MobileModalTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Modificações: {itemName}
          </MobileModalTitle>
          <MobileModalDescription>
            Tabela 3.5 — Cada modificação aumenta a categoria em I. Cada uma só pode ser aplicada uma vez.
          </MobileModalDescription>
        </MobileModalHeader>

        <MobileModalBody className="px-4 sm:px-6 py-4 flex-1 overflow-y-auto">
          {/* Resumo da munição */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border mb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm font-medium text-foreground">{itemName}</span>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  Base: Cat {itemCategory === '0' ? '-' : itemCategory}
                </Badge>
                {finalCategory !== itemCategory && (
                  <Badge variant="outline" className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">
                    → Cat {finalCategory}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Lista de modificações */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Modificações de Munição ({AMMO_MODIFICATIONS.length})
            </h3>
            {AMMO_MODIFICATIONS.map(mod => {
              const modId = mod.id as AmmoModification;
              const isSelected = selectedMods.includes(modId);
              const isLocked = alreadyAppliedMods.has(modId);
              const Icon = AMMO_MOD_ICONS[modId];

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
                  onClick={isLocked ? undefined : () => toggleModification(modId)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      onClick={event => event.stopPropagation()}
                      checked={isSelected}
                      onCheckedChange={isLocked ? undefined : () => toggleModification(modId)}
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
                      {mod.criticalMultiplierBonus && (
                        <p className="text-xs text-primary/80 mt-1 font-medium">
                          Efeito: +{mod.criticalMultiplierBonus} multiplicador de crítico
                        </p>
                      )}
                      {mod.damageBonus && (
                        <p className="text-xs text-primary/80 mt-1 font-medium">
                          Efeito: {mod.damageBonus} dano adicional
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </MobileModalBody>

        <MobileModalFooter className="p-4 sm:p-6 shrink-0">
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleApply}
              disabled={isApplying || !hasNewMods}
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
