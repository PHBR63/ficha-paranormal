/**
 * Modal para selecionar e aplicar modificações em armas
 * Baseado na Tabela 3.5 do livro oficial de Ordem Paranormal
 */

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Target, Skull, EyeOff, AlertTriangle, Wrench,
  Maximize2, CircleDot, Crosshair, Focus,
  Swords, ArrowUp, Shield, Sparkles
} from 'lucide-react';
import {
  CatalogWeapon,
  WeaponModification,
  WeaponModificationData,
  getAvailableModifications,
  calculateModifiedWeaponStats,
  getWeaponModificationById,
  MODIFICATION_LABELS,
} from '@/lib/weapons-catalog';

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
}: WeaponModificationModalProps) {
  // Estado local para modificações selecionadas
  const [selectedMods, setSelectedMods] = useState<WeaponModification[]>(currentModifications);
  
  // Modificações disponíveis para esta arma
  const availableModifications = useMemo(() => 
    getAvailableModifications(weapon),
    [weapon]
  );
  
  // Estatísticas calculadas com modificações selecionadas
  const modifiedStats = useMemo(() => 
    calculateModifiedWeaponStats(weapon, selectedMods),
    [weapon, selectedMods]
  );
  
  // Toggle de modificação
  const toggleModification = (modId: WeaponModification) => {
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Wrench className="h-5 w-5 text-primary" />
            Modificar: {weapon.name}
          </DialogTitle>
          <DialogDescription>
            Selecione as modificações para aplicar à arma (Tabela 3.5)
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lista de modificações */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Modificações Disponíveis
            </h4>
            
            <ScrollArea className="h-[300px] pr-2">
              <div className="space-y-2">
                {availableModifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Esta arma não pode ser modificada.
                  </p>
                ) : (
                  availableModifications.map((mod) => (
                    <ModificationCard
                      key={mod.id}
                      modification={mod}
                      isSelected={selectedMods.includes(mod.id)}
                      onToggle={() => toggleModification(mod.id)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
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
                <div className="flex items-center gap-2">
                  <CategoryBadge category={weapon.category} />
                  {categoryChanged && (
                    <>
                      <ArrowUp className="h-4 w-4 text-amber-500" />
                      <CategoryBadge category={modifiedStats.finalCategory} />
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
                  Verifique se sua patente permite equipar armas dessa categoria.
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Botões de ação */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleApply}
            className="bg-primary hover:bg-primary/90"
          >
            Aplicar Modificações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Componente para card de modificação
function ModificationCard({
  modification,
  isSelected,
  onToggle,
}: {
  modification: WeaponModificationData;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const labelData = MODIFICATION_LABELS[modification.id];
  const IconComponent = MODIFICATION_ICONS[labelData?.icon || 'Wrench'];
  
  return (
    <div 
      className={`
        p-3 rounded-lg border cursor-pointer transition-all
        ${isSelected 
          ? 'bg-primary/10 border-primary/50' 
          : 'bg-muted/20 border-border hover:border-primary/30'
        }
      `}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <Checkbox 
          checked={isSelected}
          onCheckedChange={onToggle}
          className="mt-1"
        />
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            {IconComponent && <IconComponent className={`h-4 w-4 ${labelData?.color || ''}`} />}
            <span className="font-medium text-sm">{modification.name}</span>
            {modification.categoryIncrease > 0 && (
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
                +{modification.categoryIncrease} Cat
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
