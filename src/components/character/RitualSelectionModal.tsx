// Modal de Seleção de Rituais para Progressão de NEX
// Permite Ocultistas escolherem novos rituais ao ganhar slots
// ATUALIZADO: Usa sistema unificado de rituais e MobileModal

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Search,
  Lock,
  Droplets,
  Skull,
  BookOpen,
  Zap,
  Ghost,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react';
// Sistema unificado de rituais
import { getAllRituals, getRitualsByMaxCircle } from '@/lib/rituals/ritual-registry';
import { unifiedToLegacy } from '@/lib/rituals/ritual-adapter';
import type { UnifiedRitual } from '@/lib/rituals/types';
// Tipo legado para compatibilidade
import type { Ritual } from '@/lib/rituals/legacy-exports';
// Configuração centralizada de elementos
import { getElementConfigSafe, getElementKeys, ELEMENT_CONFIG, type ParanormalElementType } from '@/lib/element-config';

// Tipo que suporta ambos os formatos
type RitualInput = Ritual | UnifiedRitual;

interface RitualSelectionModalProps {
  open: boolean;
  onClose: () => void;
  currentRituals: string[];
  maxCircle: number;
  newSlots: number;
  onConfirm: (selectedRituals: string[]) => Promise<void>;
}

// Fallback para elemento desconhecido
const FALLBACK_ELEMENT_CONFIG = {
  icon: Ghost,
  label: 'Desconhecido',
  color: 'from-gray-500/20 to-gray-900/20',
  border: 'border-gray-500/50',
  text: 'text-gray-400',
  bg: 'bg-gray-500/10',
  badgeBg: 'bg-gray-500/20 text-gray-300',
};

// Obtém configuração de elemento usando sistema centralizado com fallback
function getElementConfigLocal(element: string) {
  const config = getElementConfigSafe(element);
  
  if (config) {
    return {
      icon: config.icon,
      label: config.label,
      color: config.color,
      border: config.border,
      text: config.text,
      bg: config.bg,
      badgeBg: config.badgeBg,
    };
  }
  
  return FALLBACK_ELEMENT_CONFIG;
}

// Lista de elementos válidos para os filtros (usa getElementKeys centralizado)
const VALID_ELEMENTS = getElementKeys();

