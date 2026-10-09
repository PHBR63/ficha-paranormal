/**
 * SessionCard - Card individual para exibir informações de uma sessão
 * Exibe status, duração, ações de controle
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Play,
  Square,
  Trash2,
  Clock,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
} from '@/components/icons/ordem-icons';

interface CampaignSession {
  id: string;
  campaign_id: string;
  session_number: number;
  title: string | null;
  summary: string | null;
  status: string;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  notes: any;
  created_at: string;
}

interface SessionCardProps {
  session: CampaignSession;
  isMaster: boolean;
  isActive?: boolean;
  onStart: (sessionId: string) => void;
  onEnd: (sessionId: string, summary?: string) => void;
  onDelete: (sessionId: string) => void;
}

export function SessionCard({ 
  session, 
  isMaster, 
  isActive,
  onStart, 
  onEnd, 
  onDelete 
}: SessionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [summary, setSummary] = useState('');

  // Calcula duração da sessão
  const getDuration = () => {
    if (!session.started_at) return null;
    
    const start = new Date(session.started_at);
    const end = session.ended_at ? new Date(session.ended_at) : new Date();
    const diffMs = end.getTime() - start.getTime();
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  };

  // Status badge
  const getStatusBadge = () => {
    switch (session.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Em andamento
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
            Concluída
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/20 text-primary border border-primary/30">
            Agendada
          </span>
        );
      default:
        return null;
    }
  };

  // Formata data
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEndSession = () => {
    onEnd(session.id, summary);
    setEndDialogOpen(false);
    setSummary('');
  };

  return (
    <>
      <div 
        className={cn(
          'ordo-panel p-4 transition-all',
          isActive && 'border-primary/50',
          session.status === 'completed' && 'opacity-75'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display text-lg">
                #{session.session_number}
              </span>
              {getStatusBadge()}
            </div>
            
            <h4 className="font-medium truncate">
              {session.title || `Sessão ${session.session_number}`}
            </h4>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
              {session.scheduled_at && session.status === 'scheduled' && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(session.scheduled_at)}
                </span>
              )}
              
              {session.started_at && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {getDuration()}
                </span>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2">
            {isMaster && session.status === 'scheduled' && (
              <Button
                size="sm"
                onClick={() => onStart(session.id)}
                className="font-display"
              >
                <Play className="w-3 h-3 mr-1" />
                INICIAR
              </Button>
            )}

            {isMaster && session.status === 'active' && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setEndDialogOpen(true)}
                className="font-display"
              >
                <Square className="w-3 h-3 mr-1" />
                ENCERRAR
              </Button>
            )}

            {session.summary && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            )}

            {isMaster && session.status !== 'active' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(session.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Resumo expandido */}
        {expanded && session.summary && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>Resumo da Sessão</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{session.summary}</p>
          </div>
        )}
      </div>

      {/* Dialog para encerrar sessão */}
      <Dialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl tracking-wider">
              ENCERRAR SESSÃO
            </DialogTitle>
            <DialogDescription>
              Adicione um resumo do que aconteceu nesta sessão (opcional).
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="O que aconteceu nesta sessão? Principais eventos, descobertas, combates..."
              className="min-h-[150px]"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEndDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEndSession} variant="destructive">
              <Square className="w-4 h-4 mr-2" />
              ENCERRAR SESSÃO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
