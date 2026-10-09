/**
 * SessionExporter - Exportador de relatório de sessão
 * 
 * Gera documento com resumo da sessão para compartilhamento.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Download,
  FileText,
  Users,
  Clock,
  Scroll,
  Dices,
  Loader2,
} from '@/components/icons/ordem-icons';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interface de sessão
interface SessionData {
  id: string;
  session_number: number;
  title: string | null;
  summary: string | null;
  started_at: string | null;
  ended_at: string | null;
  status: string;
}

// Interface de participante
interface Participant {
  name: string;
  characterName: string;
  class: string;
}

// Interface de rolagem
interface RollLog {
  characterName: string;
  label: string;
  result: number;
  isCritical: boolean;
  isFumble: boolean;
}

interface SessionExporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: SessionData;
  campaignName: string;
  participants?: Participant[];
  rolls?: RollLog[];
}

export function SessionExporter({
  open,
  onOpenChange,
  session,
  campaignName,
  participants = [],
  rolls = [],
}: SessionExporterProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // Opções de exportação
  const [includeParticipants, setIncludeParticipants] = useState(true);
  const [includeDuration, setIncludeDuration] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeRolls, setIncludeRolls] = useState(false);
  const [includeStats, setIncludeStats] = useState(true);

  // Calcula duração
  const getDuration = () => {
    if (!session.started_at || !session.ended_at) return null;
    const start = new Date(session.started_at);
    const end = new Date(session.ended_at);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
  };

  // Calcula estatísticas
  const getStats = () => {
    if (rolls.length === 0) return null;
    
    const criticals = rolls.filter(r => r.isCritical).length;
    const fumbles = rolls.filter(r => r.isFumble).length;
    const average = rolls.reduce((sum, r) => sum + r.result, 0) / rolls.length;
    
    return { total: rolls.length, criticals, fumbles, average: average.toFixed(1) };
  };

  // Gera conteúdo Markdown
  const generateMarkdown = () => {
    const lines: string[] = [];
    const duration = getDuration();
    const stats = getStats();

    // Cabeçalho
    lines.push(`# ${campaignName}`);
    lines.push(`## Sessão ${session.session_number}${session.title ? `: ${session.title}` : ''}`);
    lines.push('');

    // Data
    if (session.started_at) {
      lines.push(`**Data:** ${format(new Date(session.started_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`);
    }

    // Duração
    if (includeDuration && duration) {
      lines.push(`**Duração:** ${duration.hours}h ${duration.minutes}min`);
    }

    lines.push('');

    // Participantes
    if (includeParticipants && participants.length > 0) {
      lines.push('### Participantes');
      lines.push('');
      participants.forEach(p => {
        lines.push(`- **${p.characterName}** (${p.class}) - ${p.name}`);
      });
      lines.push('');
    }

    // Resumo
    if (includeSummary && session.summary) {
      lines.push('### Resumo');
      lines.push('');
      lines.push(session.summary);
      lines.push('');
    }

    // Estatísticas
    if (includeStats && stats) {
      lines.push('### Estatísticas');
      lines.push('');
      lines.push(`- **Total de rolagens:** ${stats.total}`);
      lines.push(`- **Críticos:** ${stats.criticals}`);
      lines.push(`- **Desastres:** ${stats.fumbles}`);
      lines.push(`- **Média:** ${stats.average}`);
      lines.push('');
    }

    // Rolagens
    if (includeRolls && rolls.length > 0) {
      lines.push('### Rolagens Importantes');
      lines.push('');
      rolls.filter(r => r.isCritical || r.isFumble).forEach(r => {
        const emoji = r.isCritical ? '🎯' : '💀';
        lines.push(`- ${emoji} **${r.characterName}** - ${r.label}: ${r.result}`);
      });
      lines.push('');
    }

    // Rodapé
    lines.push('---');
    lines.push(`*Relatório gerado em ${format(new Date(), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}*`);

    return lines.join('\n');
  };

  // Exporta para Markdown
  const handleExportMarkdown = () => {
    setIsExporting(true);
    
    try {
      const content = generateMarkdown();
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sessao-${session.session_number}-${campaignName.toLowerCase().replace(/\s+/g, '-')}.md`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Exportado!',
        description: 'Relatório da sessão salvo em Markdown.',
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao exportar relatório.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Copia para clipboard
  const handleCopyToClipboard = async () => {
    try {
      const content = generateMarkdown();
      await navigator.clipboard.writeText(content);
      
      toast({
        title: 'Copiado!',
        description: 'Relatório copiado para a área de transferência.',
      });
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao copiar relatório.',
        variant: 'destructive',
      });
    }
  };

  const duration = getDuration();
  const stats = getStats();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Exportar Relatório
          </DialogTitle>
          <DialogDescription>
            Gere um relatório da Sessão {session.session_number}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preview info */}
          <div className="p-4 bg-secondary/30 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Scroll className="w-4 h-4 text-primary" />
              <span className="font-medium">
                Sessão {session.session_number}
                {session.title && `: ${session.title}`}
              </span>
            </div>
            
            {duration && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{duration.hours}h {duration.minutes}min</span>
              </div>
            )}
            
            {participants.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{participants.length} participantes</span>
              </div>
            )}
            
            {stats && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Dices className="w-4 h-4" />
                <span>{stats.total} rolagens ({stats.criticals} críticos)</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Opções */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Incluir no relatório:</Label>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-participants"
                  checked={includeParticipants}
                  onCheckedChange={(c) => setIncludeParticipants(!!c)}
                />
                <Label htmlFor="include-participants" className="text-sm font-normal cursor-pointer">
                  Lista de participantes
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-duration"
                  checked={includeDuration}
                  onCheckedChange={(c) => setIncludeDuration(!!c)}
                />
                <Label htmlFor="include-duration" className="text-sm font-normal cursor-pointer">
                  Duração da sessão
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-summary"
                  checked={includeSummary}
                  onCheckedChange={(c) => setIncludeSummary(!!c)}
                  disabled={!session.summary}
                />
                <Label 
                  htmlFor="include-summary" 
                  className={cn(
                    "text-sm font-normal cursor-pointer",
                    !session.summary && "text-muted-foreground"
                  )}
                >
                  Resumo da sessão {!session.summary && '(não disponível)'}
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-stats"
                  checked={includeStats}
                  onCheckedChange={(c) => setIncludeStats(!!c)}
                  disabled={!stats}
                />
                <Label 
                  htmlFor="include-stats" 
                  className={cn(
                    "text-sm font-normal cursor-pointer",
                    !stats && "text-muted-foreground"
                  )}
                >
                  Estatísticas de rolagens
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-rolls"
                  checked={includeRolls}
                  onCheckedChange={(c) => setIncludeRolls(!!c)}
                  disabled={rolls.length === 0}
                />
                <Label 
                  htmlFor="include-rolls" 
                  className={cn(
                    "text-sm font-normal cursor-pointer",
                    rolls.length === 0 && "text-muted-foreground"
                  )}
                >
                  Rolagens importantes (críticos/desastres)
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCopyToClipboard}
            className="flex-1 sm:flex-none"
          >
            Copiar Texto
          </Button>
          <Button
            onClick={handleExportMarkdown}
            disabled={isExporting}
            className="flex-1 sm:flex-none gap-2"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Baixar Markdown
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SessionExporter;