// Card de ritual compacto para seleção
// Suporta tanto Ritual legado quanto UnifiedRitual
function RitualCard({
  ritual,
  isSelected,
  isDisabled,
  isAlreadyKnown,
  onToggle,
}: {
  ritual: RitualInput;
  isSelected: boolean;
  isDisabled: boolean;
  isAlreadyKnown: boolean;
  onToggle: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const elementConfig = getElementConfigLocal(ritual.element);
  const ElementIcon = elementConfig.icon;
  
  // Extrai resistance como string para exibição
  const resistanceText = ritual.resistance 
    ? (typeof ritual.resistance === 'string' 
        ? ritual.resistance 
        : `${ritual.resistance.type}`)
    : undefined;
  
  // Extrai enhancements de forma compatível
  const enhancements = ritual.enhancements?.map(enh => ({
    name: enh.name,
    cost: enh.cost,
    description: enh.description,
    requirements: 'requirements' in enh 
      ? enh.requirements 
      : ('circleReq' in enh 
          ? `Requer ${enh.circleReq}º círculo${enh.affinityReq ? ' e afinidade' : ''}` 
          : undefined),
  }));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        relative rounded-lg border transition-all duration-200
        ${isAlreadyKnown 
          ? 'opacity-50 bg-muted/30 border-muted cursor-not-allowed'
          : isSelected 
            ? `bg-gradient-to-br ${elementConfig.color} ${elementConfig.border} ring-1 ring-primary/30` 
            : 'bg-card/50 border-border hover:border-muted-foreground/50'
        }
        ${isDisabled && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div
          className="p-3"
          onClick={() => !isDisabled && !isAlreadyKnown && onToggle()}
        >
          <div className="flex items-start gap-3">
            {/* Checkbox ou indicador de já conhecido */}
            <div className="pt-0.5">
              {isAlreadyKnown ? (
                <div className="w-4 h-4 rounded bg-muted flex items-center justify-center">
                  <Check className="w-3 h-3 text-muted-foreground" />
                </div>
              ) : (
                <Checkbox
                  checked={isSelected}
                  disabled={isDisabled && !isSelected}
                  onCheckedChange={() => !isDisabled && onToggle()}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              )}
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-sm text-foreground">{ritual.name}</h4>
                {isAlreadyKnown && (
                  <Badge variant="secondary" className="text-xs">
                    Conhecido
                  </Badge>
                )}
                <Badge variant="outline" className={`text-xs ${elementConfig.badgeBg}`}>
                  <ElementIcon className="w-3 h-3 mr-1" />
                  {elementConfig.label}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {ritual.circle}º
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                {ritual.description}
              </p>
            </div>

            {/* Botão expandir */}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* Detalhes */}
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-0">
            <div className="border-t border-border/50 pt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Execução:</span>{' '}
                  <span className="text-foreground">{ritual.execution}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Alcance:</span>{' '}
                  <span className="text-foreground">{ritual.range}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Duração:</span>{' '}
                  <span className="text-foreground">{ritual.duration}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Custo:</span>{' '}
                  <span className="text-primary font-medium">{ritual.cost} PE</span>
                </div>
              </div>
              <p className="text-xs text-foreground">{ritual.description}</p>
              
              {/* Aprimoramentos detalhados */}
              {enhancements && enhancements.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-primary flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Aprimoramentos
                  </h5>
                  <div className="space-y-2">
                    {enhancements.map((enh, idx) => (
                      <div key={idx} className="p-2 rounded bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] font-semibold ${
                              enh.name === 'Verdadeiro' 
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                            }`}
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
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {enh.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

export function RitualSelectionModal({
  open,
  onClose,
  currentRituals,
  maxCircle,
  newSlots,
  onConfirm,
}: RitualSelectionModalProps) {
  const [selectedRituals, setSelectedRituals] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCircle, setSelectedCircle] = useState<number | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Filtrar rituais disponíveis - usa sistema unificado
  const filteredRituals = useMemo(() => {
    // Obtém rituais do sistema unificado até o círculo máximo
    const allRituals = getRitualsByMaxCircle(maxCircle);
    
    return allRituals.filter(ritual => {
      // Filtro por busca
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!ritual.name.toLowerCase().includes(search) &&
            !ritual.description.toLowerCase().includes(search)) {
          return false;
        }
      }

      // Filtro por círculo
      if (selectedCircle !== null && ritual.circle !== selectedCircle) {
        return false;
      }

      // Filtro por elemento
      if (selectedElement !== null && ritual.element !== selectedElement) {
        return false;
      }

      return true;
    });
  }, [maxCircle, searchTerm, selectedCircle, selectedElement]);

  // Agrupar por círculo
  const ritualsByCircle = useMemo(() => {
    const grouped: Record<number, UnifiedRitual[]> = {};
    filteredRituals.forEach(ritual => {
      if (!grouped[ritual.circle]) {
        grouped[ritual.circle] = [];
      }
      grouped[ritual.circle].push(ritual);
    });
    return grouped;
  }, [filteredRituals]);

  const remainingSlots = newSlots - selectedRituals.length;

  const handleToggleRitual = (ritualId: string) => {
    if (currentRituals.includes(ritualId)) return; // Já conhecido
    
    const isSelected = selectedRituals.includes(ritualId);
    
    if (isSelected) {
      setSelectedRituals(prev => prev.filter(id => id !== ritualId));
    } else if (remainingSlots > 0) {
      setSelectedRituals(prev => [...prev, ritualId]);
    }
  };

  const handleConfirm = async () => {
    if (selectedRituals.length !== newSlots) return;
    
    setSaving(true);
    try {
      await onConfirm(selectedRituals);
      setSelectedRituals([]);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar rituais:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCircle(null);
    setSelectedElement(null);
  };

  return (
    <MobileModal open={open} onOpenChange={onClose}>
      <MobileModalContent size="lg">
        <MobileModalHeader>
          <MobileModalTitle className="font-display tracking-wider text-center flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-paranormal" />
            ESCOLHER NOVOS RITUAIS
          </MobileModalTitle>
          <MobileModalDescription className="text-center">
            Você ganhou {newSlots} novo{newSlots > 1 ? 's' : ''} slot{newSlots > 1 ? 's' : ''} de ritual!
          </MobileModalDescription>
        </MobileModalHeader>

        <MobileModalBody>
          <div className="space-y-4">
            {/* Contador */}
            <div className={`
              p-3 rounded-lg border text-center
              ${remainingSlots === 0 
                ? 'bg-paranormal/10 border-paranormal/50' 
                : 'bg-muted/50 border-border'
              }
            `}>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl font-display text-paranormal">
                  {selectedRituals.length}
                </span>
                <span className="text-muted-foreground">/</span>
                <span className="text-2xl font-display text-muted-foreground">
                  {newSlots}
                </span>
                <span className="text-muted-foreground ml-2">selecionados</span>
              </div>
              {remainingSlots > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Escolha mais {remainingSlots} ritual{remainingSlots > 1 ? 'is' : ''}
                </p>
              )}
            </div>

            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar rituais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros compactos */}
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map(circle => {
                const isLocked = circle > maxCircle;
                const isActive = selectedCircle === circle;
                
                return (
                  <Button
                    key={circle}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    disabled={isLocked}
                    onClick={() => setSelectedCircle(isActive ? null : circle)}
                    className={isLocked ? 'opacity-50' : ''}
                  >
                    {isLocked && <Lock className="w-3 h-3 mr-1" />}
                    {circle}º
                  </Button>
                );
              })}
              <div className="h-6 w-px bg-border mx-1" />
              {VALID_ELEMENTS.map((elementId) => {
                const config = ELEMENT_CONFIG[elementId];
                const Icon = config.icon;
                const isActive = selectedElement === elementId;
                
                return (
                  <Button
                    key={elementId}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedElement(isActive ? null : elementId)}
                  >
                    <Icon className={`w-3 h-3 ${isActive ? '' : config.text}`} />
                  </Button>
                );
              })}
              {(searchTerm || selectedCircle || selectedElement) && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Limpar
                </Button>
              )}
            </div>

            {/* Lista de rituais */}
            <div className="space-y-4">
              {Object.entries(ritualsByCircle)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([circle, rituals]) => (
                  <div key={circle} className="space-y-2">
                    <h3 className="font-display text-sm tracking-wider text-paranormal sticky top-0 bg-background/95 backdrop-blur-sm py-1 z-10">
                      {circle}º CÍRCULO
                      <span className="text-xs font-normal text-muted-foreground ml-2">
                        ({rituals.length})
                      </span>
                    </h3>
                    <div className="space-y-2">
                      <AnimatePresence mode="popLayout">
                        {rituals.map(ritual => (
                          <RitualCard
                            key={ritual.id}
                            ritual={ritual}
                            isSelected={selectedRituals.includes(ritual.id)}
                            isDisabled={remainingSlots === 0 && !selectedRituals.includes(ritual.id)}
                            isAlreadyKnown={currentRituals.includes(ritual.id)}
                            onToggle={() => handleToggleRitual(ritual.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              
              {filteredRituals.length === 0 && (
                <div className="text-center py-8">
                  <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum ritual encontrado.</p>
                  <Button variant="link" size="sm" onClick={handleClearFilters}>
                    Limpar filtros
                  </Button>
                </div>
              )}
            </div>
          </div>
        </MobileModalBody>

        <MobileModalFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Pular
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={saving || selectedRituals.length !== newSlots}
            className="bg-paranormal hover:bg-paranormal/90"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Confirmar Rituais
          </Button>
        </MobileModalFooter>
      </MobileModalContent>
    </MobileModal>
  );
}
