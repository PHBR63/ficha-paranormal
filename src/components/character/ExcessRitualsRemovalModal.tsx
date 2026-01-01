/**
 * Modal para Remoção de Rituais Excedentes
 * Permite ao usuário selecionar quais rituais remover quando está acima do limite
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Droplet, Skull, BookOpen, Zap, Ghost, Scroll, Trash2, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ALL_RITUALS, Ritual, RitualElement } from '@/lib/rituals/legacy-exports';

// Ícones por elemento de ritual
const ELEMENT_ICONS: Record<RitualElement, React.ComponentType<{ className?: string }>> = {
  sangue: Droplet,
  morte: Skull,
  conhecimento: BookOpen,
  energia: Zap,
  medo: Ghost,
};

// Cores por elemento
const ELEMENT_COLORS: Record<RitualElement, string> = {
  sangue: 'text-red-400',
  morte: 'text-purple-400',
  conhecimento: 'text-blue-400',
  energia: 'text-yellow-400',
  medo: 'text-gray-400',
};

// Labels por elemento
const ELEMENT_LABELS: Record<RitualElement, string> = {
  sangue: 'Sangue',
  morte: 'Morte',
  conhecimento: 'Conhecimento',
  energia: 'Energia',
  medo: 'Medo',
};

interface ExcessRitualsRemovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ritualIds: string[];  // IDs dos rituais atuais do personagem
  maxRituals: number;
  characterId: string;
  onRemoveRituals: (ritualIds: string[]) => Promise<void>;
}

export function ExcessRitualsRemovalModal({
  open,
  onOpenChange,
  ritualIds,
  maxRituals,
  characterId,
  onRemoveRituals,
}: ExcessRitualsRemovalModalProps) {
  const [selectedRituals, setSelectedRituals] = useState<Set<string>>(new Set());
  const [isRemoving, setIsRemoving] = useState(false);

  // Calcula quantos rituais precisam ser removidos
  const excessCount = Math.max(0, ritualIds.length - maxRituals);
  const selectedCount = selectedRituals.size;
  const canConfirm = selectedCount >= excessCount;

  // Busca dados completos dos rituais
  const ritualsWithData = useMemo(() => {
    return ritualIds.map(ritualId => {
      const ritualData = ALL_RITUALS.find(r => r.id === ritualId);
      return {
        id: ritualId,
        name: ritualData?.name || ritualId,
        circle: ritualData?.circle || 1,
        element: ritualData?.element || 'conhecimento',
        description: ritualData?.description || '',
      };
    });
  }, [ritualIds]);

  // Agrupa rituais por elemento para exibição organizada
  const ritualsByElement = useMemo(() => {
    const grouped: Record<string, typeof ritualsWithData> = {};
    ritualsWithData.forEach(ritual => {
      const element = ritual.element;
      if (!grouped[element]) {
        grouped[element] = [];
      }
      grouped[element].push(ritual);
    });
    return grouped;
  }, [ritualsWithData]);

  // Toggle seleção de ritual
  const toggleRitual = (ritualId: string) => {
    setSelectedRituals(prev => {
      const next = new Set(prev);
      if (next.has(ritualId)) {
        next.delete(ritualId);
      } else {
        next.add(ritualId);
      }
      return next;
    });
  };

  // Obtém rituais selecionados para exibição
  const getSelectedRitualNames = () => {
    return ritualsWithData
      .filter(r => selectedRituals.has(r.id))
      .map(r => r.name);
  };

  // Confirma remoção
  const handleConfirm = async () => {
    if (!canConfirm) return;
    
    const removedNames = getSelectedRitualNames();
    const newTotal = ritualIds.length - selectedCount;
    
    setIsRemoving(true);
    try {
      await onRemoveRituals(Array.from(selectedRituals));
      
      // Toast detalhado com os rituais removidos
      toast({
        title: '✓ Rituais removidos com sucesso',
        description: (
          <div className="mt-2 space-y-2">
            <p className="text-sm">
              <span className="font-medium">{removedNames.length}</span> ritual(is) removido(s):
            </p>
            <ul className="text-xs space-y-1 pl-2 border-l-2 border-destructive/30">
              {removedNames.map((name, i) => (
                <li key={i} className="text-muted-foreground">• {name}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">
              Novo total: <span className="font-medium text-foreground">{newTotal}/{maxRituals}</span> rituais
            </p>
          </div>
        ),
        duration: 6000,
      });
      
      setSelectedRituals(new Set());
      onOpenChange(false);
    } catch (error) {
      console.error('[ExcessRitualsRemovalModal] Erro ao remover rituais:', error);
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover os rituais selecionados.',
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(false);
    }
  };

  // Reset ao fechar
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedRituals(new Set());
    }
    onOpenChange(open);
  };

  if (excessCount === 0) return null;

  return (
    <MobileModal open={open} onOpenChange={handleOpenChange}>
      <MobileModalContent size="md">
        <MobileModalHeader>
          <MobileModalTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Remover Rituais Excedentes
          </MobileModalTitle>
          <MobileModalDescription>
            Você possui <span className="font-medium text-foreground">{ritualIds.length}</span> rituais, 
            mas seu limite é <span className="font-medium text-foreground">{maxRituals}</span>.
            Selecione <span className="font-medium text-destructive">{excessCount}</span> ritual(is) para remover.
          </MobileModalDescription>
        </MobileModalHeader>

        {/* Contador de seleção - fixo fora do scroll */}
        <div className="flex items-center justify-between p-3 mx-4 sm:mx-6 rounded-lg bg-muted/50 border">
          <span className="text-sm text-muted-foreground">Selecionados:</span>
          <Badge 
            variant={canConfirm ? 'default' : 'secondary'}
            className={canConfirm ? 'bg-success' : ''}
          >
            {selectedCount}/{excessCount} mínimo
          </Badge>
        </div>

        <MobileModalBody maxHeight="300px">
          <div className="space-y-4">
            {Object.entries(ritualsByElement).map(([element, elementRituals]) => {
              const Icon = ELEMENT_ICONS[element as RitualElement] || Scroll;
              const colorClass = ELEMENT_COLORS[element as RitualElement] || 'text-paranormal';

              return (
                <div key={element} className="space-y-2">
                  {/* Cabeçalho do elemento */}
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${colorClass}`} />
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {ELEMENT_LABELS[element as RitualElement] || element}
                    </span>
                  </div>

                  {/* Rituais do elemento */}
                  {elementRituals.map(ritual => {
                    const isSelected = selectedRituals.has(ritual.id);
                    
                    return (
                      <div
                        key={ritual.id}
                        onClick={() => toggleRitual(ritual.id)}
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
                          <div className="flex items-center gap-2">
                            <p className={`font-medium text-sm ${isSelected ? 'text-destructive' : ''}`}>
                              {ritual.name}
                            </p>
                            <Badge variant="outline" className="text-[10px] h-4">
                              {ritual.circle}º
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {ritual.description}
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
        </MobileModalBody>

        <MobileModalFooter>
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
        </MobileModalFooter>
      </MobileModalContent>
    </MobileModal>
  );
}
