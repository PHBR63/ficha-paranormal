/**
 * StepOrigin - Seleção de origem do personagem
 * Inclui 26 origens base + 22 origens do suplemento "Sobrevivendo ao Horror"
 */

import { useState, useMemo } from 'react';
import { ORIGINS, SKILLS } from '@/lib/character-data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dices, AlertCircle, Search, Sparkles, BookMarked } from 'lucide-react';
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

interface StepOriginProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

// Origens do suplemento "Sobrevivendo ao Horror" (para destacar visualmente)
const SUPPLEMENT_ORIGINS = [
  'astro-mirim', 'baba', 'bibliotecario', 'bombeiro', 'caminhoneiro', 'catador',
  'coveiro', 'cozinheiro', 'defensor-publico', 'engenheiro-transito', 'exorcista',
  'garcom', 'guia-turistico', 'influenciador-digital', 'jornalista',
  'motorista-aplicativo', 'musico-rua', 'personal-trainer', 'pescador',
  'psicologo', 'tatuador', 'youtuber'
];

// Origin icons/categories for visual grouping
const ORIGIN_CATEGORIES: Record<string, string[]> = {
  'Combate': ['atleta', 'lutador', 'militar', 'policial', 'bombeiro', 'personal-trainer'],
  'Investigação': ['academico', 'investigador', 'ti', 'teorico-da-conspiracao', 'bibliotecario', 'jornalista'],
  'Social': ['artista', 'diplomata', 'executivo', 'religioso', 'influenciador-digital', 'youtuber', 'astro-mirim'],
  'Sobrevivência': ['criminoso', 'desgarrado', 'operario', 'trabalhador-rural', 'caminhoneiro', 'catador', 'pescador'],
  'Paranormal': ['amnesico', 'cultista-arrependido', 'vitima', 'exorcista', 'coveiro'],
  'Serviço': ['agente-de-saude', 'chef', 'engenheiro', 'servidor-publico', 'baba', 'cozinheiro', 'defensor-publico', 'garcom', 'guia-turistico', 'motorista-aplicativo', 'psicologo'],
  'Outros': ['trambiqueiro', 'universitario', 'engenheiro-transito', 'musico-rua', 'tatuador'],
};

