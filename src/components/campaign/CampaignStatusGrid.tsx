import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MagicCard } from '@/components/ui/magic-card';
import { AnimatedProgress } from '@/components/ui/animated-progress';
import { ConditionList } from '@/components/ui/condition-badge';
import { Shield, User, Skull, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CharacterData {
  id: string;
  name: string;
  class: string;
  nex: number;
  hp_current: number;
  hp_max: number;
  pe_current: number;
  pe_max: number;
  san_current: number;
  san_max: number;
  photo_url?: string | null;
  conditions?: string[];
}

interface Member {
  id: string;
  user_id: string;
  character_id: string | null;
  role: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  characters?: CharacterData | null;
}

interface CampaignStatusGridProps {
  members: Member[];
  isMaster: boolean;
}

const CLASS_CONFIG = {
  Combatente: { icon: Shield, color: 'hsl(var(--primary))' },
  Especialista: { icon: User, color: 'hsl(var(--accent))' },
  Ocultista: { icon: Skull, color: 'hsl(var(--paranormal))' },
} as const;

export function CampaignStatusGrid({ members, isMaster }: CampaignStatusGridProps) {
  const membersWithCharacters = members.filter(m => m.characters && m.role !== 'master');
  
  if (membersWithCharacters.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 mx-auto text-foreground/40 mb-4" />
        <p className="text-foreground/70">
          Nenhum agente ativo na campanha.
        </p>
        <p className="text-sm text-foreground/60 mt-1">
          Os jogadores precisam selecionar seus personagens.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {membersWithCharacters.map((member, index) => {
        const char = member.characters!;
        const classConfig = CLASS_CONFIG[char.class as keyof typeof CLASS_CONFIG] || {
          icon: FileText,
          color: 'hsl(var(--muted-foreground))'
        };
        const ClassIcon = classConfig.icon;
        const conditions = Array.isArray(char.conditions) ? char.conditions : [];
        
        const hpPercent = (char.hp_current / char.hp_max) * 100;
        const sanPercent = (char.san_current / char.san_max) * 100;
        const isCritical = hpPercent <= 25 || sanPercent <= 20;
        
        return (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <MagicCard
              className={cn(
                'relative overflow-hidden',
                isCritical && 'border-destructive/50'
              )}
              gradientColor={classConfig.color}
              gradientOpacity={0.15}
              tiltAmount={5}
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  {/* Photo/Icon */}
                  <div 
                    className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 border border-border/50"
                    style={{ backgroundColor: `${classConfig.color}10` }}
                  >
                    {char.photo_url ? (
                      <img 
                        src={char.photo_url} 
                        alt={char.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <ClassIcon className="w-7 h-7" style={{ color: classConfig.color }} />
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display text-lg tracking-wide truncate">
                      {char.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {char.class} • NEX {char.nex}%
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      {member.profiles?.display_name || 'Jogador'}
                    </p>
                  </div>
                  
                  {/* Link to sheet */}
                  {isMaster && (
                    <Link to={`/character/${char.id}`} target="_blank">
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </Link>
                  )}
                </div>
                
                {/* Status Bars */}
                <div className="space-y-2">
                  <AnimatedProgress
                    value={char.hp_current}
                    max={char.hp_max}
                    variant="hp"
                    size="sm"
                    showLabel
                    showValue
                    glow={hpPercent <= 25}
                  />
                  <AnimatedProgress
                    value={char.pe_current}
                    max={char.pe_max}
                    variant="pe"
                    size="sm"
                    showLabel
                    showValue
                  />
                  <AnimatedProgress
                    value={char.san_current}
                    max={char.san_max}
                    variant="san"
                    size="sm"
                    showLabel
                    showValue
                    glow={sanPercent <= 20}
                  />
                </div>
                
                {/* Conditions */}
                {conditions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <ConditionList conditions={conditions} size="sm" maxVisible={4} />
                  </div>
                )}
              </div>
            </MagicCard>
          </motion.div>
        );
      })}
    </div>
  );
}
