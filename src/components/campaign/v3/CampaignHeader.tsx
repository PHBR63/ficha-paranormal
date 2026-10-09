/**
 * CampaignHeader - Header compacto com estética Ordem Paranormal
 * 
 * Exibe nome da campanha, sessão ativa, status de conexão.
 * Visual escuro com bordas primárias sutis.
 * 
 * @module components/campaign/v3/CampaignHeader
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Wifi, WifiOff, Users } from '@/components/icons/ordem-icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CampaignHeaderProps {
  campaignName: string;
  currentSession?: number | null;
  hasActiveSession?: boolean;
  onlineCount?: number;
  isConnected?: boolean;
  onOpenSettings?: () => void;
  isMaster?: boolean;
  className?: string;
}

export const CampaignHeader = memo(function CampaignHeader({
  campaignName,
  currentSession,
  hasActiveSession = false,
  onlineCount = 0,
  isConnected = false,
  onOpenSettings,
  isMaster = false,
  className,
}: CampaignHeaderProps) {
  const navigate = useNavigate();

  return (
    <header
      className={cn(
        'h-12 shrink-0 bg-card/50 backdrop-blur-sm',
        'border-b border-primary/10',
        'flex items-center justify-between px-3 gap-3',
        className
      )}
    >
      {/* Esquerda: Voltar + Nome */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/campaigns')}
              aria-label="Voltar para campanhas"
              title="Voltar para campanhas"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Voltar para campanhas</TooltipContent>
        </Tooltip>

        {/* Nome com estilo dossiê */}
        <h1 className="text-sm font-semibold text-foreground truncate tracking-wide">
          {campaignName}
        </h1>

        {/* Badge de sessão */}
        {hasActiveSession && currentSession && (
          <Badge
            variant="outline"
            className="shrink-0 text-xs bg-primary/10 text-primary border-primary/30 animate-pulse"
          >
            Sessão {currentSession}
          </Badge>
        )}

        {/* Indicador mestre */}
        {isMaster && (
          <Badge
            variant="secondary"
            className="shrink-0 text-xs bg-accent/20 text-accent-foreground border-accent/30"
          >
            Mestre
          </Badge>
        )}
      </div>

      {/* Direita: Status + Ações */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Contador online */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span className="tabular-nums">{onlineCount}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {onlineCount} {onlineCount === 1 ? 'membro online' : 'membros online'}
          </TooltipContent>
        </Tooltip>

        {/* Status conexão */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              'flex items-center gap-1',
              isConnected ? 'text-green-500' : 'text-destructive'
            )}>
              {isConnected ? (
                <Wifi className="h-3.5 w-3.5" />
              ) : (
                <WifiOff className="h-3.5 w-3.5" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isConnected ? 'Conectado em tempo real' : 'Desconectado'}
          </TooltipContent>
        </Tooltip>

        {/* Configurações (mestre) */}
        {isMaster && onOpenSettings && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onOpenSettings}
            aria-label="Abrir configurações da campanha"
            title="Abrir configurações da campanha"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
});

export default CampaignHeader;
