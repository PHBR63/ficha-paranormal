/**
 * ResourcesTab - Aba de recursos da campanha v3
 * 
 * Agrupa recursos diversos:
 * - Notas da campanha
 * - Handouts
 * - Diário/Timeline
 * 
 * Sub-navegação interna com tabs
 * 
 * @module components/campaign/v3/tabs/ResourcesTab
 */

import { memo, useState } from 'react';
import { 
  FileText, 
  Image, 
  Clock, 
  Plus,
  Search
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ResourceSubTab = 'notes' | 'handouts' | 'timeline';

interface ResourcesTabProps {
  /** ID da campanha */
  campaignId: string;
  /** Se é mestre */
  isMaster: boolean;
  /** Callback para criar nota */
  onCreateNote?: () => void;
  /** Callback para criar handout */
  onCreateHandout?: () => void;
  /** Classe CSS adicional */
  className?: string;
}

export const ResourcesTab = memo(function ResourcesTab({
  campaignId,
  isMaster,
  onCreateNote,
  onCreateHandout,
  className,
}: ResourcesTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<ResourceSubTab>('notes');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Sub-navegação */}
      <Tabs 
        value={activeSubTab} 
        onValueChange={(v) => setActiveSubTab(v as ResourceSubTab)}
        className="flex flex-col h-full"
      >
        <div className="shrink-0 px-4 pt-3 pb-2 border-b border-border/30 flex items-center justify-between gap-4">
          <TabsList className="bg-transparent h-9">
            <TabsTrigger value="notes" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" />
              Notas
            </TabsTrigger>
            <TabsTrigger value="handouts" className="gap-1.5 text-xs">
              <Image className="h-3.5 w-3.5" />
              Handouts
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1.5 text-xs">
              <Clock className="h-3.5 w-3.5" />
              Timeline
            </TabsTrigger>
          </TabsList>

          {/* Busca */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>

          {/* Botão criar (mestre) */}
          {isMaster && (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={activeSubTab === 'notes' ? onCreateNote : onCreateHandout}
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Criar</span>
            </Button>
          )}
        </div>

        {/* Conteúdo das sub-abas */}
        <TabsContent value="notes" className="flex-1 m-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {/* Placeholder - notas serão carregadas via hook */}
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-medium">
                        Notas da sessão
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Anotações importantes sobre a campanha...
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      Sessão 15
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Sistema de notas em desenvolvimento</p>
                <p className="text-xs mt-1">Em breve você poderá criar e organizar notas da campanha</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="handouts" className="flex-1 m-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="text-center py-8 text-muted-foreground">
                <Image className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Sistema de handouts em desenvolvimento</p>
                <p className="text-xs mt-1">Em breve você poderá compartilhar imagens e documentos</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="timeline" className="flex-1 m-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Timeline em desenvolvimento</p>
                <p className="text-xs mt-1">Em breve você poderá visualizar a cronologia da campanha</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
});

export default ResourcesTab;
