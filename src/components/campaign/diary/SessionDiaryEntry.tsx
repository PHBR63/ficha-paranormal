/**
 * SessionDiaryEntry - Entrada individual do diário de sessão
 * Exibe resumo, notas e eventos de uma sessão específica
 */
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Clock,
  FileText,
  Edit3,
  Save,
  X,
  Loader2,
  Scroll,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos
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

interface SessionNote {
  id: string;
  campaign_id: string;
  user_id: string;
  session_id: string | null;
  title: string | null;
  content: string;
  note_type: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

interface SessionDiaryEntryProps {
  session: CampaignSession;
  sessionNotes: SessionNote[];
  isMaster: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  onSaveSummary?: (sessionId: string, summary: string) => Promise<void>;
}

export function SessionDiaryEntry({
  session,
  sessionNotes,
  isMaster,
  isExpanded = false,
  onToggle,
  onSaveSummary,
}: SessionDiaryEntryProps) {
  const [editing, setEditing] = useState(false);
  const [summary, setSummary] = useState(session.summary || '');
  const [saving, setSaving] = useState(false);

  // Formata duração da sessão
  const formatDuration = () => {
    if (!session.started_at || !session.ended_at) return null;
    const start = new Date(session.started_at);
    const end = new Date(session.ended_at);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}min`;
  };

  // Salva o resumo
  const handleSaveSummary = async () => {
    if (!onSaveSummary) return;
    setSaving(true);
    try {
      await onSaveSummary(session.id, summary);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  // Cancela edição
  const handleCancel = () => {
    setSummary(session.summary || '');
    setEditing(false);
  };

  // Status badge
  const getStatusBadge = () => {
    switch (session.status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">Concluída</Badge>;
      case 'active':
        return <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 animate-pulse">Em Andamento</Badge>;
      case 'scheduled':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Agendada</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="bg-destructive/20 text-destructive border-destructive/30">Cancelada</Badge>;
      default:
        return null;
    }
  };

  const duration = formatDuration();
  const sharedNotes = sessionNotes.filter(n => !n.is_private);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className={cn(
        "ordo-panel transition-all",
        isExpanded && "border-primary/30"
      )}>
        {/* Header - Sempre visível */}
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-start gap-4 text-left hover:bg-muted/30 transition-colors">
            {/* Número da sessão */}
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <span className="font-display text-lg text-primary">
                {session.session_number}
              </span>
            </div>

            {/* Conteúdo principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-display text-base tracking-wide truncate">
                  {session.title || `Sessão ${session.session_number}`}
                </h4>
                {getStatusBadge()}
              </div>

              {/* Metadados */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {session.started_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(session.started_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                )}
                {duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {duration}
                  </span>
                )}
                {sharedNotes.length > 0 && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {sharedNotes.length} nota{sharedNotes.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Preview do resumo */}
              {session.summary && !isExpanded && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {session.summary}
                </p>
              )}
            </div>

            {/* Ícone de expansão */}
            <div className="flex-shrink-0 mt-1">
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Conteúdo expandido */}
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0 border-t border-border mt-0">
            {/* Resumo da sessão */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Scroll className="w-4 h-4 text-primary" />
                  <h5 className="font-display text-sm tracking-wider text-primary">
                    RESUMO DA SESSÃO
                  </h5>
                </div>
                
                {isMaster && !editing && session.status === 'completed' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(true);
                    }}
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                )}
              </div>

              {editing ? (
                <div className="space-y-3">
                  <Textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Escreva um resumo dos eventos desta sessão..."
                    className="min-h-[120px] resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveSummary}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-1" />
                      )}
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-foreground/80 whitespace-pre-wrap">
                  {session.summary || (
                    <span className="text-muted-foreground italic">
                      {session.status === 'completed'
                        ? 'Nenhum resumo adicionado ainda.'
                        : 'O resumo será adicionado após a conclusão da sessão.'}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Notas compartilhadas da sessão */}
            {sharedNotes.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-primary" />
                  <h5 className="font-display text-sm tracking-wider text-primary">
                    NOTAS COMPARTILHADAS
                  </h5>
                </div>

                <div className="space-y-2">
                  {sharedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-lg bg-muted/30 border border-border"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">
                          {note.title || 'Nota sem título'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(note.created_at), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
