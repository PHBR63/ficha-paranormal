import { motion } from 'framer-motion';
import { Dices } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SKILLS } from '@/lib/character-data';

interface SkillsGridProps {
  skills: Record<string, number>;
  attributes: Record<string, number>;
  onRoll?: (total: number, skillName: string, attributeValue: number) => void;
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  agility: 'AGI',
  strength: 'FOR',
  intellect: 'INT',
  presence: 'PRE',
  vigor: 'VIG',
};

const ATTRIBUTE_COLORS: Record<string, string> = {
  agility: 'hsl(var(--accent))',
  strength: 'hsl(var(--destructive))',
  intellect: 'hsl(var(--primary))',
  presence: 'hsl(var(--paranormal))',
  vigor: 'hsl(var(--success))',
};

export function SkillsGrid({ skills, attributes, onRoll }: SkillsGridProps) {
  const trainedSkills = SKILLS.filter(s => skills[s.id] > 0);
  const untrainedSkills = SKILLS.filter(s => !skills[s.id] || skills[s.id] === 0);
  
  return (
    <div className="space-y-6">
      {/* Trained Skills */}
      {trainedSkills.length > 0 && (
        <div>
          <h4 className="font-display text-sm tracking-wider text-primary mb-3">
            PERÍCIAS TREINADAS ({trainedSkills.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {trainedSkills.map((skill, index) => {
              const attrValue = attributes[skill.attribute] || 0;
              const trainingBonus = 5;
              const total = attrValue + trainingBonus;
              const color = ATTRIBUTE_COLORS[skill.attribute];
              
              return (
                <SkillRow
                  key={skill.id}
                  name={skill.name}
                  attribute={ATTRIBUTE_LABELS[skill.attribute]}
                  total={total}
                  color={color}
                  trained
                  index={index}
                  onClick={() => onRoll?.(total, skill.name, attrValue)}
                />
              );
            })}
          </div>
        </div>
      )}
      
      {/* Untrained Skills (collapsed by default) */}
      <details className="group">
        <summary className="cursor-pointer list-none">
          <h4 className="font-display text-sm tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            OUTRAS PERÍCIAS ({untrainedSkills.length})
            <span className="text-xs group-open:rotate-90 transition-transform">▶</span>
          </h4>
        </summary>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          {untrainedSkills.map((skill, index) => {
            const attrValue = attributes[skill.attribute] || 0;
            const total = attrValue; // No training bonus
            const color = ATTRIBUTE_COLORS[skill.attribute];
            
            return (
              <SkillRow
                key={skill.id}
                name={skill.name}
                attribute={ATTRIBUTE_LABELS[skill.attribute]}
                total={total}
                color={color}
                trained={false}
                index={index}
                onClick={() => onRoll?.(total, skill.name, attrValue)}
              />
            );
          })}
        </div>
      </details>
    </div>
  );
}

interface SkillRowProps {
  name: string;
  attribute: string;
  total: number;
  color: string;
  trained: boolean;
  index: number;
  onClick?: () => void;
}

function SkillRow({ 
  name, 
  attribute, 
  total, 
  color, 
  trained, 
  index,
  onClick 
}: SkillRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className={cn(
        'group flex items-center justify-between',
        'p-3 rounded-lg cursor-pointer',
        'transition-all duration-200',
        trained 
          ? 'bg-secondary/50 border border-border hover:border-primary/50' 
          : 'bg-muted/20 border border-transparent hover:bg-muted/40'
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <span className={cn(
          'text-sm',
          trained ? 'font-medium' : 'text-muted-foreground'
        )}>
          {name}
        </span>
        <span 
          className="text-[10px] px-1.5 py-0.5 rounded font-display"
          style={{ 
            backgroundColor: `${color}20`,
            color 
          }}
        >
          {attribute}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <span 
          className={cn(
            'font-display text-lg',
            trained ? 'text-secondary-foreground' : 'text-muted-foreground'
          )}
          style={trained ? { color } : undefined}
        >
          +{total}
        </span>
        
        {/* Dice icon */}
        <motion.div
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          whileHover={{ rotate: 20 }}
        >
          <div 
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Dices className="w-3.5 h-3.5" style={{ color }} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