export function StepOrigin({ formData, updateFormData }: StepOriginProps) {
  const [lastRoll, setLastRoll] = useState<{ dice: number[]; total: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAmnesicModal, setShowAmnesicModal] = useState(false);

  const filteredOrigins = useMemo(() => {
    if (!searchQuery.trim()) return ORIGINS;
    const query = searchQuery.toLowerCase();
    return ORIGINS.filter(origin =>
      origin.name.toLowerCase().includes(query) ||
      origin.description.toLowerCase().includes(query) ||
      origin.skills.some(s => s.toLowerCase().includes(query)) ||
      origin.powers.some(p => p.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const handleSelectOrigin = (originId: string) => {
    const isAmnésico = originId === 'amnésico';
    
    if (isAmnésico) {
      // Show modal to select skills
      setShowAmnesicModal(true);
      updateFormData({ 
        origin: originId,
        originSkills: formData.originSkills.length === 2 ? formData.originSkills : [],
      });
    } else {
      const skills = getOriginSkills(originId);
      updateFormData({ 
        origin: originId,
        originSkills: skills,
      });
    }
  };

  const handleAmnesicSkillsConfirm = (skills: string[]) => {
    updateFormData({ originSkills: skills });
    setShowAmnesicModal(false);
  };

  const handleRollOrigin = () => {
    const result = rollOrigin();
    setLastRoll({ dice: result.dice, total: result.total });
    handleSelectOrigin(result.originId);
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
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl tracking-wider mb-2">ORIGEM</h2>
          <p className="text-muted-foreground text-sm">
            Escolha a origem do seu personagem. Isso define suas perícias iniciais e um poder especial.
          </p>
        </div>

        {/* Painel educativo do livro de regras */}
        {rulebookContent && (
          <RuleBookTip section={rulebookContent} defaultExpanded={false} />
        )}

        {/* Search and Roll */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar origem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={handleRollOrigin}
            className="font-display shrink-0"
          >
            <Dices className="w-4 h-4 mr-2" />
            ROLAR ORIGEM (2d20)
          </Button>
        </div>

        <AnimatePresence>
          {lastRoll && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-center text-sm text-muted-foreground mb-4"
            >
              Resultado: [{lastRoll.dice[0]}] + [{lastRoll.dice[1]}] = {lastRoll.total}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
          {filteredOrigins.map((origin, index) => {
            const isAmnésico = origin.id === 'amnesico';
            const hasSanityPenalty = origin.sanityModifier !== undefined;
            const isSelected = formData.origin === origin.id;
            const isFromSupplement = SUPPLEMENT_ORIGINS.includes(origin.id);
            
            return (
              <motion.button
                key={origin.id}
                onClick={() => handleSelectOrigin(origin.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  'ordo-panel p-4 text-left transition-all group',
                  'hover:border-primary/50 hover:bg-primary/5',
                  isSelected && 'border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.2)]',
                  isFromSupplement && !isSelected && 'border-warning/20'
                )}
              >
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-display text-lg tracking-wider group-hover:text-primary transition-colors">
                    {origin.name}
                  </h3>
                  {isFromSupplement && (
                    <Badge variant="outline" className="text-[10px] py-0 h-4 bg-warning/10 border-warning/30 text-warning">
                      Suplemento
                    </Badge>
                  )}
                  {hasSanityPenalty && (
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertCircle className="w-4 h-4 text-warning" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Sanidade inicial reduzida pela metade</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {isAmnésico && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Sparkles className="w-4 h-4 text-paranormal" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Escolha 2 perícias livremente</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {origin.description}
                </p>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-primary mb-1">Perícias:</p>
                    <p className="text-sm text-foreground">
                      {isAmnésico ? (
                        <span className="text-paranormal font-medium">Escolha duas perícias</span>
                      ) : (
                        origin.skills.join(', ')
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-paranormal mb-1">Poder:</p>
                    <p className="text-sm text-foreground">
                      {origin.powers.join(', ')}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <motion.div 
                    className="mt-3 text-xs text-primary font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    ✓ Selecionado
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {filteredOrigins.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma origem encontrada para "{searchQuery}"</p>
          </div>
        )}

        {selectedOrigin && (
          <motion.div 
            className="ordo-panel p-4 bg-primary/5 border-primary/20 space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm">
                <span className="text-primary font-display">ORIGEM SELECIONADA: </span>
                <span className="text-foreground font-medium">{selectedOrigin.name}</span>
              </p>
              {formData.origin === 'amnésico' && formData.originSkills.length < 2 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAmnesicModal(true)}
                  className="text-paranormal border-paranormal/30"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Escolher Perícias
                </Button>
              )}
            </div>
            
            {originSkillNames.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  PERÍCIAS TREINADAS {formData.origin === 'amnésico' ? '(escolhidas)' : '(automático)'}:
                </p>
                <div className="flex gap-2 flex-wrap">
                  {originSkillNames.map(name => (
                    <span 
                      key={name}
                      className="px-2 py-1 bg-primary/20 text-primary font-medium text-sm rounded border border-primary/30"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <p className="text-xs text-muted-foreground mb-1">PODER:</p>
              <p className="text-xs text-paranormal">{selectedOrigin.powerDescription}</p>
            </div>
          </motion.div>
        )}

        {/* Amnesic Skill Selection Modal */}
        <AmnesicSkillModal
          open={showAmnesicModal}
          onOpenChange={setShowAmnesicModal}
          onConfirm={handleAmnesicSkillsConfirm}
          currentSelection={formData.originSkills}
        />
      </div>
    </TooltipProvider>
  );
}
