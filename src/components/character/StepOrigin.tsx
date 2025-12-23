/**
 * StepOrigin - Seleção de origem do personagem
 * Inclui 26 origens base + origens de suplementos e comunidade
 * 
 * IDs de origens são gerenciados centralmente em game-ids.ts
 * Layout melhorado com modal de detalhes
 */

import { useState, useMemo } from 'react';
import { ORIGINS, SKILLS } from '@/lib/character-data';
import { CORE_ORIGIN_IDS, SUPPLEMENT_ORIGIN_IDS, VALID_SUPPLEMENT_ORIGIN_IDS } from '@/lib/constants/game-ids';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dices, 
  AlertCircle, 
  Search, 
  Sparkles, 
  BookMarked,
  ChevronRight,
  User,
  Zap,
  BookOpen,
  Check,
  X,
  Droplet,
  Skull,
  Star,
} from 'lucide-react';
import { rollOrigin, getOriginSkills } from '@/lib/character-builder-engine';
import { motion, AnimatePresence } from 'framer-motion';
import { AmnesicSkillModal } from './AmnesicSkillModal';
import { RuleBookTip } from './RuleBookTip';
import { getRulebookContent } from '@/lib/rulebook-content';
import type { CharacterFormData } from '@/pages/CharacterCreate';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PARANORMAL_POWERS, 
  getPowerById,
  canChoosePower,
  ELEMENT_LABELS,
  ELEMENT_COLORS,
  ELEMENT_BG_COLORS,
  type ParanormalPower 
} from '@/lib/paranormal-powers';

interface StepOriginProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

// Origens de suplemento - usando IDs de game-ids.ts (fonte da verdade)
const SUPPLEMENT_ORIGINS_LIST = VALID_SUPPLEMENT_ORIGIN_IDS;

// Categorias para filtros
const ORIGIN_CATEGORIES: Record<string, { label: string; origins: string[] }> = {
  'combate': { 
    label: 'Combate', 
    origins: ['atleta', 'lutador', 'militar', 'policial', 'bombeiro', 'personal-trainer'] 
  },
  'investigacao': { 
    label: 'Investigação', 
    origins: ['academico', 'investigador', 'ti', 'teorico-da-conspiracao', 'bibliotecario', 'jornalista'] 
  },
  'social': { 
    label: 'Social', 
    origins: ['artista', 'diplomata', 'executivo', 'religioso', 'influenciador-digital', 'youtuber', 'astro-mirim'] 
  },
  'sobrevivencia': { 
    label: 'Sobrevivência', 
    origins: ['criminoso', 'desgarrado', 'operario', 'trabalhador-rural', 'caminhoneiro', 'catador', 'pescador'] 
  },
  'paranormal': { 
    label: 'Paranormal', 
    origins: ['amnesico', 'cultista-arrependido', 'vitima', 'exorcista', 'coveiro'] 
  },
  'servico': { 
    label: 'Serviço', 
    origins: ['agente-de-saude', 'chef', 'engenheiro', 'servidor-publico', 'baba', 'cozinheiro', 'defensor-publico', 'garcom', 'guia-turistico', 'motorista-aplicativo', 'psicologo'] 
  },
};

// Poderes sem pré-requisitos (disponíveis para Cultista Arrependido)
const getAvailablePowersForCultist = (): ParanormalPower[] => {
  return PARANORMAL_POWERS.filter(p => !p.prerequisite);
};

