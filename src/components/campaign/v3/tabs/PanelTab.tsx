/**
 * PanelTab - Aba de painel/dashboard da campanha v3
 * 
 * Exibe status consolidado dos agentes:
 * - Cards de status (HP, SAN, PE)
 * - Condições ativas
 * - Informações da sessão
 * 
 * @module components/campaign/v3/tabs/PanelTab
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Heart, Brain, Zap, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';
import type { CampaignSession } from '@/hooks/campaign/useCampaignRealtime';
import type { UserPresence } from '@/hooks/campaign/useCampaignPresence';

interface PanelTabProps {
  /** Membros da campanha */
  members: CampaignMemberV2[];
  /** Sessão ativa (se houver) */
  activeSession?: CampaignSession | null;
  /** Mapa de presença */
  presenceMap: Record<string, UserPresence>;
  /** Classe CSS adicional */
  className?: string;
}

// Animação de entrada dos cards
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: 'easeOut' as const,
    },
  }),
};

// Card de status de um membro
const MemberStatusCard = memo(function MemberStatusCard({
  member,
  presence,
  index,
}: {
  member: CampaignMemberV2;
  presence?: UserPresence;
  index: number;
}) {
  const character = member.characters;
  const profile = member.profiles;
  
  // Sem personagem, não mostra card de status
  if (!character) return null;
  
  const displayName = character.name || profile?.display_name || 'Sem nome';
  const avatarUrl = character.photo_url || profile?.avatar_url;
  const initials = displayName.substring(0, 2).toUpperCase();
  
  // Status de presença
  const status = presence?.status || 'offline';
  const statusColor = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-muted-foreground/40',
  }[status];

  // Cálculos de porcentagem
  const hpPercent = (character.hp_current / character.hp_max) * 100;
  const sanPercent = (character.san_current / character.san_max) * 100;
  const pePercent = (character.pe_current / character.pe_max) * 100;
  
  // Status crítico
  const isCritical = hpPercent <= 25 || sanPercent <= 25;

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      <Card className={cn(
        'relative overflow-hidden transition-colors',
        isCritical && 'border-destructive/50 bg-destructive/5',
        status === 'offline' && 'opacity-60'
      )}>
        {/* Indicador de presença */}
        <div 
          className={cn(
            'absolute top-0 left-0 right-0 h-0.5',
            statusColor
          )} 
        />
        
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-medium truncate">
                {displayName}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {character.class} • NEX {character.nex}%
              </p>
            </div>
            {isCritical && (
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            )}
          </div>
        </CardHeader>
        
        <CardContent className="px-3 pb-3 space-y-2">
          {/* HP */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Heart className="h-3 w-3 text-red-500" />
                <span>PV</span>
              </div>
              <span className="font-medium">
                {character.hp_current}/{character.hp_max}
              </span>
            </div>
            <Progress 
              value={hpPercent} 
              className="h-1.5"
            />
          </div>
          
          {/* SAN */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Brain className="h-3 w-3 text-purple-500" />
                <span>SAN</span>
              </div>
              <span className="font-medium">
                {character.san_current}/{character.san_max}
              </span>
            </div>
            <Progress 
              value={sanPercent} 
              className="h-1.5 [&>div]:bg-purple-500"
            />
          </div>
          
          {/* PE */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Zap className="h-3 w-3 text-blue-500" />
                <span>PE</span>
              </div>
              <span className="font-medium">
                {character.pe_current}/{character.pe_max}
              </span>
            </div>
            <Progress 
              value={pePercent} 
              className="h-1.5 [&>div]:bg-blue-500"
            />
          </div>
          
          {/* Condições */}
          {character.conditions && character.conditions.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {character.conditions.slice(0, 3).map((condition, i) => (
                <Badge 
                  key={i} 
                  variant="outline" 
                  className="text-[10px] px-1.5 py-0"
                >
                  {condition}
                </Badge>
              ))}
              {character.conditions.length > 3 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  +{character.conditions.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});

export const PanelTab = memo(function PanelTab({
  members,
  activeSession,
  presenceMap,
  className,
}: PanelTabProps) {
  // Filtra apenas membros com personagem
  const membersWithCharacter = members.filter(m => m.characters);
  
  // Ordena por status de presença
  const sortedMembers = [...membersWithCharacter].sort((a, b) => {
    const statusA = presenceMap[a.user_id]?.status || 'offline';
    const statusB = presenceMap[b.user_id]?.status || 'offline';
    const order = { online: 0, away: 1, offline: 2 };
    return order[statusA] - order[statusB];
  });

  return (
    <ScrollArea className={cn('h-full', className)}>
      <div className="p-4 space-y-4">
        {/* Sessão ativa */}
        {activeSession && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-sm font-medium">
                    {activeSession.title || `Sessão ${activeSession.session_number}`}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Em andamento
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Grid de status dos agentes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {sortedMembers.map((member, index) => (
            <MemberStatusCard
              key={member.id}
              member={member}
              presence={presenceMap[member.user_id]}
              index={index}
            />
          ))}
        </div>
        
        {/* Estado vazio */}
        {sortedMembers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">Nenhum personagem na campanha ainda.</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
});

export default PanelTab;
