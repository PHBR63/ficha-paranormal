// Componente de seleção de rituais para Ocultistas
// Permite escolher rituais baseados no NEX e círculo máximo disponível
// Inclui painel educativo do livro de regras

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
} from 'lucide-react';
import { CharacterFormData } from '@/pages/CharacterCreate';
import { ALL_RITUALS, Ritual, getMaxRitualCircle, getRitualCount } from '@/lib/rituals-data';
import { CLASSES } from '@/lib/character-data';
import { RuleBookTip } from './RuleBookTip';
import { getRulebookContent } from '@/lib/rulebook-content';

interface StepRitualsProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

// Configuração visual para cada elemento
const ELEMENT_CONFIG = {
  sangue: {
    icon: Droplets,
    label: 'Sangue',
    color: 'from-red-500/20 to-red-900/20',
    border: 'border-red-500/50',
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    badgeBg: 'bg-red-500/20 text-red-300',
  },
  morte: {
    icon: Skull,
    label: 'Morte',
    color: 'from-purple-900/20 to-purple-950/20',
    border: 'border-purple-500/50',
    text: 'text-purple-400',
    bg: 'bg-purple-500/10',
    badgeBg: 'bg-purple-500/20 text-purple-300',
  },
  conhecimento: {
    icon: BookOpen,
    label: 'Conhecimento',
    color: 'from-blue-500/20 to-blue-900/20',
    border: 'border-blue-500/50',
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    badgeBg: 'bg-blue-500/20 text-blue-300',
  },
  energia: {
    icon: Zap,
    label: 'Energia',
    color: 'from-yellow-500/20 to-amber-900/20',
    border: 'border-yellow-500/50',
    text: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    badgeBg: 'bg-yellow-500/20 text-yellow-300',
  },
  medo: {
    icon: Ghost,
    label: 'Medo',
    color: 'from-emerald-900/20 to-emerald-950/20',
    border: 'border-emerald-500/50',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    badgeBg: 'bg-emerald-500/20 text-emerald-300',
  },
};

