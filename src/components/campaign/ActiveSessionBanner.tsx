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
} from 'lucide-react';

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
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Info da sessão */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-display text-sm tracking-wider text-primary">
                SESSÃO #{sessionNumber} ATIVA
              </span>
            </div>

            {sessionTitle && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-foreground truncate max-w-[200px]">
                  {sessionTitle}
                </span>
              </>
            )}
          </div>

          {/* Timer e stats */}
          <div className="flex items-center gap-4">
            {/* Membros online */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{memberCount}</span>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-background/50 border border-border">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-mono text-sm font-medium">{elapsed}</span>
            </div>

            {/* Botão de encerrar (só para mestre) */}
            {isMaster && onEndSession && (
              <Button
                size="sm"
                variant="outline"
                onClick={onEndSession}
                className="font-display text-xs"
              >
                <Pause className="w-3 h-3 mr-1" />
                ENCERRAR
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