export function StepOrigin({ formData, updateFormData }: StepOriginProps) {
  const [lastRoll, setLastRoll] = useState<{ dice: number[]; total: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAmnesicModal, setShowAmnesicModal] = useState(false);
  const [showParanormalModal, setShowParanormalModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previewOrigin, setPreviewOrigin] = useState<typeof ORIGINS[0] | null>(null);
  const [showOnlySupplement, setShowOnlySupplement] = useState(false);
  const [paranormalElementFilter, setParanormalElementFilter] = useState<string>('all');

  // Filtro de poderes paranormais por elemento
  const filteredParanormalPowers = useMemo(() => {
    const powers = getAvailablePowersForCultist();
    if (paranormalElementFilter === 'all') return powers;
    return powers.filter(p => p.element === paranormalElementFilter);
  }, [paranormalElementFilter]);

  // Filtra origens por busca, categoria e suplemento
  const filteredOrigins = useMemo(() => {
    let result = ORIGINS;
    
    // Filtro por texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(origin =>
        origin.name.toLowerCase().includes(query) ||
        origin.description.toLowerCase().includes(query) ||
        origin.skills.some(s => s.toLowerCase().includes(query)) ||
        origin.powers.some(p => p.toLowerCase().includes(query))
      );
    }
    
    // Filtro por categoria
    if (selectedCategory && ORIGIN_CATEGORIES[selectedCategory]) {
      const categoryOrigins = ORIGIN_CATEGORIES[selectedCategory].origins;
      result = result.filter(origin => categoryOrigins.includes(origin.id));
    }
    
    // Filtro por suplemento
    if (showOnlySupplement) {
      result = result.filter(origin => (SUPPLEMENT_ORIGINS_LIST as readonly string[]).includes(origin.id));
    }
    
    return result;
  }, [searchQuery, selectedCategory, showOnlySupplement]);

  const handleSelectOrigin = (originId: string) => {
    const isAmnésico = originId === 'amnésico' || originId === 'amnesico';
    const isCultistaArrependido = originId === 'cultista-arrependido';
    
    if (isAmnésico) {
      setShowAmnesicModal(true);
      updateFormData({ 
        origin: originId,
        originSkills: formData.originSkills.length === 2 ? formData.originSkills : [],
        originParanormalPower: null,
      });
    } else if (isCultistaArrependido) {
      const skills = getOriginSkills(originId);
      setShowParanormalModal(true);
      updateFormData({ 
        origin: originId,
        originSkills: skills,
        originParanormalPower: formData.originParanormalPower,
      });
    } else {
      const skills = getOriginSkills(originId);
      updateFormData({ 
        origin: originId,
        originSkills: skills,
        originParanormalPower: null,
      });
    }
  };

  const handleAmnesicSkillsConfirm = (skills: string[]) => {
    updateFormData({ originSkills: skills });
    setShowAmnesicModal(false);
  };

  const handleParanormalPowerSelect = (power: ParanormalPower) => {
    updateFormData({ originParanormalPower: power.id });
    setShowParanormalModal(false);
  };

  const handleRollOrigin = () => {
    const result = rollOrigin();
    setLastRoll({ dice: result.dice, total: result.total });
    handleSelectOrigin(result.originId);
    
    // Também abre o preview da origem sorteada
    const rolledOrigin = ORIGINS.find(o => o.id === result.originId);
    if (rolledOrigin) {
      setPreviewOrigin(rolledOrigin);
    }
  };

  const selectedOrigin = ORIGINS.find(o => o.id === formData.origin);
  const originSkillNames = formData.originSkills.map(id => 
    SKILLS.find(s => s.id === id)?.name || id
  );

  // Conteúdo educativo do livro
  const rulebookContent = getRulebookContent('origin');

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="font-display text-2xl tracking-wider mb-2">ORIGEM</h2>
          <p className="text-muted-foreground text-sm">
            Escolha a origem do seu personagem. Isso define suas perícias iniciais e um poder especial.
          </p>
        </div>

        {/* Painel educativo do livro de regras */}
        {rulebookContent && (
          <RuleBookTip section={rulebookContent} defaultExpanded={false} />
        )}

        {/* Search, Filters and Roll */}
        <div className="space-y-3">
          {/* Busca e Rolar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, descrição, perícia ou poder..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleRollOrigin}
              className="font-display shrink-0 gap-2"
            >
              <Dices className="w-4 h-4" />
              ROLAR (2d20)
            </Button>
          </div>

          {/* Filtros de Categoria */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null && !showOnlySupplement ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedCategory(null);
                setShowOnlySupplement(false);
              }}
              className="text-xs"
            >
              Todas
            </Button>
            {Object.entries(ORIGIN_CATEGORIES).map(([key, { label }]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedCategory(key);
                  setShowOnlySupplement(false);
                }}
                className="text-xs"
              >
                {label}
              </Button>
            ))}
            <Button
              variant={showOnlySupplement ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setShowOnlySupplement(!showOnlySupplement);
                setSelectedCategory(null);
              }}
              className="text-xs gap-1 bg-warning/10 border-warning/30 text-warning hover:bg-warning/20 hover:text-warning"
            >
              <BookMarked className="w-3 h-3" />
              Suplemento
            </Button>
          </div>
        </div>

        {/* Resultado da rolagem */}
        <AnimatePresence>
          {lastRoll && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="ordo-panel p-3 text-center bg-primary/5 border-primary/20"
            >
              <p className="text-sm text-muted-foreground">
                Rolagem: <span className="font-mono text-primary">[{lastRoll.dice[0]}]</span> + 
                <span className="font-mono text-primary"> [{lastRoll.dice[1]}]</span> = 
                <span className="font-display text-lg text-primary ml-2">{lastRoll.total}</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contador de resultados */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{filteredOrigins.length} origem(s) encontrada(s)</span>
          {selectedOrigin && (
            <span className="text-primary font-medium">
              Selecionada: {selectedOrigin.name}
            </span>
          )}
        </div>

        {/* Grid de origens */}
        <ScrollArea className="h-[350px] pr-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredOrigins.map((origin, index) => {
              const isAmnésico = origin.id === 'amnesico';
              const hasSanityPenalty = origin.sanityModifier !== undefined;
              const isSelected = formData.origin === origin.id;
              const isFromSupplement = (SUPPLEMENT_ORIGINS_LIST as readonly string[]).includes(origin.id);
              
              return (
                <motion.div
                  key={origin.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.5) }}
                  className={cn(
                    'ordo-panel p-3 transition-all group cursor-pointer relative',
                    'hover:border-primary/50 hover:bg-primary/5',
                    isSelected && 'border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.2)]',
                    isFromSupplement && !isSelected && 'border-warning/20'
                  )}
                  onClick={() => handleSelectOrigin(origin.id)}
                >
                  {/* Badges no canto superior direito */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {isFromSupplement && (
                      <Badge variant="outline" className="text-[9px] py-0 px-1 h-4 bg-warning/10 border-warning/30 text-warning">
                        SUP
                      </Badge>
                    )}
                    {hasSanityPenalty && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="p-0.5 rounded bg-destructive/20">
                            <AlertCircle className="w-3 h-3 text-destructive" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Sanidade inicial reduzida pela metade</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {isAmnésico && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="p-0.5 rounded bg-paranormal/20">
                            <Sparkles className="w-3 h-3 text-paranormal" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Escolha 2 perícias livremente</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {/* Nome da origem */}
                  <h3 className={cn(
                    "font-display text-base tracking-wider mb-1 pr-12 transition-colors",
                    isSelected ? "text-primary" : "group-hover:text-primary"
                  )}>
                    {origin.name}
                  </h3>

                  {/* Descrição curta */}
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">
                    {origin.description}
                  </p>

                  {/* Perícias resumidas */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {isAmnésico ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-paranormal/20 text-paranormal border border-paranormal/30">
                        2 perícias à escolha
                      </span>
                    ) : (
                      origin.skills.slice(0, 2).map(skill => (
                        <span 
                          key={skill}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                        >
                          {skill}
                        </span>
                      ))
                    )}
                    {!isAmnésico && origin.skills.length > 2 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        +{origin.skills.length - 2}
                      </span>
                    )}
                  </div>

                  {/* Botão de ver detalhes */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs gap-1 mt-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewOrigin(origin);
                    }}
                  >
                    <BookOpen className="w-3 h-3" />
                    Ver detalhes
                    <ChevronRight className="w-3 h-3" />
                  </Button>

                  {/* Indicador de selecionado */}
                  {isSelected && (
                    <motion.div 
                      className="absolute bottom-2 right-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <Check className="w-5 h-5 text-primary" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>

        {filteredOrigins.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma origem encontrada para os filtros selecionados</p>
            <Button 
              variant="link" 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setShowOnlySupplement(false);
              }}
            >
              Limpar filtros
            </Button>
          </div>
        )}

        {/* Resumo da origem selecionada */}
        <AnimatePresence>
          {selectedOrigin && (
            <motion.div 
              className="ordo-panel p-4 bg-primary/5 border-primary/30 space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span className="font-display text-primary tracking-wider">
                    {selectedOrigin.name}
                  </span>
                  {(SUPPLEMENT_ORIGINS_LIST as readonly string[]).includes(selectedOrigin.id) && (
                    <Badge variant="outline" className="text-[10px] bg-warning/10 border-warning/30 text-warning">
                      Suplemento
                    </Badge>
                  )}
                </div>
                {formData.origin === 'amnesico' && formData.originSkills.length < 2 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAmnesicModal(true)}
                    className="text-paranormal border-paranormal/30 gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Escolher Perícias
                  </Button>
                )}
              </div>
              
              {/* Perícias */}
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Perícias {formData.origin === 'amnesico' ? '(escolhidas)' : ''}
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    {originSkillNames.length > 0 ? (
                      originSkillNames.map(name => (
                        <span 
                          key={name}
                          className="px-2 py-0.5 bg-primary/20 text-primary font-medium text-xs rounded border border-primary/30"
                        >
                          {name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Nenhuma perícia selecionada
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Poder */}
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-paranormal shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Poder</p>
                  <p className="text-xs text-foreground">{selectedOrigin.powers.join(', ')}</p>
                  <p className="text-[11px] text-paranormal/80 mt-1">{selectedOrigin.powerDescription}</p>
                </div>
              </div>

              {/* Poder Paranormal (Cultista Arrependido) */}
              {formData.origin === 'cultista-arrependido' && (
                <div className="flex items-start gap-2 mt-2 pt-2 border-t border-border/50">
                  <Sparkles className="w-4 h-4 text-paranormal shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Poder Paranormal Escolhido</p>
                    {formData.originParanormalPower ? (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-paranormal/20 text-paranormal font-medium text-xs rounded border border-paranormal/30">
                          {getPowerById(formData.originParanormalPower)?.name || formData.originParanormalPower}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={() => setShowParanormalModal(true)}
                        >
                          Alterar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 border-paranormal/30 text-paranormal hover:bg-paranormal/10"
                        onClick={() => setShowParanormalModal(true)}
                      >
                        <Sparkles className="w-3 h-3" />
                        Escolher Poder Paranormal
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de detalhes da origem */}
        <Dialog open={!!previewOrigin} onOpenChange={(open) => !open && setPreviewOrigin(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            {previewOrigin && (
              <>
                <DialogHeader className="mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DialogTitle className="font-display text-2xl tracking-wider">
                      {previewOrigin.name}
                    </DialogTitle>
                    {(SUPPLEMENT_ORIGINS_LIST as readonly string[]).includes(previewOrigin.id) && (
                      <Badge className="bg-warning/20 text-warning border-warning/30">
                        Suplemento
                      </Badge>
                    )}
                    {previewOrigin.sanityModifier !== undefined && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="w-3 h-3" />
                        SAN reduzida
                      </Badge>
                    )}
                  </div>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Descrição */}
                  <div className="ordo-panel p-4">
                    <h4 className="font-display text-sm tracking-wider text-muted-foreground mb-2">
                      DESCRIÇÃO
                    </h4>
                    <p className="text-sm text-foreground leading-relaxed">
                      {previewOrigin.description}
                    </p>
                  </div>

                  {/* Perícias */}
                  <div className="ordo-panel p-4">
                    <h4 className="font-display text-sm tracking-wider text-muted-foreground mb-3">
                      PERÍCIAS TREINADAS
                    </h4>
                    {previewOrigin.id === 'amnesico' ? (
                      <div className="flex items-center gap-2 text-paranormal">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Escolha duas perícias quaisquer (exceto Luta e Pontaria)
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {previewOrigin.skills.map(skill => (
                          <span 
                            key={skill}
                            className="px-3 py-1.5 bg-primary/20 text-primary font-medium text-sm rounded-lg border border-primary/30"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Poder */}
                  <div className="ordo-panel p-4 bg-paranormal/5 border-paranormal/20">
                    <h4 className="font-display text-sm tracking-wider text-paranormal mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      PODER DE ORIGEM
                    </h4>
                    <p className="font-display text-lg text-foreground mb-2">
                      {previewOrigin.powers.join(', ')}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {previewOrigin.powerDescription}
                    </p>
                  </div>

                  {/* Aviso de Sanidade */}
                  {previewOrigin.sanityModifier !== undefined && (
                    <div className="ordo-panel p-4 bg-destructive/10 border-destructive/30">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-display text-sm tracking-wider text-destructive mb-1">
                            SANIDADE REDUZIDA
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Personagens com esta origem começam com a Sanidade máxima reduzida pela metade.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Botões de ação */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => {
                        handleSelectOrigin(previewOrigin.id);
                        setPreviewOrigin(null);
                      }}
                    >
                      <Check className="w-4 h-4" />
                      Selecionar Origem
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPreviewOrigin(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Amnesic Skill Selection Modal */}
        <AmnesicSkillModal
          open={showAmnesicModal}
          onOpenChange={setShowAmnesicModal}
          onConfirm={handleAmnesicSkillsConfirm}
          currentSelection={formData.originSkills}
        />

        {/* Paranormal Power Selection Modal (Cultista Arrependido) */}
        <Dialog open={showParanormalModal} onOpenChange={(open) => {
          setShowParanormalModal(open);
          if (!open) setParanormalElementFilter('all');
        }}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden grid grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-4">
            <DialogHeader>
              <DialogTitle className="font-display text-xl tracking-wider flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-paranormal" />
                Escolher Poder Paranormal
              </DialogTitle>
              <DialogDescription>
                Como Cultista Arrependido, você possui um poder paranormal à sua escolha.
                Escolha um poder sem pré-requisitos.
              </DialogDescription>
            </DialogHeader>
            
            {/* Filtros por elemento */}
            <Tabs value={paranormalElementFilter} onValueChange={setParanormalElementFilter} className="w-full">
              <TabsList className="grid grid-cols-6 w-full">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="sangue" className="flex items-center gap-1">
                  <Droplet className="h-3 w-3" />
                  <span className="hidden sm:inline">Sangue</span>
                </TabsTrigger>
                <TabsTrigger value="morte" className="flex items-center gap-1">
                  <Skull className="h-3 w-3" />
                  <span className="hidden sm:inline">Morte</span>
                </TabsTrigger>
                <TabsTrigger value="conhecimento" className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  <span className="hidden sm:inline">Conhecimento</span>
                </TabsTrigger>
                <TabsTrigger value="energia" className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span className="hidden sm:inline">Energia</span>
                </TabsTrigger>
                <TabsTrigger value="generic" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  <span className="hidden sm:inline">Genérico</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <ScrollArea className="min-h-0 -mx-6 px-6 pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                {filteredParanormalPowers.map(power => {
                  const isSelected = formData.originParanormalPower === power.id;
                  const elementColor = ELEMENT_COLORS[power.element];
                  const elementBg = ELEMENT_BG_COLORS[power.element];
                  
                  return (
                    <div
                      key={power.id}
                      onClick={() => handleParanormalPowerSelect(power)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all duration-200",
                        "hover:border-primary hover:shadow-md",
                        isSelected 
                          ? "border-paranormal bg-paranormal/10 ring-2 ring-paranormal/30" 
                          : "border-border bg-card"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className={cn("p-1.5 rounded shrink-0", elementBg)}>
                          <Sparkles className={cn("h-3.5 w-3.5", elementColor)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm text-foreground">{power.name}</h4>
                            {isSelected && <Check className="w-4 h-4 text-paranormal" />}
                          </div>
                          <Badge variant="outline" className={cn("text-[10px] mt-1", elementColor)}>
                            {ELEMENT_LABELS[power.element]}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3">
                            {power.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowParanormalModal(false)}>
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
