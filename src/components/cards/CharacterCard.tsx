"use client";

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { MagicCard } from "@/components/ui/magic-card";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import { ConditionList } from "@/components/ui/condition-badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  User, 
  Skull, 
  FileText, 
  ChevronRight,
  Trash2,
  Sparkles
} from '@/components/icons/ordem-icons';

interface Character {
  id: string;
  name: string;
  class: string;
  origin: string;
  nex: number;
  patent: string;
  hp_current: number;
  hp_max: number;
  pe_current: number;
  pe_max: number;
  san_current: number;
  san_max: number;
  photo_url?: string | null;
  conditions?: string[];
}

interface CharacterCardProps {
  character: Character;
  onDelete?: (id: string, name: string) => void;
  index?: number;
  compact?: boolean;
}

const CLASS_CONFIG = {
  Combatente: { icon: Shield, color: 'hsl(var(--primary))' },
  Especialista: { icon: User, color: 'hsl(var(--accent))' },
  Ocultista: { icon: Skull, color: 'hsl(var(--paranormal))' },
} as const;

export function CharacterCard({ 
  character, 
  onDelete, 
  index = 0,
  compact = false 
}: CharacterCardProps) {
  const classConfig = CLASS_CONFIG[character.class as keyof typeof CLASS_CONFIG] || { 
    icon: FileText, 
    color: 'hsl(var(--muted-foreground))' 
  };
  const ClassIcon = classConfig.icon;

  const hpPercent = (character.hp_current / character.hp_max) * 100;
  const sanPercent = (character.san_current / character.san_max) * 100;
  const pePercent = (character.pe_current / character.pe_max) * 100;

  const conditions = Array.isArray(character.conditions) ? character.conditions : [];

  if (compact) {
    return (
      <MagicCard
        className="p-4"
        gradientColor={classConfig.color}
        tiltAmount={5}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${classConfig.color}20` }}
          >
            <ClassIcon className="w-5 h-5" style={{ color: classConfig.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-display text-lg tracking-wide truncate">{character.name}</h4>
            <p className="text-muted-foreground text-xs">{character.class} • NEX {character.nex}%</p>
          </div>
          <Link to={`/character/${character.id}`}>
            <Button variant="ghost" size="icon">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <AnimatedProgress value={character.hp_current} max={character.hp_max} variant="hp" size="sm" />
          <AnimatedProgress value={character.pe_current} max={character.pe_max} variant="pe" size="sm" />
          <AnimatedProgress value={character.san_current} max={character.san_max} variant="san" size="sm" />
        </div>
      </MagicCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <MagicCard
        className="group"
        gradientColor={classConfig.color}
        gradientOpacity={0.2}
        tiltAmount={8}
      >
        <div className="p-4 sm:p-6 relative">
          {/* Classified stamp watermark */}
          <div className="absolute -bottom-2 -right-2 text-xl font-display tracking-widest text-primary/5 -rotate-12 select-none pointer-events-none">
            ORDO
          </div>

          {/* Header */}
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <motion.div 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                style={{ backgroundColor: `${classConfig.color}15` }}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                {character.photo_url ? (
                  <img 
                    src={character.photo_url} 
                    alt={character.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <ClassIcon 
                    className="w-5 h-5 sm:w-6 sm:h-6 transition-colors" 
                    style={{ color: classConfig.color }}
                  />
                )}
              </motion.div>
              <div className="min-w-0">
                <h4 className="font-display text-lg sm:text-xl tracking-wide text-foreground truncate">
                  {character.name}
                </h4>
                <p className="text-muted-foreground text-xs sm:text-sm truncate">
                  {character.class} • {character.origin}
                </p>
              </div>
            </div>
            
            {/* NEX indicator */}
            <motion.div 
              className="nex-indicator relative w-9 h-9 sm:w-10 sm:h-10 text-sm sm:text-base flex-shrink-0"
              whileHover={{ scale: 1.1 }}
            >
              <span>{character.nex}%</span>
              <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          </div>

          {/* Status bars */}
          <div className="space-y-3 mb-4">
            <AnimatedProgress 
              value={character.hp_current} 
              max={character.hp_max} 
              variant="hp" 
              showLabel 
              showValue
              glow={hpPercent <= 25}
            />
            <AnimatedProgress 
              value={character.pe_current} 
              max={character.pe_max} 
              variant="pe" 
              showLabel 
              showValue
            />
            <AnimatedProgress 
              value={character.san_current} 
              max={character.san_max} 
              variant="san" 
              showLabel 
              showValue
              glow={sanPercent <= 30}
            />
          </div>

          {/* Conditions */}
          {conditions.length > 0 && (
            <div className="mb-4">
              <ConditionList conditions={conditions} size="sm" maxVisible={3} />
            </div>
          )}

          {/* Patent badge */}
          <div className="mb-4">
            <motion.span 
              className="patent-badge"
              whileHover={{ scale: 1.05 }}
            >
              {character.patent}
            </motion.span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link to={`/character/${character.id}`} className="flex-1">
              <Button 
                variant="secondary" 
                className="w-full group-hover:bg-primary/20 transition-colors"
              >
                Abrir Dossiê
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(character.id, character.name)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </MagicCard>
    </motion.div>
  );
}

// Grid container for character cards
interface CharacterGridProps {
  characters: Character[];
  onDelete?: (id: string, name: string) => void;
}

export function CharacterGrid({ characters, onDelete }: CharacterGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {characters.map((character, index) => (
        <CharacterCard
          key={character.id}
          character={character}
          onDelete={onDelete}
          index={index}
        />
      ))}
    </div>
  );
}
