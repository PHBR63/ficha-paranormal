/**
 * Modal para Remoção de Poderes Paranormais Excedentes
 * Permite ao usuário selecionar quais poderes remover quando está acima do limite
 */

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Droplet, Skull, BookOpen, Zap, Star, Trash2, Check } from 'lucide-react';
import { SavedParanormalPower, ParanormalElement, ELEMENT_LABELS, ELEMENT_COLORS } from '@/lib/paranormal-powers';
import { toast } from '@/hooks/use-toast';

// Ícones por elemento
const ELEMENT_ICONS: Record<ParanormalElement | 'generic', React.ComponentType<{ className?: string }>> = {
  sangue: Droplet,
  morte: Skull,
  conhecimento: BookOpen,
  energia: Zap,
  generic: Star,
};

interface ExcessPowersRemovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  powers: SavedParanormalPower[];
  maxPowers: number;
  characterId: string;
  onRemovePowers: (powerIds: string[], powersToArchive: SavedParanormalPower[]) => Promise<void>;
}

export function ExcessPowersRemovalModal({
  open,
  onOpenChange,
  powers,
  maxPowers,
  characterId,
  onRemovePowers,
}: ExcessPowersRemovalModalProps) {
  const [selectedPowers, setSelectedPowers] = useState<Set<string>>(new Set());
  const [isRemoving, setIsRemoving] = useState(false);

  // Calcula quantos poderes precisam ser removidos
  const excessCount = Math.max(0, powers.length - maxPowers);
  const selectedCount = selectedPowers.size;
  const canConfirm = selectedCount >= excessCount;

  // Agrupa poderes por elemento para exibição organizada
  const powersByElement = useMemo(() => {
    const grouped: Record<string, SavedParanormalPower[]> = {};
    powers.forEach(power => {
      const element = power.element || 'generic';
      if (!grouped[element]) {
        grouped[element] = [];
      }
      grouped[element].push(power);
    });
    return grouped;
  }, [powers]);

  // Toggle seleção de poder
  const togglePower = (powerId: string) => {
    setSelectedPowers(prev => {
      const next = new Set(prev);
      if (next.has(powerId)) {
        next.delete(powerId);
      } else {
        next.add(powerId);
      }
      return next;
    });
  };

  // Obtém poderes selecionados para exibição e arquivamento
  const getSelectedPowers = () => {
    return powers.filter(p => selectedPowers.has(p.id));
  };

  // Obtém nomes dos poderes selecionados para exibição
  const getSelectedPowerNames = () => {
    return getSelectedPowers().map(p => p.name);
  };

  // Confirma remoção
  const handleConfirm = async () => {
    if (!canConfirm) return;
    
    const removedPowers = getSelectedPowers();
    const removedNames = removedPowers.map(p => p.name);
    const newTotal = powers.length - selectedCount;
    
    setIsRemoving(true);
    try {
      // Passa os IDs e os poderes completos para arquivamento
      await onRemovePowers(Array.from(selectedPowers), removedPowers);
      
      // Toast detalhado com os poderes removidos
      toast({
        title: '✓ Poderes removidos com sucesso',
        description: (
          <div className="mt-2 space-y-2">
            <p className="text-sm">
              <span className="font-medium">{removedNames.length}</span> poder(es) removido(s):
            </p>
            <ul className="text-xs space-y-1 pl-2 border-l-2 border-destructive/30">
              {removedNames.map((name, i) => (
                <li key={i} className="text-muted-foreground">• {name}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">
              Novo total: <span className="font-medium text-foreground">{newTotal}/{maxPowers}</span> poderes
            </p>
          </div>
        ),
        duration: 6000,
      });
      
      setSelectedPowers(new Set());
      onOpenChange(false);
    } catch (error) {
      console.error('[ExcessPowersRemovalModal] Erro ao remover poderes:', error);
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover os poderes selecionados.',
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(false);
    }
  };

  // Reset ao fechar
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedPowers(new Set());
    }
    onOpenChange(open);
  };

  if (excessCount === 0) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Remover Poderes Excedentes
          </DialogTitle>
          <DialogDescription>
            Você possui <span className="font-medium text-foreground">{powers.length}</span> poderes, 
            mas seu limite é <span className="font-medium text-foreground">{maxPowers}</span>.
            Selecione <span className="font-medium text-destructive">{excessCount}</span> poder(es) para remover.
          </DialogDescription>
        </DialogHeader>

        {/* Contador de seleção */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
          <span className="text-sm text-muted-foreground">Selecionados:</span>
          <Badge 
            variant={canConfirm ? 'default' : 'secondary'}
            className={canConfirm ? 'bg-success' : ''}
          >
            {selectedCount}/{excessCount} mínimo
          </Badge>
        </div>

        {/* Lista de poderes para seleção */}
        <ScrollArea className="max-h-[300px] pr-2">
          <div className="space-y-4">
            {Object.entries(powersByElement).map(([element, elementPowers]) => {
              const Icon = ELEMENT_ICONS[element as ParanormalElement | 'generic'];
              const colorClass = ELEMENT_COLORS[element as ParanormalElement | 'generic'];

              return (
                <div key={element} className="space-y-2">
                  {/* Cabeçalho do elemento */}
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${colorClass}`} />
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {ELEMENT_LABELS[element as ParanormalElement | 'generic']}
                    </span>
                  </div>

                  {/* Poderes do elemento */}
                  {elementPowers.map(power => {
                    const isSelected = selectedPowers.has(power.id);
                    
                    return (
                      <div
                        key={power.id}
                        onClick={() => togglePower(power.id)}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                          transition-all duration-200
                          ${isSelected 
                            ? 'bg-destructive/10 border-destructive/50' 
                            : 'bg-card hover:bg-muted/50 border-border'
                          }
                        `}
                      >
                        <Checkbox 
                          checked={isSelected}
                          className={isSelected ? 'border-destructive data-[state=checked]:bg-destructive' : ''}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${isSelected ? 'text-destructive' : ''}`}>
                            {power.name}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {power.description}
                          </p>
                        </div>
                        {isSelected && (
                          <Trash2 className="w-4 h-4 text-destructive shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={isRemoving}
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canConfirm || isRemoving}
          >
            {isRemoving ? (
              'Removendo...'
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Confirmar Remoção ({selectedCount})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
