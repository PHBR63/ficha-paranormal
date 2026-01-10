/**
 * Visualizador de Handouts para Jogadores
 * Exibe documentos, pistas e imagens revelados pelo mestre
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Image,
  Search,
  User,
  Clock,
  Sparkles,
  X,
  ZoomIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useHandouts, Handout } from '@/hooks/campaign/useHandouts';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface PlayerHandoutsViewerProps {
  campaignId: string;
}

const handoutTypeIcons = {
  document: FileText,
  image: Image,
  clue: Search,
  npc: User,
};

const handoutTypeLabels = {
  document: 'Documento',
  image: 'Imagem',
  clue: 'Pista',
  npc: 'NPC',
};

export function PlayerHandoutsViewer({ campaignId }: PlayerHandoutsViewerProps) {
  const { user } = useAuth();
  const { handouts, isLoading } = useHandouts(campaignId, false, user?.id);
  const [selectedHandout, setSelectedHandout] = useState<Handout | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Carregando documentos...</div>
      </div>
    );
  }

  if (handouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
        <FileText className="w-12 h-12 mb-4 opacity-50" />
        <p className="font-medium">Nenhum documento disponível</p>
        <p className="text-sm">O mestre ainda não revelou nenhum handout</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {handouts.map((handout, index) => {
          const Icon = handoutTypeIcons[handout.handout_type];
          
          return (
            <motion.div
              key={handout.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedHandout(handout)}
              className={cn(
                "group cursor-pointer rounded-lg border bg-card/50 p-4",
                "hover:bg-card hover:border-primary/50 transition-all",
                "relative overflow-hidden"
              )}
            >
              {/* Efeito de brilho para itens recém revelados */}
              {handout.revealed_at && 
                new Date(handout.revealed_at).getTime() > Date.now() - 60000 && (
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 3 }}
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent pointer-events-none"
                />
              )}

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{handout.title}</h4>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {handoutTypeLabels[handout.handout_type]}
                    </Badge>
                  </div>
                  
                  {handout.content && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {handout.content}
                    </p>
                  )}
                  
                  {handout.image_url && (
                    <div className="mt-2 relative rounded overflow-hidden aspect-video bg-muted">
                      <img 
                        src={handout.image_url} 
                        alt={handout.title}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )}
                  
                  {handout.revealed_at && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>
                        Revelado em {new Date(handout.revealed_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Dialog de visualização detalhada */}
      <Dialog open={!!selectedHandout} onOpenChange={() => setSelectedHandout(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          {selectedHandout && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {React.createElement(handoutTypeIcons[selectedHandout.handout_type], {
                    className: "w-5 h-5 text-primary"
                  })}
                  {selectedHandout.title}
                </DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="flex-1 pr-4">
                {selectedHandout.image_url && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img 
                      src={selectedHandout.image_url} 
                      alt={selectedHandout.title}
                      className="w-full object-contain max-h-[300px]"
                    />
                  </div>
                )}
                
                {selectedHandout.content && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {/* Renderização simples de markdown */}
                    {selectedHandout.content.split('\n').map((line, i) => {
                      if (line.startsWith('# ')) {
                        return <h1 key={i} className="text-xl font-bold mt-4 mb-2">{line.slice(2)}</h1>;
                      }
                      if (line.startsWith('## ')) {
                        return <h2 key={i} className="text-lg font-bold mt-3 mb-1">{line.slice(3)}</h2>;
                      }
                      if (line.startsWith('### ')) {
                        return <h3 key={i} className="text-base font-bold mt-2 mb-1">{line.slice(4)}</h3>;
                      }
                      if (line.startsWith('- ')) {
                        return <li key={i} className="ml-4">{line.slice(2)}</li>;
                      }
                      if (line.trim() === '') {
                        return <br key={i} />;
                      }
                      return <p key={i} className="my-1">{line}</p>;
                    })}
                  </div>
                )}
              </ScrollArea>
              
              {selectedHandout.revealed_at && (
                <div className="flex items-center gap-2 pt-4 border-t text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>
                    Revelado pelo mestre em {new Date(selectedHandout.revealed_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PlayerHandoutsViewer;
