/**
 * CampaignStatusBar - Barra inferior de presença e ações rápidas
 * 
 * Exibe avatares dos membros com indicador de presença.
 * Popover simplificado: apenas identidade + presença (sem barras).
 * As barras de PV/SAN/PE ficam exclusivamente no PanelTab.
 * 
 * @module components/campaign/v3/CampaignStatusBar
 */

import { memo, useState } from 'react';
import { Dice6, FileText, Play, Square } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';
import type { UserPresence } from '@/hooks/campaign/useCampaignPresence';

// =====================================================
// TIPOS
// =====================================================

interface CampaignStatusBarProps {
  members: CampaignMemberV2[];
  presenceMap: Record<string, UserPresence>;
  isMaster?: boolean;
  hasActiveSession?: boolean;
  onOpenDice?: () => void;
  onOpenNotes?: () => void;
  onStartSession?: () => void;
  onEndSession?: () => void;
  className?: string;
}

// =====================================================
// AVATAR COM POPOVER SIMPLIFICADO
// =====================================================

const MemberAvatar = memo(function MemberAvatar({
  member,
  presence,
}: {
  member: CampaignMemberV2;
  presence?: UserPresence;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const character = member.characters;
  const profile = member.profiles;

  const status = presence?.status || 'offline';
  const statusColor = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-muted-foreground/50',
  }[status];
  const statusLabel = {
    online: 'Online',
    away: 'Ausente',
    offline: 'Offline',
  }[status];

  const displayName = character?.name || profile?.display_name || 'Desconhecido';
  const initials = displayName.substring(0, 2).toUpperCase();
  const avatarUrl = character?.photo_url || profile?.avatar_url;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
          title={displayName}
          aria-label={`Ver presença de ${displayName}: ${statusLabel}`}
        >
          <Avatar className="h-8 w-8 border-2 border-background ring-1 ring-border/50 hover:ring-primary/50 transition-all">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="text-xs bg-muted">{initials}</AvatarFallback>
          </Avatar>
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background',
              statusColor
            )}
          />
        </button>
      </PopoverTrigger>

      {/* Popover simplificado — só identidade e presença */}
      <PopoverContent className="w-52 p-3" align="start" side="top">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            {character && (
              <p className="text-xs text-muted-foreground">
                {character.class} • NEX {character.nex}%
              </p>
            )}
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] capitalize mt-1',
                status === 'online' && 'border-green-500/50 text-green-500',
                status === 'away' && 'border-yellow-500/50 text-yellow-500',
                status === 'offline' && 'border-muted-foreground/50 text-muted-foreground'
              )}
            >
              {statusLabel}
            </Badge>
          </div>
        </div>

        {/* Badge de mestre */}
        {member.role === 'master' && (
          <Badge variant="secondary" className="w-full justify-center mt-2">
            Mestre da Campanha
          </Badge>
        )}
      </PopoverContent>
    </Popover>
  );
});

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export const CampaignStatusBar = memo(function CampaignStatusBar({
  members,
  presenceMap,
  isMaster = false,
  hasActiveSession = false,
  onOpenDice,
  onOpenNotes,
  onStartSession,
  onEndSession,
  className,
}: CampaignStatusBarProps) {
  // Ordena: mestre primeiro, depois online, depois offline
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'master') return -1;
    if (b.role === 'master') return 1;
    const statusA = presenceMap[a.user_id]?.status || 'offline';
    const statusB = presenceMap[b.user_id]?.status || 'offline';
    const statusOrder = { online: 0, away: 1, offline: 2 };
    return statusOrder[statusA] - statusOrder[statusB];
  });

  return (
    <footer
      className={cn(
        'h-14 shrink-0 border-t border-border/50 bg-card/30 backdrop-blur-sm',
        'flex items-center justify-between px-4 gap-4',
        className
      )}
    >
      {/* Avatares dos membros */}
      <div className="flex items-center gap-1 min-w-0 flex-1">
        <div className="flex -space-x-2">
          {sortedMembers.slice(0, 8).map((member) => (
            <MemberAvatar
              key={member.id}
              member={member}
              presence={presenceMap[member.user_id]}
            />
          ))}
        </div>
        {sortedMembers.length > 8 && (
          <Badge variant="secondary" className="ml-2 text-xs">
            +{sortedMembers.length - 8}
          </Badge>
        )}
      </div>

      {/* Ações rápidas */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Controle de sessão (mestre) */}
        {isMaster && (
          hasActiveSession ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  onClick={onEndSession}
                  aria-label="Encerrar sessão atual"
                  title="Encerrar sessão atual"
                >
                  <Square className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Encerrar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Encerrar sessão atual</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-primary hover:text-primary"
                  onClick={onStartSession}
                  aria-label="Iniciar nova sessão"
                  title="Iniciar nova sessão"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Iniciar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Iniciar nova sessão</TooltipContent>
            </Tooltip>
          )
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onOpenDice} aria-label="Rolar dados" title="Rolar dados">
              <Dice6 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Rolar dados</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onOpenNotes} aria-label="Abrir notas rápidas" title="Abrir notas rápidas">
              <FileText className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notas rápidas</TooltipContent>
        </Tooltip>
      </div>
    </footer>
  );
});

export default CampaignStatusBar;
