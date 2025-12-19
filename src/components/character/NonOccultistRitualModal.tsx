/**
 * NonOccultistRitualModal - Modal para não-ocultistas selecionarem rituais
 * 
 * Usado quando:
 * - Personagem adquire o poder geral "Ritual Aprendido" (1 ritual de 1º círculo)
 * - Personagem equipa o Grimório Vivo (3 rituais de até 3º círculo)
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  Droplet,
  Skull,
  BookOpen,
  Zap,
  Ghost,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_RITUALS, Ritual } from '@/lib/rituals/legacy-exports';

// Configuração visual dos elementos (5 elementos oficiais)
const ELEMENT_CONFIG = {
  sangue: { 
    icon: Droplet, 
    label: 'Sangue', 
    color: 'text-red-400', 
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/50' 
  },
  morte: { 
    icon: Skull, 
    label: 'Morte', 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/50' 
  },
  conhecimento: { 
    icon: BookOpen, 
    label: 'Conhecimento', 
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/50' 
  },
  energia: { 
    icon: Zap, 
    label: 'Energia', 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/50' 
  },
  medo: { 
    icon: Ghost, 
    label: 'Medo', 
    color: 'text-emerald-400', 
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/50' 
  },
} as const;

// Tipos de fonte de ritual
export type RitualSource = 'ritual-aprendido' | 'grimorio-vivo' | 'aprender-ritual-poder';

interface NonOccultistRitualModalProps {
  open: boolean;
  onClose: () => void;
  source: RitualSource;
  currentRituals: string[]; // IDs dos rituais já conhecidos
  onConfirm: (rituals: string[]) => void;
}

// Componente de card de ritual individual
function RitualCard({
  ritual,
  isSelected,
  isDisabled,
  onToggle,
}: {
  ritual: Ritual;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const elementConfig = ELEMENT_CONFIG[ritual.element as keyof typeof ELEMENT_CONFIG];
  const ElementIcon = elementConfig?.icon || Circle;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "p-3 rounded-lg border transition-all cursor-pointer",
        isSelected 
          ? cn("border-primary bg-primary/10", elementConfig?.borderColor)
          : "border-border/50 bg-card/50 hover:bg-card/80",
        isDisabled && !isSelected && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => {
        if (!isDisabled || isSelected) {
          onToggle();
        }
      }}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox visual */}
        <div className={cn(
          "w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors",
          isSelected 
            ? "bg-primary border-primary" 
            : "border-muted-foreground"
        )}>
          {isSelected && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header do ritual */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground">{ritual.name}</span>
            <Badge variant="outline" className="text-xs">
              {ritual.circle}º Círculo
            </Badge>
            <Badge 
              variant="secondary" 
              className={cn("text-xs gap-1", elementConfig?.color)}
            >
              <ElementIcon className="w-3 h-3" />
              {elementConfig?.label || ritual.element}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {ritual.cost} PE
            </Badge>
          </div>

          {/* Descrição breve */}
          <p className={cn(
            "text-xs text-muted-foreground mt-1",
            !isExpanded && "line-clamp-2"
          )}>
            {ritual.description}
          </p>

          {/* Botão expandir */}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6 px-2 mt-1"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? 'Ver menos' : 'Ver mais'}
          </Button>

          {/* Detalhes expandidos */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-2 rounded bg-muted/50 text-xs space-y-2">
                  <div className="space-y-1">
                    <p><strong>Execução:</strong> {ritual.execution}</p>
                    <p><strong>Alcance:</strong> {ritual.range}</p>
                    <p><strong>Alvo:</strong> {ritual.target}</p>
                    <p><strong>Duração:</strong> {ritual.duration}</p>
                    {ritual.resistance && (
                      <p><strong>Resistência:</strong> {ritual.resistance}</p>
                    )}
                  </div>
                  
                  {/* Aprimoramentos detalhados */}
                  {ritual.enhancements && ritual.enhancements.length > 0 && (
                    <div className="pt-2 border-t border-border/50 space-y-2">
                      <p className="font-semibold text-primary flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Aprimoramentos
                      </p>
                      <div className="space-y-2">
                        {ritual.enhancements.map((enh, idx) => (
                          <div key={idx} className="p-2 rounded bg-background/50 border border-border/30">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-[10px] font-semibold",
                                  enh.name === 'Verdadeiro' 
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                                    : 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                                )}
                              >
                                {enh.name}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px]">
                                +{enh.cost} PE
                              </Badge>
                              {enh.requirements && (
                                <span className="text-[10px] text-yellow-400 italic">
                                  ({enh.requirements})
                                </span>
                              )}
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                              {enh.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export function NonOccultistRitualModal({
  open,
  onClose,
  source,
  currentRituals,
  onConfirm,
}: NonOccultistRitualModalProps) {
  const [selectedRituals, setSelectedRituals] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCircle, setSelectedCircle] = useState<number | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Configuração baseada na fonte
  const config = useMemo(() => {
    if (source === 'ritual-aprendido') {
      return {
        title: 'Ritual Aprendido',
        description: 'Escolha um ritual de 1º círculo para aprender. Você pode lançá-lo gastando o dobro de PE.',
        maxCircle: 1,
        maxRituals: 1,
        peMultiplier: 2,
        warningText: 'Como não-ocultista, você gasta o dobro de PE para lançar este ritual.',
      };
    } else {
      return {
        title: 'Grimório Vivo',
        description: 'Este item amaldiçoado contém 3 rituais de até 3º círculo que você pode lançar.',
        maxCircle: 3,
        maxRituals: 3,
        peMultiplier: 1,
        warningText: 'Os rituais do Grimório Vivo podem ser lançados normalmente, mas você sofre -2 em Vontade e SAN.',
      };
    }
  }, [source]);

  // Filtrar rituais disponíveis
  const availableRituals = useMemo(() => {
    return ALL_RITUALS.filter(ritual => {
      // Filtrar por círculo máximo
      if (ritual.circle > config.maxCircle) return false;
      
      // Filtrar por rituais já conhecidos
      if (currentRituals.includes(ritual.id)) return false;

      // Filtrar por busca
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!ritual.name.toLowerCase().includes(search) &&
            !ritual.description.toLowerCase().includes(search)) {
          return false;
        }
      }

      // Filtrar por círculo selecionado
      if (selectedCircle !== null && ritual.circle !== selectedCircle) return false;

      // Filtrar por elemento selecionado
      if (selectedElement && ritual.element !== selectedElement) return false;

      return true;
    });
  }, [config.maxCircle, currentRituals, searchTerm, selectedCircle, selectedElement]);

  // Agrupar por círculo
  const ritualsByCircle = useMemo(() => {
    const grouped: Record<number, Ritual[]> = {};
    availableRituals.forEach(ritual => {
      if (!grouped[ritual.circle]) {
        grouped[ritual.circle] = [];
      }
      grouped[ritual.circle].push(ritual);
    });
    return grouped;
  }, [availableRituals]);

  // Toggle ritual
  const handleToggleRitual = (ritualId: string) => {
    if (selectedRituals.includes(ritualId)) {
      setSelectedRituals(prev => prev.filter(id => id !== ritualId));
    } else if (selectedRituals.length < config.maxRituals) {
      setSelectedRituals(prev => [...prev, ritualId]);
    }
  };

  // Confirmar seleção
  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(selectedRituals);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  // Reset ao abrir
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    } else {
      setSelectedRituals([]);
      setSearchTerm('');
      setSelectedCircle(null);
      setSelectedElement(null);
    }
  };

  const canConfirm = selectedRituals.length > 0 && selectedRituals.length <= config.maxRituals;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-paranormal" />
            {config.title}
          </DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>

        {/* Aviso especial */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm">
          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
          <span className="text-yellow-200">{config.warningText}</span>
        </div>

        {/* Contador de seleção */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-muted-foreground">
            Rituais selecionados
          </span>
          <Badge variant={selectedRituals.length === config.maxRituals ? "default" : "secondary"}>
            {selectedRituals.length} / {config.maxRituals}
          </Badge>
        </div>

        {/* Filtros */}
        <div className="space-y-3">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ritual..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filtros de círculo e elemento */}
          <div className="flex gap-2 flex-wrap">
            {/* Círculos disponíveis */}
            {Array.from({ length: config.maxCircle }, (_, i) => i + 1).map(circle => (
              <Button
                key={circle}
                variant={selectedCircle === circle ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCircle(selectedCircle === circle ? null : circle)}
              >
                {circle}º Círculo
              </Button>
            ))}

            <div className="w-px bg-border mx-1" />

            {/* Elementos */}
            {Object.entries(ELEMENT_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <Button
                  key={key}
                  variant={selectedElement === key ? "default" : "outline"}
                  size="sm"
                  className="gap-1"
                  onClick={() => setSelectedElement(selectedElement === key ? null : key)}
                >
                  <Icon className={cn("w-3 h-3", cfg.color)} />
                  {cfg.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Lista de rituais com scroll funcional */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full max-h-[calc(85vh-360px)]">
            <div className="space-y-4 pr-4">
            {Object.entries(ritualsByCircle)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([circle, rituals]) => (
                <div key={circle} className="space-y-2">
                  <h4 className="font-display text-sm tracking-wider text-muted-foreground sticky top-0 bg-background/95 py-1 backdrop-blur-sm">
                    {circle}º CÍRCULO ({rituals.length} rituais)
                  </h4>
                  <div className="space-y-2">
                    {rituals.map(ritual => (
                      <RitualCard
                        key={ritual.id}
                        ritual={ritual}
                        isSelected={selectedRituals.includes(ritual.id)}
                        isDisabled={selectedRituals.length >= config.maxRituals}
                        onToggle={() => handleToggleRitual(ritual.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}

            {availableRituals.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum ritual encontrado</p>
                <p className="text-xs mt-1">Tente ajustar os filtros</p>
              </div>
            )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!canConfirm || isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>Salvando...</>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirmar ({selectedRituals.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
