/**
 * SkillsSection - Seção de Perícias
 * 
 * Exibe bônus de perícias em formato colapsável com grid.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight } from '@/components/icons/ordem-icons';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ComputedEffects } from '@/hooks';

interface SkillsSectionProps {
  skills: ComputedEffects['skills'];
  compact?: boolean;
}

/**
 * Seção colapsável que exibe bônus de perícias
 */
export function SkillsSection({ skills, compact }: SkillsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const skillEntries = Object.entries(skills).filter(([_, data]) => data.bonus !== 0);

  if (skillEntries.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
          {isOpen ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          <BookOpen className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-medium">Perícias</span>
          <Badge variant="secondary" className="text-xs">
            {skillEntries.length}
          </Badge>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className={cn(
          "grid gap-1 pl-6 pt-1", 
          compact ? "grid-cols-2" : "grid-cols-3"
        )}>
          {skillEntries.map(([skill, data]) => (
            <div 
              key={skill} 
              className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-1"
            >
              <span className="text-muted-foreground truncate capitalize">
                {skill}
              </span>
              <Badge 
                variant={data.bonus > 0 ? "default" : "destructive"} 
                className="text-xs ml-1"
              >
                {data.bonus > 0 ? '+' : ''}{data.bonus}
              </Badge>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
