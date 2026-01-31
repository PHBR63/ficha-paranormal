/**
 * CampaignHeader - Header compacto da campanha v3
 * 
 * Exibe informações essenciais: nome, sessão ativa, status de conexão
 * Design minimalista funcional com altura fixa de 48px
 * 
 * @module components/campaign/v3/CampaignHeader
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Wifi, WifiOff, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CampaignHeaderProps {
  /** Nome da campanha */
  campaignName: string;
  /** Número da sessão atual (se ativa) */
  currentSession?: number | null;
  /** Indica se há sessão ativa */
  hasActiveSession?: boolean;
  /** Número de usuários online */
  onlineCount?: number;
  /** Status da conexão realtime */
  isConnected?: boolean;
  /** Callback para abrir configurações */
  onOpenSettings?: () => void;
  /** Se o usuário é mestre */
  isMaster?: boolean;
  /** Classe CSS adicional */
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
        'h-12 shrink-0 border-b border-border/50 bg-card/30 backdrop-blur-sm',
        'flex items-center justify-between px-3 gap-3',
        className
      )}
    >
      {/* Lado esquerdo: Voltar + Nome */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => navigate('/campaigns')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Voltar para campanhas
          </TooltipContent>
        </Tooltip>

        <h1 className="text-sm font-medium text-foreground truncate">
          {campaignName}
        </h1>

        {/* Badge de sessão */}
        {hasActiveSession && currentSession && (
          <Badge 
            variant="outline" 
            className="shrink-0 text-xs bg-primary/10 text-primary border-primary/30"
          >
            Sessão {currentSession}
          </Badge>
        )}

        {/* Indicador mestre */}
        {isMaster && (
          <Badge 
            variant="secondary" 
            className="shrink-0 text-xs"
          >
            Mestre
          </Badge>
        )}
      </div>

      {/* Lado direito: Status + Ações */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Contador online */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{onlineCount}</span>
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

        {/* Configurações (apenas mestre) */}
        {isMaster && onOpenSettings && (
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            onClick={onOpenSettings}
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
});

export default CampaignHeader;
