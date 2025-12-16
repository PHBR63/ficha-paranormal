/**
 * SkillsGrid - Grid de perícias do personagem
 * Com barra de pesquisa, separação de treinadas/não-treinadas
 * Clique dispara rolagem imediata via callback
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Dices, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SKILLS } from '@/lib/character-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Props da grade de perícias
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
  vigor: 'VIG'
};
// Cores dos atributos usando variáveis CSS do design system
const ATTRIBUTE_COLORS: Record<string, string> = {
  agility: 'hsl(var(--attr-agility))',
  strength: 'hsl(var(--attr-strength))',
  intellect: 'hsl(var(--attr-intellect))',
  presence: 'hsl(var(--attr-presence))',
  vigor: 'hsl(var(--attr-vigor))'
};
export function SkillsGrid({
  skills,
  attributes,
  onRoll
}: SkillsGridProps) {
  // Estado da barra de pesquisa
  const [searchQuery, setSearchQuery] = useState('');

  // Filtra perícias baseado na pesquisa
  const filteredSkills = useMemo(() => {
    if (!searchQuery.trim()) return SKILLS;
    const query = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return SKILLS.filter(skill => {
      const name = skill.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const attr = skill.attribute.toLowerCase();
      return name.includes(query) || attr.includes(query);
    });
  }, [searchQuery]);

  // Separa treinadas e não-treinadas
  const trainedSkills = filteredSkills.filter(s => skills[s.id] > 0);
  const untrainedSkills = filteredSkills.filter(s => !skills[s.id] || skills[s.id] === 0);

  return (
    <div className="space-y-4">
      {/* Barra de pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar perícia..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 bg-muted/30 border-border focus:border-primary"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchQuery('')}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Resultado da pesquisa vazio */}
      {filteredSkills.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Nenhuma perícia encontrada para "{searchQuery}"</p>
        </div>
      )}

      {/* Perícias Treinadas */}
      {trainedSkills.length > 0 && (
        <div>
          <h4 className="font-display text-sm tracking-wider text-primary mb-3">
            PERÍCIAS TREINADAS ({trainedSkills.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {trainedSkills.map((skill, index) => {
              const attrValue = attributes[skill.attribute] || 0;
              const trainingBonus = 5; // Bônus de treinamento fixo
              const color = ATTRIBUTE_COLORS[skill.attribute];
              return (
                <SkillRow 
                  key={skill.id} 
                  name={skill.name} 
                  attribute={ATTRIBUTE_LABELS[skill.attribute]} 
                  total={trainingBonus} // Mostrar apenas bônus de treinamento
                  color={color} 
                  trained 
                  index={index} 
                  onClick={() => onRoll?.(attrValue + trainingBonus, skill.name, attrValue)} // Soma apenas na rolagem
                />
              );
            })}
          </div>
        </div>
      )}
      
      {/* Perícias Não-Treinadas (expandíveis) */}
      {untrainedSkills.length > 0 && (
        <details className="group" open={searchQuery.length > 0}>
          <summary className="cursor-pointer list-none">
            <h4 className="font-display text-sm tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              OUTRAS PERÍCIAS ({untrainedSkills.length})
              <span className="text-xs group-open:rotate-90 transition-transform">▶</span>
            </h4>
          </summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            {untrainedSkills.map((skill, index) => {
              const attrValue = attributes[skill.attribute] || 0;
              const trainingBonus = 0; // Sem bônus de treinamento
              const color = ATTRIBUTE_COLORS[skill.attribute];
              return (
                <SkillRow 
                  key={skill.id} 
                  name={skill.name} 
                  attribute={ATTRIBUTE_LABELS[skill.attribute]} 
                  total={trainingBonus} // Mostrar 0 para não treinadas
                  color={color} 
                  trained={false} 
                  index={index} 
                  onClick={() => onRoll?.(attrValue + trainingBonus, skill.name, attrValue)} // Soma apenas na rolagem
                />
              );
            })}
          </div>
        </details>
      )}
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
  return <motion.div initial={{
    opacity: 0,
    x: -10
  }} animate={{
    opacity: 1,
    x: 0
  }} transition={{
    delay: index * 0.02
  }} className={cn('group flex items-center justify-between', 'p-3 rounded-lg cursor-pointer', 'transition-all duration-200', trained ? 'bg-secondary/50 border border-border hover:border-primary/50' : 'bg-muted/20 border border-transparent hover:bg-muted/40')} onClick={onClick}>
      <div className="flex items-center gap-2">
        <span className={cn('text-sm', trained ? 'font-medium' : 'text-muted-foreground')}>
          {name}
        </span>
        <span style={{
        backgroundColor: `${color}30`,
        color,
        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
      }} className="text-[11px] px-2 py-0.5 rounded font-display shadow-sm text-sidebar-foreground font-medium">
          {attribute}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <span 
          className={cn(
            'font-display text-lg font-bold',
            trained ? 'drop-shadow-sm' : 'text-muted-foreground'
          )} 
          style={trained ? {
            color,
            textShadow: '0 1px 2px rgba(0,0,0,0.4)'
          } : undefined}
        >
          +{total}
        </span>
        
        {/* Dice icon */}
        <motion.div className="opacity-0 group-hover:opacity-100 transition-opacity" whileHover={{
        rotate: 20
      }}>
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{
          backgroundColor: `${color}20`
        }}>
            <Dices className="w-3.5 h-3.5" style={{
            color
          }} />
          </div>
        </motion.div>
      </div>
    </motion.div>;
}