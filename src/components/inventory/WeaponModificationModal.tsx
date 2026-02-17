/**
 * Modal para selecionar e aplicar modificações em armas
 * Baseado na Tabela 3.5 do livro oficial de Ordem Paranormal
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
import { 
  Target, Skull, EyeOff, AlertTriangle, Wrench,
  Maximize2, CircleDot, Crosshair, Focus,
  Swords, ArrowUp, ArrowDown, Shield, Sparkles, Star, Check
} from 'lucide-react';
import {
  type CatalogWeapon,
  type WeaponModification,
  type WeaponModificationData,
  getAvailableModifications,
  calculateModifiedWeaponStats,
  getWeaponModificationById,
  MODIFICATION_LABELS,
} from '@/lib/catalogs';

// Mapa de ícones para modificações
const MODIFICATION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Target,
  Skull,
  EyeOff,
  AlertTriangle,
  Wrench,
  Maximize2,
  CircleDot,
  Crosshair,
  Focus,
};

interface WeaponModificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weapon: CatalogWeapon;
  currentModifications: WeaponModification[];
  onApplyModifications: (modifications: WeaponModification[]) => void;
  /** Redução de categoria por habilidade de favorita (1, 2 ou 3) */
  favoriteReduction?: number;
  /** Se a arma está marcada como favorita */
  isFavorite?: boolean;
}

// Componente para badge de categoria
function CategoryBadge({ category, className }: { category: string; className?: string }) {
  const colors: Record<string, string> = {
    '0': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    'I': 'bg-green-500/20 text-green-300 border-green-500/30',
    'II': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'III': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'IV': 'bg-red-500/20 text-red-300 border-red-500/30',
    'especial': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  };
  
  return (
    <Badge variant="outline" className={`${colors[category] || colors['0']} ${className}`}>
      Cat {category}
    </Badge>
  );
}