// Card de ritual individual com animações e detalhes expansíveis
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
  const elementConfig = ELEMENT_CONFIG[ritual.element];
  const ElementIcon = elementConfig.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`
        relative rounded-lg border transition-all duration-200
        ${isSelected 
          ? `bg-gradient-to-br ${elementConfig.color} ${elementConfig.border} ring-1 ring-primary/30` 
          : 'bg-card/50 border-border hover:border-muted-foreground/50'
        }
        ${isDisabled && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        {/* Header do ritual */}
        <div
          className="p-4"
          onClick={() => !isDisabled && onToggle()}
        >
          <div className="flex items-start gap-3">
            {/* Checkbox de seleção */}
            <div className="pt-0.5">
              <Checkbox
                checked={isSelected}
                disabled={isDisabled && !isSelected}
                onCheckedChange={() => !isDisabled && onToggle()}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </div>

            {/* Conteúdo principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-foreground">{ritual.name}</h4>
                <Badge variant="outline" className={`text-xs ${elementConfig.badgeBg}`}>
                  <ElementIcon className="w-3 h-3 mr-1" />
                  {elementConfig.label}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {ritual.circle}º Círculo
                </Badge>
              </div>

              {/* Informações rápidas */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                <span>{ritual.execution}</span>
                <span>•</span>
                <span>{ritual.range}</span>
                <span>•</span>
                <span>{ritual.duration}</span>
                <span>•</span>
                <span className="text-primary font-medium">{ritual.cost} PE</span>
              </div>

              {/* Descrição resumida */}
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {ritual.description}
              </p>
            </div>

            {/* Botão de expandir */}
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

        {/* Detalhes expandíveis */}
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0">
            <div className="border-t border-border/50 pt-3 space-y-3">
              {/* Alvo e resistência */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Alvo:</span>{' '}
                  <span className="text-foreground">{ritual.target}</span>
                </div>
                {ritual.resistance && (
                  <div>
                    <span className="text-muted-foreground">Resistência:</span>{' '}
                    <span className="text-foreground">{ritual.resistance}</span>
                  </div>
                )}
              </div>

              {/* Descrição completa */}
              <p className="text-sm text-foreground">{ritual.description}</p>

              {/* Aprimoramentos */}
              {ritual.enhancements && ritual.enhancements.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-primary flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Aprimoramentos
                  </h5>
                  <ul className="space-y-1">
                    {ritual.enhancements.map((enh, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                        <Badge variant="secondary" className="text-xs shrink-0">
                          +{enh.cost} PE
                        </Badge>
                        <span>{enh.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

export function StepRituals({ formData, updateFormData }: StepRitualsProps) {
  // Estado de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCircle, setSelectedCircle] = useState<number | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  // Obter dados do Ocultista baseado no NEX
  const ocultistClass = CLASSES.find(c => c.id === 'Ocultista');
  const ritualsPerNex = (ocultistClass as any)?.ritualsPerNex || {};
  const ritualInfo = ritualsPerNex[formData.nex] || { count: 1, maxCircle: 1 };
  const maxRituals = ritualInfo.count;
  const maxCircle = ritualInfo.maxCircle;

  // Rituais selecionados
  const selectedRituals = formData.rituals || [];
  const remainingSlots = maxRituals - selectedRituals.length;

  // Filtrar rituais disponíveis
  const filteredRituals = useMemo(() => {
    return ALL_RITUALS.filter(ritual => {
      // Filtro por círculo máximo permitido
      if (ritual.circle > maxCircle) return false;
      
      // Filtro por busca
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!ritual.name.toLowerCase().includes(search) &&
            !ritual.description.toLowerCase().includes(search)) {
          return false;
        }
      }

      // Filtro por círculo selecionado
      if (selectedCircle !== null && ritual.circle !== selectedCircle) {
        return false;
      }

      // Filtro por elemento selecionado
      if (selectedElement !== null && ritual.element !== selectedElement) {
        return false;
      }

      return true;
    });
  }, [maxCircle, searchTerm, selectedCircle, selectedElement]);

  // Agrupar rituais por círculo para exibição
  const ritualsByCircle = useMemo(() => {
    const grouped: Record<number, Ritual[]> = {};
    filteredRituals.forEach(ritual => {
      if (!grouped[ritual.circle]) {
        grouped[ritual.circle] = [];
      }
      grouped[ritual.circle].push(ritual);
    });
    return grouped;
  }, [filteredRituals]);

  // Handlers
  const handleToggleRitual = (ritualId: string) => {
    const isSelected = selectedRituals.includes(ritualId);
    
    if (isSelected) {
      // Remover ritual
      updateFormData({
        rituals: selectedRituals.filter(id => id !== ritualId),
      });
    } else if (remainingSlots > 0) {
      // Adicionar ritual (se houver slots)
      updateFormData({
        rituals: [...selectedRituals, ritualId],
      });
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCircle(null);
    setSelectedElement(null);
  };

  // Conteúdo educativo do livro
  const rulebookContent = getRulebookContent('rituals');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-primary">
          <Sparkles className="w-6 h-6" />
          <h2 className="font-display text-2xl tracking-wider">RITUAIS DO OCULTISTA</h2>
        </div>
        <p className="text-muted-foreground">
          NEX {formData.nex}% • Círculos 1-{maxCircle} disponíveis
        </p>
      </div>

      {/* Painel educativo do livro de regras */}
      {rulebookContent && (
        <RuleBookTip section={rulebookContent} defaultExpanded={false} />
      )}

      {/* Contador de rituais */}
      <div className={`
        p-4 rounded-lg border text-center
        ${remainingSlots === 0 
          ? 'bg-primary/10 border-primary/50' 
          : 'bg-muted/50 border-border'
        }
      `}>
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl font-display text-primary">
            {selectedRituals.length}
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="text-3xl font-display text-muted-foreground">
            {maxRituals}
          </span>
          <span className="text-muted-foreground ml-2">rituais selecionados</span>
        </div>
        {remainingSlots === 0 && (
          <p className="text-sm text-primary mt-1">✓ Todos os rituais escolhidos!</p>
        )}
        {remainingSlots > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Escolha mais {remainingSlots} ritual{remainingSlots > 1 ? 'is' : ''}
          </p>
        )}
      </div>

      {/* Filtros */}
      <div className="space-y-4">
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

        {/* Filtros por círculo */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Filtrar por Círculo
          </label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map(circle => {
              const isLocked = circle > maxCircle;
              const isActive = selectedCircle === circle;
              
              return (
                <TooltipProvider key={circle}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        disabled={isLocked}
                        onClick={() => setSelectedCircle(isActive ? null : circle)}
                        className={`
                          relative
                          ${isLocked ? 'opacity-50' : ''}
                          ${isActive ? 'ring-2 ring-primary/50' : ''}
                        `}
                      >
                        {isLocked && <Lock className="w-3 h-3 mr-1" />}
                        {circle}º Círculo
                      </Button>
                    </TooltipTrigger>
                    {isLocked && (
                      <TooltipContent>
                        <p>Disponível a partir de NEX {circle === 2 ? '20%' : circle === 3 ? '35%' : '50%'}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>

        {/* Filtros por elemento */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Filtrar por Elemento
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ELEMENT_CONFIG).map(([elementId, config]) => {
              const Icon = config.icon;
              const isActive = selectedElement === elementId;
              
              return (
                <Button
                  key={elementId}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedElement(isActive ? null : elementId)}
                  className={`
                    ${isActive ? `${config.bg} ${config.border}` : ''}
                  `}
                >
                  <Icon className={`w-4 h-4 mr-1 ${config.text}`} />
                  {config.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Botão limpar filtros */}
        {(searchTerm || selectedCircle !== null || selectedElement !== null) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-muted-foreground"
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Lista de rituais */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-6">
          {Object.entries(ritualsByCircle)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([circle, rituals]) => (
              <div key={circle} className="space-y-3">
                <h3 className="font-display text-lg tracking-wider text-primary sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                  {circle}º CÍRCULO
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({rituals.length} rituais)
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
                        onToggle={() => handleToggleRitual(ritual.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          
          {filteredRituals.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Nenhum ritual encontrado com os filtros atuais.</p>
              <Button variant="link" onClick={handleClearFilters}>
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Resumo dos rituais selecionados */}
      {selectedRituals.length > 0 && (
        <div className="space-y-2 border-t border-border pt-4">
          <label className="text-sm font-medium text-muted-foreground">
            Rituais Selecionados
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedRituals.map(ritualId => {
              const ritual = ALL_RITUALS.find(r => r.id === ritualId);
              if (!ritual) return null;
              const config = ELEMENT_CONFIG[ritual.element];
              const Icon = config.icon;
              
              return (
                <Badge
                  key={ritualId}
                  variant="secondary"
                  className={`${config.badgeBg} cursor-pointer hover:opacity-80`}
                  onClick={() => handleToggleRitual(ritualId)}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {ritual.name}
                  <span className="ml-1 opacity-60">×</span>
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
