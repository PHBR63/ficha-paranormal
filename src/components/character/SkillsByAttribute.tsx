/**
 * SkillsByAttribute - Perícias organizadas por atributo base
 * Com d20 vermelho para rolar cada perícia
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SKILLS } from '@/lib/character-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SkillsByAttributeProps {
  skills: Record<string, number>;
  attributes: Record<string, number>;
  onRoll?: (total: number, skillName: string, attributeValue: number) => void;
  className?: string;
}

// Nomes dos atributos
const ATTRIBUTE_NAMES: Record<string, string> = {
  agility: 'Agilidade',
  strength: 'Força',
  intellect: 'Intelecto',
  presence: 'Presença',
  vigor: 'Vigor',
};

// Abreviações
const ATTRIBUTE_ABBR: Record<string, string> = {
  agility: 'AGI',
  strength: 'FOR',
  intellect: 'INT',
  presence: 'PRE',
  vigor: 'VIG',
};

// Cores dos atributos
const ATTRIBUTE_COLORS: Record<string, string> = {
  agility: 'hsl(var(--attr-agility))',
  strength: 'hsl(var(--attr-strength))',
  intellect: 'hsl(var(--attr-intellect))',
  presence: 'hsl(var(--attr-presence))',
  vigor: 'hsl(var(--attr-vigor))',
};

// D20 Icon simples
function D20Icon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={cn("w-5 h-5", className)}
      style={style}
    >
      <path d="M12 2L2 7L12 12L22 7L12 2Z" />
      <path d="M2 17L12 22L22 17L12 12L2 17Z" opacity="0.7" />
      <path d="M2 7V17L12 12V2L2 7Z" opacity="0.5" />
      <path d="M22 7V17L12 12V2L22 7Z" opacity="0.5" />
    </svg>
  );
}

export function SkillsByAttribute({
  skills,
  attributes,
  onRoll,
  className,
}: SkillsByAttributeProps) {
  // Estado de pesquisa
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados de abertura dos grupos
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    agility: true,
    strength: false,
    intellect: true,
    presence: false,
    vigor: false,
  });

  // Agrupar perícias por atributo
  const skillsByAttr = useMemo(() => {
    const grouped: Record<string, typeof SKILLS> = {
      agility: [],
      strength: [],
      intellect: [],
      presence: [],
      vigor: [],
    };
    
    // Filtrar por pesquisa
    const query = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    SKILLS.forEach(skill => {
      if (query) {
        const name = skill.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (!name.includes(query)) return;
      }
      if (grouped[skill.attribute]) {
        grouped[skill.attribute].push(skill);
      }
    });
    
    return grouped;
  }, [searchQuery]);

  // Toggle grupo
  const toggleGroup = (attr: string) => {
    setOpenGroups(prev => ({ ...prev, [attr]: !prev[attr] }));
  };

  return (
    <div className={cn("sheet-panel p-4 space-y-4", className)}>
      <h3 className="font-display text-sm tracking-wider text-primary uppercase">
        Perícias
      </h3>
      
      {/* Barra de pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar perícia..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 bg-muted/30 border-border focus:border-primary h-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchQuery('')}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Grupos por atributo */}
      <div className="space-y-2">
        {Object.entries(skillsByAttr).map(([attr, attrSkills]) => {
          if (attrSkills.length === 0) return null;
          
          const attrValue = attributes[attr] || 0;
          const color = ATTRIBUTE_COLORS[attr];
          const isOpen = openGroups[attr] || searchQuery.length > 0;
          
          // Contar perícias treinadas
          const trainedCount = attrSkills.filter(s => skills[s.id] > 0).length;
          
          return (
            <Collapsible
              key={attr}
              open={isOpen}
              onOpenChange={() => !searchQuery && toggleGroup(attr)}
            >
              <CollapsibleTrigger asChild>
                <motion.div
                  className={cn(
                    "flex items-center justify-between",
                    "p-3 rounded-lg cursor-pointer",
                    "sheet-panel-inner hover:border-primary/30",
                    "transition-all duration-200"
                  )}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center gap-3">
                    {/* D20 com cor do atributo */}
                    <D20Icon style={{ color }} className="opacity-70" />
                    
                    {/* Nome do atributo */}
                    <span className="font-display text-sm tracking-wider" style={{ color }}>
                      {ATTRIBUTE_NAMES[attr]}
                    </span>
                    
                    {/* Valor do atributo */}
                    <span 
                      className="text-xs px-2 py-0.5 rounded font-display"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      +{attrValue}
                    </span>
                    
                    {/* Contador de treinadas */}
                    {trainedCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({trainedCount} treinada{trainedCount > 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                  
                  <ChevronDown 
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </motion.div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pl-4 pt-2 space-y-1"
                  >
                    {attrSkills.map((skill, index) => {
                      const isTrained = skills[skill.id] > 0;
                      const trainingBonus = isTrained ? 5 : 0;
                      const total = attrValue + trainingBonus;
                      
                      return (
                        <motion.div
                          key={skill.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className={cn(
                            "group flex items-center justify-between",
                            "p-2 rounded-lg cursor-pointer",
                            "transition-all duration-200",
                            isTrained 
                              ? "bg-secondary/30 hover:bg-secondary/50" 
                              : "hover:bg-muted/30"
                          )}
                          onClick={() => onRoll?.(total, skill.name, attrValue)}
                        >
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-sm",
                              isTrained ? "font-medium" : "text-muted-foreground"
                            )}>
                              {skill.name}
                            </span>
                            {isTrained && (
                              <span 
                                className="text-[10px] px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: `${color}20`, color }}
                              >
                                Treinado
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span 
                              className={cn(
                                "font-display text-lg",
                                isTrained ? "" : "text-muted-foreground"
                              )}
                              style={isTrained ? { color } : undefined}
                            >
                              +{total}
                            </span>
                            
                            {/* D20 vermelho no hover */}
                            <motion.div
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              whileHover={{ rotate: 15 }}
                            >
                              <D20Icon className="w-4 h-4 text-destructive" />
                            </motion.div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
