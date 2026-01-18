/**
 * StepClass - Seleção de classe do personagem
 * Inclui classes base e a classe Sobrevivente do suplemento "Sobrevivendo ao Horror"
 * 
 * IDs de classes são gerenciados centralmente em game-ids.ts
 */

import { CLASSES, calculateDerivedStats } from '@/lib/character-data';
import { CLASS_IDS, isValidClassId, type ClassId } from '@/lib/constants/game-ids';
import { cn } from '@/lib/utils';
import { Sword, Wrench, Sparkles, Shield, BookOpen, Heart, Zap, Brain, Footprints } from 'lucide-react';
import { CLASS_PROFICIENCIES, CLASS_INITIAL_ABILITIES, getClassSkillRules } from '@/lib/character-builder-engine';
import { motion } from 'framer-motion';
import type { CharacterFormData } from '@/pages/CharacterCreate';
import type { LucideIcon } from 'lucide-react';
import { RuleBookTip } from './RuleBookTip';
import { getRulebookContent } from '@/lib/rulebook-content';

interface StepClassProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

// Ícones das classes - usando IDs de CLASS_IDS (fonte da verdade)
const CLASS_ICONS: Record<string, LucideIcon> = {
  [CLASS_IDS.COMBATENTE]: Sword,
  [CLASS_IDS.ESPECIALISTA]: Wrench,
  [CLASS_IDS.OCULTISTA]: Sparkles,
  Sobrevivente: Footprints, // Nova classe do suplemento (quando implementada)
};

// Cores das classes - usando IDs de CLASS_IDS (fonte da verdade)
const CLASS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  [CLASS_IDS.COMBATENTE]: { bg: 'bg-destructive/10', border: 'border-destructive/30', text: 'text-destructive' },
  [CLASS_IDS.ESPECIALISTA]: { bg: 'bg-secondary/10', border: 'border-secondary/30', text: 'text-secondary' },
  [CLASS_IDS.OCULTISTA]: { bg: 'bg-paranormal/10', border: 'border-paranormal/30', text: 'text-paranormal' },
  Sobrevivente: { bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning' }, // Cor única para Sobrevivente
};

