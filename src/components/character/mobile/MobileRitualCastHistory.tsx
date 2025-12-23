/**
 * MobileRitualCastHistory - Histórico de rituais conjurados para mobile
 * Drawer lateral com lista de conjurações da sessão
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, 
  Sparkles, 
  Clock, 
  Zap,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Ritual } from '@/lib/rituals/legacy-exports';
import { getElementConfig } from '@/lib/element-config';

// Interface para registro de conjuração
export interface RitualCastRecord {
  id: string;
  ritual: Ritual;
  peCost: number;
  enhancements: string[];
  timestamp: Date;
  peBeforeCast: number;
  peAfterCast: number;
}

interface MobileRitualCastHistoryProps {
  history: RitualCastRecord[];
  onClear: () => void;
  characterName?: string;
}

// Formata timestamp
function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit',
  });
}

// Formata tempo relativo
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  return formatTime(date);
}

// Card de conjuração
const CastRecordCard = memo(function CastRecordCard({ 
  record 
}: { 
  record: RitualCastRecord 
}) {
  const elementConfig = getElementConfig(record.ritual.element);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "p-3 rounded-lg border",
        elementConfig?.bg || "bg-card",
        elementConfig?.border || "border-border"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            "w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0",
            elementConfig?.bg || "bg-muted",
            "border",
            elementConfig?.border || "border-border"
          )}>
            <span className="text-lg font-display">{record.ritual.circle}º</span>
          </div>
          
          <div className="min-w-0">
            <h4 className={cn(
              "font-medium text-sm truncate",
              elementConfig?.text || "text-foreground"
            )}>
              {record.ritual.name}
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatTime(record.timestamp)}</span>
              <span className="opacity-50">•</span>
              <span>{formatRelativeTime(record.timestamp)}</span>
            </div>
          </div>
        </div>

        <Badge variant="outline" className={cn("text-[10px] flex-shrink-0", elementConfig?.badgeBg)}>
          -{record.peCost} PE
        </Badge>
      </div>

      {/* Barra de PE */}
      <div className="mt-2 pt-2 border-t border-border/50">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="flex h-full">
            <div 
              className="h-full bg-pe"
              style={{ width: `${(record.peAfterCast / record.peBeforeCast) * 100}%` }}
            />
            <div 
              className="h-full bg-destructive/50"
              style={{ width: `${(record.peCost / record.peBeforeCast) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
          <span>{record.peAfterCast} PE restante</span>
          <span>de {record.peBeforeCast}</span>
        </div>
      </div>

      {/* Aprimoramentos */}
      {record.enhancements.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <div className="flex flex-wrap gap-1">
            {record.enhancements.map((enh, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className="text-[9px] px-1.5 py-0"
              >
                {enh}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
});

export const MobileRitualCastHistory = memo(function MobileRitualCastHistory({
  history,
  onClear,
  characterName,
}: MobileRitualCastHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Estatísticas
  const totalPeSpent = history.reduce((sum, r) => sum + r.peCost, 0);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5 relative",
            history.length > 0 && "border-paranormal/50 text-paranormal"
          )}
        >
          <History className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Histórico</span>
          {history.length > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center bg-paranormal text-paranormal-foreground text-[9px]"
            >
              {history.length}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-4 border-b border-border">
          <DrawerTitle className="flex items-center gap-2 font-display tracking-wider">
            <Sparkles className="w-5 h-5 text-paranormal" />
            Rituais Conjurados
          </DrawerTitle>
          {characterName && (
            <p className="text-sm text-muted-foreground">
              Sessão de {characterName}
            </p>
          )}
        </DrawerHeader>

        {/* Estatísticas */}
        {history.length > 0 && (
          <div className="grid grid-cols-2 gap-2 p-4 border-b border-border">
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-pe">{totalPeSpent}</p>
              <p className="text-[10px] text-muted-foreground uppercase">PE Total</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-paranormal">{history.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Conjurações</p>
            </div>
          </div>
        )}

        {/* Lista */}
        <ScrollArea className="flex-1 h-[calc(85vh-220px)] p-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-foreground/50" />
              </div>
              <h4 className="font-medium text-foreground/70">Nenhum ritual conjurado</h4>
              <p className="text-sm text-foreground/60 mt-1 max-w-[200px]">
                Os rituais conjurados nesta sessão aparecerão aqui
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-2">
                {history.map((record) => (
                  <CastRecordCard key={record.id} record={record} />
                ))}
              </div>
            </AnimatePresence>
          )}
        </ScrollArea>

        {/* Ações */}
        {history.length > 0 && (
          <div className="p-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if ('vibrate' in navigator) navigator.vibrate(30);
                onClear();
              }}
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Histórico
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
});

export default MobileRitualCastHistory;