export function WeaponModificationModal({
  open,
  onOpenChange,
  weapon,
  currentModifications,
  onApplyModifications,
  favoriteReduction,
  isFavorite,
}: WeaponModificationModalProps) {
  // Estado local para modificações selecionadas
  const [selectedMods, setSelectedMods] = useState<WeaponModification[]>(currentModifications);
  
  // Modificações já aplicadas (para exibir com indicador visual)
  const alreadyAppliedMods = useMemo(() => new Set(currentModifications), [currentModifications]);
  
  // Modificações disponíveis para esta arma (excluindo as já aplicadas - novas para adicionar)
  const newAvailableModifications = useMemo(() => 
    getAvailableModifications(weapon, currentModifications),
    [weapon, currentModifications]
  );
  
  // Todas as modificações para exibir: já aplicadas + novas disponíveis
  const displayModifications = useMemo(() => {
    const applied = currentModifications
      .map(id => getWeaponModificationById(id))
      .filter(Boolean) as WeaponModificationData[];
    
    // Junta aplicadas + novas disponíveis, sem duplicatas
    const allMods = [...applied];
    newAvailableModifications.forEach(mod => {
      if (!allMods.some(m => m.id === mod.id)) {
        allMods.push(mod);
      }
    });
    
    return allMods;
  }, [newAvailableModifications, currentModifications]);
  
  // Estatísticas calculadas com modificações selecionadas
  const modifiedStats = useMemo(() => 
    calculateModifiedWeaponStats(weapon, selectedMods),
    [weapon, selectedMods]
  );
  
  // Ordem de categorias para cálculo
  const CATEGORY_ORDER = ['0', 'I', 'II', 'III', 'IV'] as const;
  
  // Calcular categoria efetiva final (modificações + favorita)
  const effectiveFinalCategory = useMemo(() => {
    // Primeiro aplica aumentos de modificações
    const modifiedCategory = modifiedStats.finalCategory;
    
    // Se não tem redução de favorita, retorna categoria modificada
    if (!favoriteReduction || !isFavorite) {
      return modifiedCategory;
    }
    
    // Aplica redução de favorita sobre categoria modificada
    const currentIndex = CATEGORY_ORDER.indexOf(modifiedCategory as typeof CATEGORY_ORDER[number]);
    if (currentIndex === -1) return modifiedCategory;
    
    const newIndex = Math.max(0, currentIndex - favoriteReduction);
    return CATEGORY_ORDER[newIndex] as CatalogWeapon['category'];
  }, [modifiedStats.finalCategory, favoriteReduction, isFavorite]);
  
  // Toggle de modificação (apenas para modificações não aplicadas previamente)
  const toggleModification = (modId: WeaponModification) => {
    // Modificações já aplicadas não podem ser removidas (são permanentes)
    if (alreadyAppliedMods.has(modId)) return;
    
    setSelectedMods(prev => 
      prev.includes(modId) 
        ? prev.filter(m => m !== modId)
        : [...prev, modId]
    );
  };
  
  // Resetar seleção ao abrir
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelectedMods(currentModifications);
    }
    onOpenChange(isOpen);
  };
  
  // Aplicar modificações
  const handleApply = () => {
    onApplyModifications(selectedMods);
    onOpenChange(false);
  };
  
  // Verificar se categoria mudou
  const categoryChanged = modifiedStats.finalCategory !== weapon.category;
  
  return (
    <MobileModal open={open} onOpenChange={handleOpenChange}>
      <MobileModalContent size="lg" className="p-0">
        <MobileModalHeader bordered className="p-4 sm:p-6">
          <MobileModalTitle className="flex items-center gap-2 text-foreground">
            <Wrench className="h-5 w-5 text-primary" />
            Modificar: {weapon.name}
          </MobileModalTitle>
          <MobileModalDescription>
            Selecione as modificações para aplicar à arma (Tabela 3.5)
          </MobileModalDescription>
        </MobileModalHeader>
        
        <MobileModalBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lista de modificações */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Modificações Disponíveis
              </h4>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {displayModifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Esta arma não pode ser modificada.
                  </p>
                ) : (
                  displayModifications.map((mod) => (
                    <ModificationCard
                      key={mod.id}
                      modification={mod}
                      isSelected={selectedMods.includes(mod.id)}
                      isApplied={alreadyAppliedMods.has(mod.id)}
                      onToggle={() => toggleModification(mod.id)}
                    />
                  ))
                )}
              </div>
            </div>
            
            {/* Preview das estatísticas */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Estatísticas Resultantes
              </h4>
              
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                {/* Categoria */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Categoria:</span>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {/* Categoria base */}
                    <CategoryBadge category={weapon.category} />
                    
                    {/* Após modificações (se houver aumento) */}
                    {categoryChanged && (
                      <>
                        <ArrowUp className="h-4 w-4 text-amber-500" />
                        <CategoryBadge category={modifiedStats.finalCategory} />
                      </>
                    )}
                    
                    {/* Categoria efetiva final (com favorita) */}
                    {isFavorite && favoriteReduction && effectiveFinalCategory !== modifiedStats.finalCategory && (
                      <>
                        <ArrowDown className="h-4 w-4 text-yellow-500" />
                        <div className="relative">
                          <CategoryBadge category={effectiveFinalCategory} />
                          <Star className="absolute -top-1 -right-1 w-3 h-3 fill-yellow-400 text-yellow-400" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                {/* Dano */}
                <StatRow
                  label="Dano"
                  original={weapon.damage}
                  modified={modifiedStats.damage}
                  changed={weapon.damage !== modifiedStats.damage}
                  icon={<Swords className="h-4 w-4" />}
                />
                
                {/* Crítico */}
                <StatRow
                  label="Crítico"
                  original={`${weapon.critical}`}
                  modified={`${modifiedStats.criticalMargin}`}
                  changed={weapon.critical !== modifiedStats.criticalMargin}
                  icon={<Skull className="h-4 w-4" />}
                />
                
                {/* Bônus de Ataque */}
                {modifiedStats.attackBonus > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Bônus de Ataque:
                    </span>
                    <span className="text-sm font-medium text-green-400">
                      +{modifiedStats.attackBonus}
                    </span>
                  </div>
                )}
                
                {/* Alcance */}
                {weapon.range && (
                  <StatRow
                    label="Alcance"
                    original={weapon.range}
                    modified={modifiedStats.range || weapon.range}
                    changed={weapon.range !== modifiedStats.range}
                    icon={<Maximize2 className="h-4 w-4" />}
                  />
                )}
                
                {/* Propriedades adicionais */}
                {modifiedStats.addedProperties.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Propriedades Adicionadas:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {modifiedStats.addedProperties.map((prop, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {prop}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Efeitos especiais */}
                {modifiedStats.specialEffects.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Efeitos Especiais:
                    </span>
                    <div className="space-y-1">
                      {modifiedStats.specialEffects.map((effect, i) => (
                        <p key={i} className="text-xs text-primary/80 bg-primary/10 rounded px-2 py-1">
                          {effect}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Aviso de aumento de categoria */}
              {categoryChanged && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <p className="text-xs text-amber-400">
                    ⚠️ As modificações aumentarão a categoria da arma de {weapon.category} para {modifiedStats.finalCategory}.
                    {isFavorite && favoriteReduction 
                      ? ` Com sua arma favorita, a categoria efetiva será ${effectiveFinalCategory}.`
                      : ' Verifique se sua patente permite equipar armas dessa categoria.'}
                  </p>
                </div>
              )}
              
              {/* Aviso explicativo de arma favorita */}
              {isFavorite && favoriteReduction && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-xs text-yellow-400">
                    ⭐ Arma Favorita: A redução de -{favoriteReduction} categoria é aplicada sobre o resultado final (base + modificações).
                  </p>
                </div>
              )}
            </div>
          </div>
        </MobileModalBody>
        
        <MobileModalFooter bordered>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleApply}
            className="bg-primary hover:bg-primary/90"
          >
            Aplicar Modificações
          </Button>
        </MobileModalFooter>
      </MobileModalContent>
    </MobileModal>
  );
}

// Componente para card de modificação
function ModificationCard({
  modification,
  isSelected,
  isApplied,
  onToggle,
}: {
  modification: WeaponModificationData;
  isSelected: boolean;
  /** Indica se a modificação já estava aplicada antes de abrir o modal */
  isApplied: boolean;
  onToggle: () => void;
}) {
  const labelData = MODIFICATION_LABELS[modification.id];
  const IconComponent = MODIFICATION_ICONS[labelData?.icon || 'Wrench'];
  
  // Modificações já aplicadas são permanentes e não podem ser removidas
  const isLocked = isApplied;
  
  return (
    <div 
      className={`
        p-3 rounded-lg border transition-all
        ${isLocked
          ? 'bg-green-500/10 border-green-500/50 opacity-75 cursor-default' 
          : isSelected 
            ? 'bg-primary/10 border-primary/50 cursor-pointer' 
            : 'bg-muted/20 border-border hover:border-primary/30 cursor-pointer'
        }
      `}
      onClick={isLocked ? undefined : onToggle}
    >
      <div className="flex items-start gap-3">
        <Checkbox 
          checked={isSelected}
          onCheckedChange={isLocked ? undefined : onToggle}
          disabled={isLocked}
          className="mt-1"
        />
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {IconComponent && <IconComponent className={`h-4 w-4 ${labelData?.color || ''}`} />}
            <span className="font-medium text-sm">{modification.name}</span>
            {modification.categoryIncrease > 0 && (
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
                +{modification.categoryIncrease} Cat
              </Badge>
            )}
            {isLocked && (
              <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                <Check className="w-3 h-3 mr-1" />
                Aplicada
              </Badge>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground">
            {modification.description}
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente para linha de estatística
function StatRow({
  label,
  original,
  modified,
  changed,
  icon,
}: {
  label: string;
  original: string;
  modified: string;
  changed: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        {icon}
        {label}:
      </span>
      <div className="flex items-center gap-2">
        {changed ? (
          <>
            <span className="text-sm text-muted-foreground line-through">{original}</span>
            <ArrowUp className="h-3 w-3 text-green-500" />
            <span className="text-sm font-medium text-green-400">{modified}</span>
          </>
        ) : (
          <span className="text-sm font-medium">{original}</span>
        )}
      </div>
    </div>
  );
}
