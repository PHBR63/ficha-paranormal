/**
 * CampaignRitualFeed - Feed em tempo real de conjurações da campanha
 * Mostra para o mestre e jogadores quando rituais são conjurados
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  Clock, 
  Zap,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getElementConfig } from '@/lib/element-config';
import { CampaignRitualCast } from '@/hooks/useCampaignRitualSync';
import { supabase } from '@/integrations/supabase/client';

interface CampaignRitualFeedProps {
  campaignId: string;
  className?: string;
  compact?: boolean;
  maxItems?: number;
}

// Formata timestamp para exibição
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit',
  });
}

// Formata tempo relativo
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  return formatTime(dateStr);
}

// Item individual de conjuração
function CastFeedItem({ 
  cast, 
  characterName,
  compact = false,
  isNew = false,
}: { 
  cast: CampaignRitualCast; 
  characterName?: string;
  compact?: boolean;
  isNew?: boolean;
}) {
  const elementConfig = getElementConfig(cast.ritual_element);
  const ElementIcon = elementConfig?.icon || Sparkles;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 20, scale: 0.95 }}
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg text-xs",
          elementConfig?.bg || "bg-muted",
          isNew && "ring-2 ring-primary/50 animate-pulse"
        )}
      >
        <ElementIcon className={cn("w-4 h-4 flex-shrink-0", elementConfig?.text)} />
        <span className="font-medium truncate">{characterName || 'Jogador'}</span>
        <span className="text-muted-foreground">conjurou</span>
        <span className={cn("font-medium truncate", elementConfig?.text)}>
          {cast.ritual_name}
        </span>
        <Badge variant="outline" className="text-[9px] ml-auto flex-shrink-0">
          -{cast.pe_cost} PE
        </Badge>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={cn(
        "p-3 rounded-lg border",
        elementConfig?.bg || "bg-card",
        elementConfig?.border || "border-border",
        isNew && "ring-2 ring-primary/50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            "w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0",
            elementConfig?.bg,
            "border",
            elementConfig?.border
          )}>
            <ElementIcon className={cn("w-4 h-4", elementConfig?.text)} />
          </div>
          
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {characterName || 'Jogador'}
            </p>
            <h4 className={cn(
              "font-medium text-sm truncate",
              elementConfig?.text
            )}>
              {cast.ritual_name}
            </h4>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <Badge className={cn("text-[10px]", elementConfig?.badgeBg)}>
            {cast.ritual_circle}º Círculo
          </Badge>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {formatRelativeTime(cast.created_at)}
          </p>
        </div>
      </div>

      {/* Detalhes */}
      <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-pe">
          <Zap className="w-3 h-3" />
          <span className="font-medium">-{cast.pe_cost} PE</span>
        </div>
        <div className="text-muted-foreground">
          {cast.pe_before} → {cast.pe_after} PE
        </div>
      </div>

      {/* Aprimoramentos */}
      {cast.enhancements && cast.enhancements.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {cast.enhancements.map((enh, i) => (
            <Badge key={i} variant="secondary" className="text-[10px]">
              {enh}
            </Badge>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function CampaignRitualFeed({ 
  campaignId, 
  className,
  compact = false,
  maxItems = 20,
}: CampaignRitualFeedProps) {
  const [casts, setCasts] = useState<CampaignRitualCast[]>([]);
  const [characterNames, setCharacterNames] = useState<Record<string, string>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [newCastIds, setNewCastIds] = useState<Set<string>>(new Set());

  // Carrega conjurações iniciais
  useEffect(() => {
    const fetchCasts = async () => {
      const { data, error } = await supabase
        .from('campaign_ritual_casts')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(maxItems);

      if (error) {
        console.error('[RitualFeed] Error fetching casts:', error);
        return;
      }

      if (data) {
        setCasts(data as CampaignRitualCast[]);
        
        // Busca nomes dos personagens
        const characterIds = [...new Set(data.map(c => c.character_id))];
        if (characterIds.length > 0) {
          const { data: charactersData } = await supabase
            .from('characters')
            .select('id, name')
            .in('id', characterIds);

          if (charactersData) {
            const names: Record<string, string> = {};
            charactersData.forEach(c => {
              names[c.id] = c.name;
            });
            setCharacterNames(names);
          }
        }
      }
    };

    fetchCasts();
  }, [campaignId, maxItems]);

  // Subscreve para atualizações em tempo real
  useEffect(() => {
    console.log('[RitualFeed] Setting up realtime subscription for campaign:', campaignId);

    const channel = supabase
      .channel(`ritual-feed-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'campaign_ritual_casts',
          filter: `campaign_id=eq.${campaignId}`,
        },
        async (payload) => {
          console.log('[RitualFeed] New cast received:', payload);
          const newCast = payload.new as CampaignRitualCast;
          
          // Marca como novo para animação
          setNewCastIds(prev => new Set([...prev, newCast.id]));
          
          // Remove marcação após 3 segundos
          setTimeout(() => {
            setNewCastIds(prev => {
              const next = new Set(prev);
              next.delete(newCast.id);
              return next;
            });
          }, 3000);

          // Adiciona à lista
          setCasts(prev => [newCast, ...prev].slice(0, maxItems));

          // Busca nome do personagem se não tiver
          if (!characterNames[newCast.character_id]) {
            const { data: charData } = await supabase
              .from('characters')
              .select('name')
              .eq('id', newCast.character_id)
              .single();

            if (charData) {
              setCharacterNames(prev => ({
                ...prev,
                [newCast.character_id]: charData.name,
              }));
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[RitualFeed] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('[RitualFeed] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [campaignId, maxItems, characterNames]);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header com status de conexão */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="w-4 h-4 text-paranormal" />
          <span>Conjurações</span>
          {casts.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {casts.length}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          {isConnected ? (
            <>
              <Wifi className="w-3 h-3 text-success" />
              <span>Ao vivo</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-destructive" />
              <span>Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Lista de conjurações */}
      {casts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma conjuração ainda</p>
          <p className="text-xs">Rituais conjurados aparecerão aqui em tempo real</p>
        </div>
      ) : (
        <ScrollArea className={compact ? "max-h-[200px]" : "max-h-[400px]"}>
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {casts.map((cast) => (
                <CastFeedItem 
                  key={cast.id} 
                  cast={cast} 
                  characterName={characterNames[cast.character_id]}
                  compact={compact}
                  isNew={newCastIds.has(cast.id)}
                />
              ))}
            </div>
          </AnimatePresence>
        </ScrollArea>
      )}
    </div>
  );
}
