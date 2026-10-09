/**
 * AuditLogEntry - Componente de entrada individual da timeline
 * 
 * Exibe um evento de auditoria com ícone, descrição,
 * timestamp e detalhes expandíveis.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronDown, ChevronUp, User } from '@/components/icons/ordem-icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getActionConfig } from './audit-log-constants';
import type { EnrichedAuditLogEntry } from './audit-log-types';

interface AuditLogEntryComponentProps {
  entry: EnrichedAuditLogEntry;
  isLast?: boolean;
}

/**
 * Componente visual para uma entrada de log na timeline
 */
export function AuditLogEntryComponent({ 
  entry, 
  isLast = false 
}: AuditLogEntryComponentProps) {
  const [showDetails, setShowDetails] = useState(false);
  const config = getActionConfig(entry.action_type);
  const Icon = config.icon;

  // Formatar timestamp
  const timestamp = new Date(entry.created_at);
  const relativeTime = formatDistanceToNow(timestamp, { 
    addSuffix: true, 
    locale: ptBR 
  });
  const absoluteTime = format(timestamp, "dd/MM/yyyy 'às' HH:mm", { 
    locale: ptBR 
  });

  // Nome do executor
  const performerName = entry.performer_profile?.display_name || 'Usuário desconhecido';
  
  // Nome do alvo (se diferente do executor)
  const targetName = entry.target_profile?.display_name;
  const showTarget = entry.target_user_id !== entry.performed_by && targetName;

  // Verificar se há detalhes para exibir
  const hasDetails = entry.details || entry.old_value || entry.new_value;

  return (
    <div className="relative pl-8 pb-6 group">
      {/* Linha vertical da timeline */}
      {!isLast && (
        <div 
          className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-border 
                     group-hover:bg-primary/30 transition-colors" 
        />
      )}

      {/* Ícone do evento */}
      <div 
        className={cn(
          "absolute left-0 p-2 rounded-full border-2 border-background",
          config.bgColor
        )}
      >
        <Icon className={cn("w-4 h-4", config.color)} />
      </div>

      {/* Conteúdo do evento */}
      <div className="bg-card border border-border rounded-lg p-4 ml-4 
                      hover:border-primary/30 transition-colors">
        {/* Header com ação e timestamp */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className={cn(config.bgColor, "border-none")}>
              <span className={config.color}>{config.label}</span>
            </Badge>
            
            {showTarget && (
              <span className="text-sm text-muted-foreground">
                → <strong className="text-foreground">{targetName}</strong>
              </span>
            )}
          </div>

          <time 
            className="text-xs text-muted-foreground whitespace-nowrap"
            title={absoluteTime}
          >
            {relativeTime}
          </time>
        </div>

        {/* Executor */}
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="w-6 h-6">
            <AvatarImage src={entry.performer_profile?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              <User className="w-3 h-3" />
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">
            <strong>{performerName}</strong>
            <span className="text-muted-foreground ml-1">
              realizou esta ação
            </span>
          </span>
        </div>

        {/* Botão para expandir detalhes */}
        {hasDetails && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" />
                  Ocultar detalhes
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  Ver detalhes
                </>
              )}
            </Button>

            {/* Painel de detalhes */}
            {showDetails && (
              <div className="mt-3 p-3 bg-muted/50 rounded-md text-sm space-y-2">
                {entry.old_value && (
                  <div>
                    <span className="text-muted-foreground">Valor anterior: </span>
                    <code className="text-destructive bg-destructive/10 px-1 rounded">
                      {entry.old_value}
                    </code>
                  </div>
                )}
                {entry.new_value && (
                  <div>
                    <span className="text-muted-foreground">Novo valor: </span>
                    <code className="text-emerald-500 bg-emerald-500/10 px-1 rounded">
                      {entry.new_value}
                    </code>
                  </div>
                )}
                {entry.details && (
                  <div>
                    <span className="text-muted-foreground">Detalhes: </span>
                    <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                      {JSON.stringify(entry.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
