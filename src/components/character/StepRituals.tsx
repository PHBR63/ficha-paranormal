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
import { ALL_RITUALS, Ritual, getMaxRitualCircle, getRitualCount } from '@/lib/rituals/legacy-exports';
import { CLASSES } from '@/lib/character-data';
import { RuleBookTip } from './RuleBookTip';
import { getRulebookContent } from '@/lib/rulebook-content';

interface StepRitualsProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

// Configuração visual para cada elemento (5 elementos oficiais)
const ELEMENT_CONFIG = {
  sangue: {
    icon: Droplets,
    label: 'Sangue',
    color: 'from-red-500/20 to-red-900/20',
    border: 'border-red-500/50',
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    badgeBg: 'bg-red-500/20 text-red-300',
    // Efeito de pulso vermelho
    animationClass: 'animate-pulse-blood',
    glowColor: 'rgba(239, 68, 68, 0.4)',
  },
  morte: {
    icon: Skull,
    label: 'Morte',
    color: 'from-gray-600/20 to-gray-800/20',
    border: 'border-gray-500/50',
    text: 'text-gray-400',
    bg: 'bg-gray-500/10',
    badgeBg: 'bg-gray-500/20 text-gray-300',
    // Efeito de névoa cinza
    animationClass: 'animate-mist-death',
    glowColor: 'rgba(156, 163, 175, 0.3)',
  },
  conhecimento: {
    icon: BookOpen,
    label: 'Conhecimento',
    color: 'from-yellow-500/20 to-amber-700/20',
    border: 'border-yellow-500/50',
    text: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    badgeBg: 'bg-yellow-500/20 text-yellow-300',
    // Efeito de brilho amarelo
    animationClass: 'animate-glow-knowledge',
    glowColor: 'rgba(234, 179, 8, 0.4)',
  },
  energia: {
    icon: Zap,
    label: 'Energia',
    color: 'from-purple-500/20 to-violet-900/20',
    border: 'border-purple-500/50',
    text: 'text-purple-400',
    bg: 'bg-purple-500/10',
    badgeBg: 'bg-purple-500/20 text-purple-300',
    // Efeito hack/glitch roxo
    animationClass: 'animate-hack-energy',
    glowColor: 'rgba(168, 85, 247, 0.4)',
  },
  medo: {
    icon: Ghost,
    label: 'Medo',
    color: 'from-emerald-500/10 to-emerald-900/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/5',
    badgeBg: 'bg-emerald-500/20 text-emerald-300',
    // Efeito glassmorphism
    animationClass: 'animate-glass-fear',
    glowColor: 'rgba(16, 185, 129, 0.2)',
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
  // Normaliza o elemento para lowercase para garantir compatibilidade
  const elementKey = (ritual.element?.toLowerCase() || 'conhecimento') as keyof typeof ELEMENT_CONFIG;
  const elementConfig = ELEMENT_CONFIG[elementKey] || ELEMENT_CONFIG.conhecimento;
  const ElementIcon = elementConfig.icon;

  // Efeitos de animação baseados no elemento
  const getElementAnimation = () => {
    if (!isSelected) return {};
    
    switch (elementKey) {
      case 'sangue':
        return {
          boxShadow: [
            `0 0 0px ${elementConfig.glowColor}`,
            `0 0 20px ${elementConfig.glowColor}`,
            `0 0 10px ${elementConfig.glowColor}`,
          ],
        };
      case 'morte':
        return {
          opacity: [1, 0.85, 1],
          filter: ['blur(0px)', 'blur(0.5px)', 'blur(0px)'],
        };
      case 'conhecimento':
        return {
          boxShadow: [
            `0 0 5px ${elementConfig.glowColor}`,
            `0 0 25px ${elementConfig.glowColor}`,
            `0 0 5px ${elementConfig.glowColor}`,
          ],
        };
      case 'energia':
        return {
          x: [0, -1, 1, -1, 0],
          boxShadow: [
            `0 0 10px ${elementConfig.glowColor}`,
            `0 0 20px ${elementConfig.glowColor}`,
            `0 0 10px ${elementConfig.glowColor}`,
          ],
        };
      case 'medo':
        return {
          backdropFilter: ['blur(0px)', 'blur(2px)', 'blur(0px)'],
        };
      default:
        return {};
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        ...getElementAnimation(),
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: isSelected ? 2 : 0.2,
        repeat: isSelected ? Infinity : 0,
        repeatType: "reverse",
      }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: `0 0 15px ${elementConfig.glowColor}`,
      }}
      className={`
        relative rounded-lg border transition-all duration-200 overflow-hidden
        ${isSelected 
          ? `bg-gradient-to-br ${elementConfig.color} ${elementConfig.border} ring-1 ring-primary/30` 
          : 'bg-card/50 border-border hover:border-muted-foreground/50'
        }
        ${isDisabled && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${elementKey === 'medo' && isSelected ? 'backdrop-blur-sm bg-opacity-80' : ''}
      `}
    >
      {/* Efeito de fundo especial por elemento quando selecionado */}
      <AnimatePresence>
        {isSelected && (
          <>
            {/* Sangue: partículas de gotas */}
            {elementKey === 'sangue' && (
              <motion.div
                className="absolute inset-0 pointer-events-none overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-red-500/60"
                    style={{ left: `${20 + i * 30}%`, top: '-5%' }}
                    animate={{
                      y: ['0%', '120%'],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.5,
                      repeat: Infinity,
                    }}
                  />
                ))}
              </motion.div>
            )}
            
            {/* Morte: névoa cinza */}
            {elementKey === 'morte' && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{
                  background: 'linear-gradient(180deg, transparent 0%, rgba(156, 163, 175, 0.15) 50%, transparent 100%)',
                }}
              />
            )}
            
            {/* Conhecimento: brilho pulsante */}
            {elementKey === 'conhecimento' && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.3, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  background: 'radial-gradient(circle at center, rgba(234, 179, 8, 0.2) 0%, transparent 70%)',
                }}
              />
            )}
            
            {/* Energia: linhas de "hack" */}
            {elementKey === 'energia' && (
              <motion.div
                className="absolute inset-0 pointer-events-none overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {[...Array(2)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-px w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"
                    style={{ top: `${30 + i * 40}%` }}
                    animate={{
                      x: ['-100%', '100%'],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.3,
                      repeat: Infinity,
                    }}
                  />
                ))}
              </motion.div>
            )}
            
            {/* Medo: efeito glassmorphism */}
            {elementKey === 'medo' && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.1, 0.25, 0.1] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(16, 185, 129, 0.1) 100%)',
                  backdropFilter: 'blur(1px)',
                }}
              />
            )}
          </>
        )}
      </AnimatePresence>
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

              {/* Aprimoramentos detalhados com nome Discente/Verdadeiro */}
              {ritual.enhancements && ritual.enhancements.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-primary flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Aprimoramentos
                  </h5>
                  <div className="space-y-2">
                    {ritual.enhancements.map((enh, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge 
                            variant="outline" 
                            className={`text-xs font-semibold ${
                              enh.name === 'Verdadeiro' 
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                            }`}
                          >
                            {enh.name}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            +{enh.cost} PE
                          </Badge>
                          {enh.requirements && (
                            <span className="text-xs text-yellow-400 italic">
                              ({enh.requirements})
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
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

export function StepRituals({ formData, updateFormData }: StepRitualsProps) {
  // Estado de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCircle, setSelectedCircle] = useState<number | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  // Obter dados do Ocultista baseado no NEX
  const ocultistClass = CLASSES.find(c => c.id === 'Ocultista');
  const ritualsPerNex = (ocultistClass as any)?.ritualsPerNex || {};
  // Configuração de rituais baseada no NEX do personagem
  const ritualInfo = ritualsPerNex[formData.nex] || { count: 3, maxCircle: 1 };
  const maxRituals = ritualInfo.count;
  const maxCircle = ritualInfo.maxCircle;
  
  // Detectar se está em um NEX de desbloqueio de círculo (25%, 55%, 85%)
  const previousNex = formData.nex > 5 ? formData.nex - 5 : 5;
  const previousRitualInfo = ritualsPerNex[previousNex] || { count: 3, maxCircle: 1 };
  const isNewCircleUnlocked = maxCircle > previousRitualInfo.maxCircle;

  // Rituais selecionados e slots restantes
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

      {/* Banner de novo círculo desbloqueado */}
      {isNewCircleUnlocked && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg border border-primary/50 bg-primary/10 text-center"
        >
          <div className="flex items-center justify-center gap-2 text-primary">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium text-sm">
              {maxCircle}º Círculo Desbloqueado!
            </span>
            <Sparkles className="w-4 h-4" />
          </div>
        </motion.div>
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
          <span className="text-muted-foreground ml-2">
            rituais selecionados
          </span>
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
                        {/* Tooltips corrigidos conforme livro de regras */}
                        <p>Disponível a partir de NEX {circle === 2 ? '25%' : circle === 3 ? '55%' : '85%'}</p>
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
              // Normaliza o elemento para lowercase para garantir compatibilidade
              const elementKey = (ritual.element?.toLowerCase() || 'conhecimento') as keyof typeof ELEMENT_CONFIG;
              const config = ELEMENT_CONFIG[elementKey] || ELEMENT_CONFIG.conhecimento;
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
