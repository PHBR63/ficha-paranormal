import { CLASSES, calculateDerivedStats } from '@/lib/character-data';
import { cn } from '@/lib/utils';
import { Sword, Wrench, Sparkles, Shield, BookOpen, Heart, Zap, Brain } from 'lucide-react';
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

const CLASS_ICONS: Record<string, LucideIcon> = {
  Combatente: Sword,
  Especialista: Wrench,
  Ocultista: Sparkles,
};

const CLASS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Combatente: { bg: 'bg-destructive/10', border: 'border-destructive/30', text: 'text-destructive' },
  Especialista: { bg: 'bg-secondary/10', border: 'border-secondary/30', text: 'text-secondary' },
  Ocultista: { bg: 'bg-paranormal/10', border: 'border-paranormal/30', text: 'text-paranormal' },
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

  const handleSelectClass = (classId: string) => {
    updateFormData({ 
      characterClass: classId,
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

      <div className="grid md:grid-cols-3 gap-4">
        {CLASSES.map((cls, index) => {
          const Icon = CLASS_ICONS[cls.id];
          const colors = CLASS_COLORS[cls.id];
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
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'ordo-panel p-5 text-left transition-all flex flex-col group',
                'hover:shadow-lg',
                isSelected && [
                  'border-2',
                  colors.border,
                  colors.bg,
                  'shadow-[0_0_30px_hsl(var(--primary)/0.2)]'
                ]
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <motion.div 
                  className={cn(
                    'w-12 h-12 rounded-sm flex items-center justify-center transition-all',
                    colors.bg,
                    colors.text,
                    isSelected && 'scale-110'
                  )}
                  animate={isSelected ? { rotate: [0, -5, 5, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <Icon className="w-6 h-6" />
                </motion.div>
                <h3 className={cn(
                  'font-display text-xl tracking-wider transition-colors',
                  isSelected && colors.text
                )}>
                  {cls.name}
                </h3>
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