export function StepClass({ formData, updateFormData }: StepClassProps) {
  const stats = formData.characterClass 
    ? calculateDerivedStats(
        formData.characterClass,
        formData.attributes.vigor,
        formData.attributes.presence,
        formData.nex,
        formData.origin
      )
    : null;

  /**
   * Seleciona uma classe validando contra game-ids.ts
   * @param classId - ID da classe (deve ser um ClassId válido)
   */
  const handleSelectClass = (classId: string) => {
    // Valida se é uma classe válida antes de atualizar
    if (!isValidClassId(classId)) {
      console.warn(`[StepClass] Tentativa de selecionar classe inválida: ${classId}`);
      return;
    }
    
    updateFormData({ 
      characterClass: classId as ClassId,
      classSkillChoices: {},
      freeSkills: [],
      classTrack: '',
      trackAbilities: [],
    });
  };

  // Conteúdo educativo do livro
  const rulebookContent = getRulebookContent('class');

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl tracking-wider mb-2">CLASSE</h2>
        <p className="text-muted-foreground text-sm">
          Escolha a classe do seu personagem. Isso afeta seus pontos de vida, esforço, sanidade e perícias.
        </p>
      </div>

      {/* Painel educativo do livro de regras */}
      {rulebookContent && (
        <RuleBookTip section={rulebookContent} defaultExpanded={false} />
      )}

      {/* Grid de classes */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CLASSES.map((cls, index) => {
          const Icon = CLASS_ICONS[cls.id] || Sparkles;
          const colors = CLASS_COLORS[cls.id] || CLASS_COLORS.Combatente;
          const isSelected = formData.characterClass === cls.id;
          const previewStats = calculateDerivedStats(
            cls.id,
            formData.attributes.vigor,
            formData.attributes.presence,
            formData.nex,
            formData.origin
          );
          const proficiencies = CLASS_PROFICIENCIES[cls.id] || [];
          const skillRules = getClassSkillRules(cls.id, formData.attributes.intellect);

          return (
            <motion.button
              key={cls.id}
              onClick={() => handleSelectClass(cls.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                boxShadow: isSelected 
                  ? '0 0 30px hsl(var(--primary) / 0.3), inset 0 0 20px hsl(var(--primary) / 0.05)'
                  : '0 0 0px transparent'
              }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ 
                scale: 1.03,
                boxShadow: '0 0 25px hsl(var(--primary) / 0.2)'
              }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'ordo-panel p-5 text-left transition-all flex flex-col group relative overflow-hidden',
                'hover:shadow-lg',
                isSelected && [
                  'border-2',
                  colors.border,
                  colors.bg,
                ]
              )}
            >
              {/* Glow animado de fundo quando selecionado */}
              {isSelected && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    background: `radial-gradient(circle at center, hsl(var(--primary) / 0.15) 0%, transparent 70%)`
                  }}
                />
              )}
              
              <div className="flex items-center gap-3 mb-3 relative z-10">
              <motion.div 
                  className={cn(
                    'w-12 h-12 rounded-sm flex items-center justify-center transition-all',
                    colors.bg,
                    colors.text,
                  )}
                  animate={isSelected ? { 
                    scale: 1.1,
                    rotate: 0,
                  } : { scale: 1 }}
                  transition={{ 
                    duration: 0.4,
                    type: "spring",
                    stiffness: 300
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div
                    animate={isSelected ? {
                      filter: ['drop-shadow(0 0 0px currentColor)', 'drop-shadow(0 0 8px currentColor)', 'drop-shadow(0 0 4px currentColor)']
                    } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Icon className="w-6 h-6" />
                  </motion.div>
                </motion.div>
                <motion.h3 
                  className={cn(
                    'font-display text-xl tracking-wider transition-colors',
                    isSelected && colors.text
                  )}
                  animate={isSelected ? { 
                    textShadow: ['0 0 0px transparent', '0 0 10px hsl(var(--primary) / 0.5)', '0 0 5px hsl(var(--primary) / 0.3)']
                  } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {cls.name}
                </motion.h3>
              </div>

              <p className="text-xs text-muted-foreground mb-4 flex-1">
                {cls.description}
              </p>

              {/* Stats preview with icons */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className={cn(
                  'text-center p-2 rounded-sm transition-all',
                  isSelected ? 'bg-destructive/20' : 'bg-muted/50'
                )}>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Heart className="w-3 h-3 text-destructive" />
                    <p className="text-xs text-muted-foreground">PV</p>
                  </div>
                  <motion.p 
                    key={`${cls.id}-hp-${previewStats.hp}`}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="font-display text-lg text-destructive"
                  >
                    {previewStats.hp}
                  </motion.p>
                </div>
                <div className={cn(
                  'text-center p-2 rounded-sm transition-all',
                  isSelected ? 'bg-success/20' : 'bg-muted/50'
                )}>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Zap className="w-3 h-3 text-success" />
                    <p className="text-xs text-muted-foreground">PE</p>
                  </div>
                  <motion.p 
                    key={`${cls.id}-pe-${previewStats.pe}`}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="font-display text-lg text-success"
                  >
                    {previewStats.pe}
                  </motion.p>
                </div>
                <div className={cn(
                  'text-center p-2 rounded-sm transition-all',
                  isSelected ? 'bg-paranormal/20' : 'bg-muted/50'
                )}>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Brain className="w-3 h-3 text-paranormal" />
                    <p className="text-xs text-muted-foreground">SAN</p>
                  </div>
                  <motion.p 
                    key={`${cls.id}-san-${previewStats.san}`}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="font-display text-lg text-paranormal"
                  >
                    {previewStats.san}
                  </motion.p>
                </div>
              </div>

              {/* Skills info */}
              <div className="text-xs text-muted-foreground mb-2">
                <span className={cn('font-medium', colors.text)}>{skillRules.freePoints}</span> perícias à escolha
                {skillRules.mandatory.length > 0 && (
                  <span> + {skillRules.mandatory.length} obrigatórias</span>
                )}
                {skillRules.choices.length > 0 && (
                  <span> + {skillRules.choices.length} escolhas</span>
                )}
              </div>

              {isSelected && (
                <motion.div 
                  className={cn('mt-3 text-xs font-medium', colors.text)}
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

      {formData.characterClass && (
        <motion.div 
          className="grid md:grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Proficiencies */}
          <div className="ordo-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary" />
              <h4 className="font-display text-sm tracking-wider text-primary">PROFICIÊNCIAS</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {CLASS_PROFICIENCIES[formData.characterClass]?.map((prof) => (
                <span 
                  key={prof}
                  className="px-2 py-1 bg-muted text-xs rounded-sm"
                >
                  {prof}
                </span>
              ))}
            </div>
          </div>

          {/* Initial Abilities */}
          <div className="ordo-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-primary" />
              <h4 className="font-display text-sm tracking-wider text-primary">HABILIDADE NEX 5%</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {CLASS_INITIAL_ABILITIES[formData.characterClass]?.map((ability) => (
                <span 
                  key={ability}
                  className="px-2 py-1 bg-paranormal/20 text-paranormal text-xs rounded-sm"
                >
                  {ability}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {stats && (
        <motion.div 
          className="ordo-panel p-4 bg-primary/5 border-primary/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-sm mb-2">
            <span className="text-primary font-display">ESTATÍSTICAS CALCULADAS (NEX {formData.nex}%):</span>
          </p>
          <div className="flex gap-6">
            <span className="text-sm flex items-center gap-1">
              <Heart className="w-4 h-4 text-destructive" />
              <span className="text-destructive">PV:</span> {stats.hp}
            </span>
            <span className="text-sm flex items-center gap-1">
              <Zap className="w-4 h-4 text-success" />
              <span className="text-success">PE:</span> {stats.pe}
            </span>
            <span className="text-sm flex items-center gap-1">
              <Brain className="w-4 h-4 text-paranormal" />
              <span className="text-paranormal">SAN:</span> {stats.san}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
