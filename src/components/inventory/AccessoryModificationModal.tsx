import { getModificationCategoryError } from '@/lib/inventory-modifications';
/**
 * Modal de Modificações para Acessórios
 * Baseado na Tabela 3.9 do livro oficial - Ordem Paranormal RPG
 * 
 * Modificações disponíveis (apenas para acessórios):
 * - Aprimorado: Aumenta bônus em perícia para +5
 * - Discreto: +5 testes de ocultar, -1 espaço
 * - Função Adicional: +2 em perícia adicional
 * - Instrumental: Funciona como kit de perícia
 * 
 * Cada modificação aumenta a categoria do item em I.
 * Cada modificação só pode ser aplicada ao mesmo acessório uma vez.
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
import { Briefcase, Wrench, Check, Star, EyeOff, PlusCircle, BookOpen } from '@/components/icons/ordem-icons';

import { ACCESSORY_MODIFICATIONS, calculateAccessorySkillBonuses, validateAccessoryModifications, type AccessoryConfiguration, type AccessoryModification } from '@/lib/accessory-modifications';
import { SKILLS } from '@/lib/character-data';
export { ACCESSORY_MODIFICATIONS, type AccessoryModification } from '@/lib/accessory-modifications';

// Ícones por modificação
const MOD_ICONS: Record<AccessoryModification, React.ComponentType<{ className?: string }>> = {
  aprimorado: Star,
  aprimorado_adicional: Star,
  discreto: EyeOff,
  funcao_adicional: PlusCircle,
  instrumental: BookOpen,
};

// Ordem de categorias
const CATEGORY_ORDER = ['0', 'I', 'II', 'III', 'IV'] as const;

interface AccessoryModificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemCategory: string;
  itemSpaces: number | '*';
  currentModifications: AccessoryModification[];
  catalogId?: string;
  currentConfiguration?: AccessoryConfiguration;
  onApplyModifications: (modifications: AccessoryModification[], configuration?: AccessoryConfiguration) => void | Promise<void>;
}

export function AccessoryModificationModal({
  open,
  onOpenChange,
  itemName,
  itemCategory,
  itemSpaces,
  currentModifications,
  catalogId,
  currentConfiguration,
  onApplyModifications,
}: AccessoryModificationModalProps) {
  const [selectedMods, setSelectedMods] = useState<AccessoryModification[]>(() => [...new Set(currentModifications)]);

  const [configuration, setConfiguration] = useState<AccessoryConfiguration>(currentConfiguration ?? {});
  useEffect(() => { if (open) setConfiguration(currentConfiguration ?? {}); }, [open, currentConfiguration]);
  const configurationError = validateAccessoryModifications(selectedMods, configuration, catalogId);

  const categoryError = getModificationCategoryError(itemCategory, selectedMods.length);
  const configurationChanged = JSON.stringify(configuration) !== JSON.stringify(currentConfiguration ?? {});

  const [isApplying, setIsApplying] = useState(false);
  // Abrir de novo ou receber a ficha atualizada deve refletir o registro persistido.
  useEffect(() => {
    if (open) setSelectedMods([...new Set(currentModifications)]);
  }, [open, currentModifications]);

  // Modificações já aplicadas previamente (permanentes)
  const alreadyAppliedMods = useMemo(
    () => new Set(currentModifications),
    [currentModifications]
  );

  // Categoria final
  const finalCategory = useMemo(() => {
    const baseIndex = CATEGORY_ORDER.indexOf(itemCategory as typeof CATEGORY_ORDER[number]);
    const newModsCount = selectedMods.filter(m => !alreadyAppliedMods.has(m)).length;
    const newIndex = Math.min(baseIndex + newModsCount + alreadyAppliedMods.size, CATEGORY_ORDER.length - 1);
    return CATEGORY_ORDER[newIndex];
  }, [itemCategory, selectedMods, alreadyAppliedMods]);

  // Espaços finais
  const finalSpaces = useMemo(() => {
    if (itemSpaces === '*') return '*';
    let spaces = itemSpaces;
    selectedMods.forEach(modId => {
      const mod = ACCESSORY_MODIFICATIONS.find(m => m.id === modId);
      if (mod?.spaceModifier) spaces += mod.spaceModifier;
    });
    return Math.max(0, spaces);
  }, [itemSpaces, selectedMods]);

  // Toggle de modificação
  const toggleModification = (modId: AccessoryModification) => {
    if (alreadyAppliedMods.has(modId)) return;
    if (modId === 'aprimorado_adicional' && !selectedMods.includes('funcao_adicional')) return;

    setSelectedMods(prev =>
      prev.includes(modId)
        ? prev.filter(m => m !== modId && !(modId === 'funcao_adicional' && m === 'aprimorado_adicional' && !alreadyAppliedMods.has(m)))
        : [...prev, modId]
    );
  };

  // Aplicar
  const handleApply = async () => {
    if (categoryError || configurationError || isApplying || (!configurationChanged && !selectedMods.some(mod => !alreadyAppliedMods.has(mod)))) return;
    setIsApplying(true);
    try {
      await onApplyModifications([...new Set([...currentModifications, ...selectedMods])], configuration);
      onOpenChange(false);
    } catch {
      // O painel apresenta a falha; manter a seleção aberta permite repetir.
    } finally { setIsApplying(false); }
  };

  const hasNewMods = selectedMods.some(m => !alreadyAppliedMods.has(m));

  return (
    <MobileModal open={open} onOpenChange={onOpenChange}>
      <MobileModalContent size="md" className="h-[85vh] max-h-[85vh] flex flex-col p-0">
        <MobileModalHeader bordered className="p-4 sm:p-6 shrink-0">
          <MobileModalTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Modificações: {itemName}
          </MobileModalTitle>
          <MobileModalDescription>
            Tabela 3.9 — Cada modificação aumenta a categoria em I. Aprimorado pode beneficiar a função principal e a função adicional uma vez cada.
          </MobileModalDescription>
        </MobileModalHeader>

        <MobileModalBody className="px-4 sm:px-6 py-4 flex-1 overflow-y-auto">
          {categoryError && <p role="alert" className="text-amber-300 text-sm mb-3">{categoryError}</p>}
          {/* Resumo do item */}
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

            <Separator className="my-2" />

            <div className="text-sm text-muted-foreground">
              Espaços: <span className="font-medium text-foreground">
                {finalSpaces === '*' ? 'Especial' : finalSpaces}
              </span>
              {finalSpaces !== itemSpaces && itemSpaces !== '*' && (
                <span className="text-green-400 ml-1">(era {itemSpaces})</span>
              )}
            </div>
          </div>

          <div className="space-y-3 mb-4">
            {(['utensilio', 'vestimenta'].includes(catalogId ?? '') || configuration.primarySkill || selectedMods.includes('aprimorado')) && (
              <label className="block text-sm text-foreground">Perícia principal
                <select aria-label="Perícia principal" className="block w-full bg-background border rounded p-2 mt-1" value={configuration.primarySkill ?? ''}
                  disabled={!!currentConfiguration?.primarySkill} onChange={e => setConfiguration(prev => ({ ...prev, primarySkill: e.target.value }))}>
                  <option value="">Escolha a perícia</option>
                  {SKILLS.filter(s => !['luta', 'pontaria'].includes(s.id)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
            )}
            {selectedMods.includes('funcao_adicional') && (
              <label className="block text-sm text-foreground">Perícia de Função Adicional
                <select aria-label="Perícia de Função Adicional" className="block w-full bg-background border rounded p-2 mt-1" value={configuration.additionalSkill ?? ''}
                  disabled={!!currentConfiguration?.additionalSkill} onChange={e => setConfiguration(prev => ({ ...prev, additionalSkill: e.target.value }))}>
                  <option value="">Escolha outra perícia</option>
                  {SKILLS.filter(s => !['luta', 'pontaria', configuration.primarySkill].includes(s.id)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
            )}
            {selectedMods.includes('instrumental') && (
              <label className="block text-sm text-foreground">Kit de Instrumental
                <select aria-label="Kit de Instrumental" className="block w-full bg-background border rounded p-2 mt-1" value={configuration.kitSkill ?? ''}
                  disabled={!!currentConfiguration?.kitSkill} onChange={e => setConfiguration(prev => ({ ...prev, kitSkill: e.target.value }))}>
                  <option value="">Escolha o kit</option>
                  {SKILLS.filter(s => ['crime', 'enganacao', 'medicina', 'tecnologia'].includes(s.id)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
            )}
            {Object.entries(calculateAccessorySkillBonuses(selectedMods, configuration)).map(([skill, bonus]) =>
              <p key={skill} className="text-sm text-foreground">{SKILLS.find(entry => entry.id === skill)?.name}: +{bonus} previsto, sujeito à conferência do mestre.</p>)}
            {configurationError && <p role="status" className="text-amber-300 text-sm">{configurationError}</p>}
            <p className="text-sm text-muted-foreground">As perícias beneficiadas precisam ser conferidas com o mestre. Os bônus não substituem treinamento nem se acumulam com bônus de outros itens.</p>
          </div>
          {/* Lista de modificações */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Modificações Disponíveis ({ACCESSORY_MODIFICATIONS.length})
            </h3>
            {ACCESSORY_MODIFICATIONS.map(mod => {
              const isSelected = selectedMods.includes(mod.id);
              const isLocked = alreadyAppliedMods.has(mod.id);
              const missingRequirement = (mod.id === 'aprimorado_adicional' && !selectedMods.includes('funcao_adicional')) || (mod.id === 'aprimorado' && catalogId === 'kit_pericia');
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
                  onClick={isLocked || missingRequirement ? undefined : () => toggleModification(mod.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      onClick={event => event.stopPropagation()}
                      checked={isSelected}
                      onCheckedChange={isLocked || missingRequirement ? undefined : () => toggleModification(mod.id)}
                      disabled={isLocked || missingRequirement}
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
                      <p className="text-xs text-foreground mt-1 font-medium">Efeito: {mod.effect}</p>
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
              disabled={!!categoryError || !!configurationError || isApplying || (!hasNewMods && !configurationChanged)}
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
