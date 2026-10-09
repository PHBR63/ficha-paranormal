/**
 * ActiveSessionBanner - Banner fixo que mostra quando há uma sessão ativa
 * Exibe timer em tempo real e ações rápidas
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Play,
  Clock,
  Users,
  Pause,
} from '@/components/icons/ordem-icons';

interface ActiveSessionBannerProps {
  sessionNumber: number;
  sessionTitle: string | null;
  startedAt: string;
  isMaster: boolean;
  memberCount: number;
  onEndSession?: () => void;
}

export function ActiveSessionBanner({
  sessionNumber,
  sessionTitle,
  startedAt,
  isMaster,
  memberCount,
  onEndSession,
}: ActiveSessionBannerProps) {
  const [elapsed, setElapsed] = useState('00:00:00');

  // Atualiza o timer a cada segundo
  useEffect(() => {
    const updateTimer = () => {
      const start = new Date(startedAt);
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setElapsed(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    // Atualiza imediatamente
    updateTimer();

    // Atualiza a cada segundo
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-b border-primary/30">
      <div className="container mx-auto px-3 sm:px-4 py-2">
        <div className="flex items-center justify-between gap-2">
          {/* Info da sessão - Layout responsivo */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-display text-xs sm:text-sm tracking-wider text-primary">
                <span className="hidden sm:inline">SESSÃO </span>#{sessionNumber}
              </span>
            </div>

            {sessionTitle && (
              <>
                <span className="text-muted-foreground hidden sm:inline">•</span>
                <span className="text-xs sm:text-sm text-foreground truncate max-w-[100px] sm:max-w-[200px] hidden sm:inline">
                  {sessionTitle}
                </span>
              </>
            )}
          </div>

          {/* Timer e stats - Layout compacto no mobile */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Membros online - esconde no mobile pequeno */}
            <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{memberCount}</span>
            </div>

            {/* Timer - sempre visível */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded bg-background/50 border border-border">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <span className="font-mono text-xs sm:text-sm font-medium">{elapsed}</span>
            </div>

            {/* Botão de encerrar - texto menor no mobile */}
            {isMaster && onEndSession && (
              <Button
                size="sm"
                variant="outline"
                onClick={onEndSession}
                className="font-display text-[10px] sm:text-xs px-2 sm:px-3"
              >
                <Pause className="w-3 h-3" />
                <span className="hidden sm:inline ml-1">ENCERRAR</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
