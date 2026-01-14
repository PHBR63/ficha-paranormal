/**
 * Galeria de Templates
 * Exibe lista de templates com filtros e tabs
 * 
 * @module components/templates/TemplateGallery
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Package, Crown, User, Search, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';
import { TemplateCard } from './TemplateCard';
import { TemplateFilters } from './TemplateFilters';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import {
  usePublicTemplates,
  useOfficialTemplates,
  useMyTemplates,
  useTemplateFilters,
  useApplyTemplate,
} from '@/hooks/useTemplates';
import { useAuth } from '@/contexts/AuthContext';
import type { CharacterTemplate, TemplateWithAuthor } from '@/types/templates';

interface TemplateGalleryProps {
  /** Callback quando um template é aplicado */
  onApply: (template: CharacterTemplate | TemplateWithAuthor) => void;
  /** Se a galeria deve fechar após aplicar */
  closeOnApply?: boolean;
  /** Callback para fechar a galeria */
  onClose?: () => void;
  /** Classes adicionais */
  className?: string;
}

type TabValue = 'official' | 'community' | 'my';

export function TemplateGallery({
  onApply,
  closeOnApply = true,
  onClose,
  className,
}: TemplateGalleryProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabValue>('official');
  const [selectedTemplate, setSelectedTemplate] = useState<CharacterTemplate | TemplateWithAuthor | null>(null);
  const { apply, isApplying } = useApplyTemplate();

  // Filtros para templates da comunidade
  const {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    page,
    setPage,
  } = useTemplateFilters();

  // Queries
  const officialQuery = useOfficialTemplates();
  const communityQuery = usePublicTemplates(filters, page);
  const myTemplatesQuery = useMyTemplates();

  // Handler para ver detalhes
  const handleView = useCallback((template: CharacterTemplate | TemplateWithAuthor) => {
    setSelectedTemplate(template);
  }, []);

  // Handler para aplicar template
  const handleApply = useCallback(async (template: CharacterTemplate | TemplateWithAuthor) => {
    const data = await apply(template);
    if (data) {
      onApply(template);
      if (closeOnApply && onClose) {
        onClose();
      }
    }
  }, [apply, onApply, closeOnApply, onClose]);

  // Handler para aplicar do modal
  const handleApplyFromModal = useCallback(() => {
    if (selectedTemplate) {
      handleApply(selectedTemplate);
      setSelectedTemplate(null);
    }
  }, [selectedTemplate, handleApply]);

  // Renderiza grid de templates
  const renderTemplateGrid = (
    templates: (CharacterTemplate | TemplateWithAuthor)[],
    isLoading: boolean,
    error: Error | null
  ) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-destructive mb-2">Erro ao carregar templates</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      );
    }

    if (templates.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Nenhum template encontrado</p>
          {hasActiveFilters && (
            <Button
              variant="link"
              onClick={clearFilters}
              className="mt-2"
            >
              Limpar filtros
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {templates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onView={handleView}
              onApply={handleApply}
              isApplying={isApplying}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Tabs 
        value={activeTab} 
        onValueChange={(v) => setActiveTab(v as TabValue)}
        className="flex flex-col h-full"
      >
        {/* Tabs Header */}
        <TabsList className="w-full justify-start mb-4 shrink-0">
          <TabsTrigger value="official" className="gap-2">
            <Crown className="w-4 h-4" />
            Oficiais
            {officialQuery.data && (
              <span className="text-xs opacity-70">({officialQuery.data.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="community" className="gap-2">
            <Search className="w-4 h-4" />
            Comunidade
          </TabsTrigger>
          {user && (
            <TabsTrigger value="my" className="gap-2">
              <User className="w-4 h-4" />
              Meus Templates
              {myTemplatesQuery.data && (
                <span className="text-xs opacity-70">({myTemplatesQuery.data.length})</span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab: Oficiais */}
        <TabsContent value="official" className="flex-1 mt-0 min-h-0 overflow-y-auto px-1">
          <div className="pr-3 pb-8">
            {renderTemplateGrid(
              officialQuery.data || [],
              officialQuery.isLoading,
              officialQuery.error as Error | null
            )}
          </div>
        </TabsContent>

        {/* Tab: Comunidade */}
        <TabsContent value="community" className="flex-1 mt-0 flex flex-col min-h-0 overflow-hidden">
          {/* Filtros */}
          <TemplateFilters
            filters={filters}
            onFilterChange={updateFilter}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            className="mb-4 shrink-0 px-1"
          />

          {/* Lista */}
          <div className="flex-1 min-h-0 overflow-y-auto px-1">
            <div className="pr-3 pb-8">
              {renderTemplateGrid(
                communityQuery.data?.templates || [],
                communityQuery.isLoading,
                communityQuery.error as Error | null
              )}

              {/* Paginação */}
              {communityQuery.data && communityQuery.data.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <span className="flex items-center px-3 text-sm text-muted-foreground">
                    Página {page} de {communityQuery.data.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= communityQuery.data.totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab: Meus Templates */}
        {user && (
          <TabsContent value="my" className="flex-1 mt-0 min-h-0 overflow-y-auto px-1">
            <div className="pr-3 pb-8">
              {/* Botão de refresh */}
              <div className="flex justify-end mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => myTemplatesQuery.refetch()}
                  disabled={myTemplatesQuery.isFetching}
                >
                  <RefreshCw className={cn(
                    'w-4 h-4 mr-1',
                    myTemplatesQuery.isFetching && 'animate-spin'
                  )} />
                  Atualizar
                </Button>
              </div>

              {renderTemplateGrid(
                myTemplatesQuery.data || [],
                myTemplatesQuery.isLoading,
                myTemplatesQuery.error as Error | null
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Modal de Preview */}
      <TemplatePreviewModal
        template={selectedTemplate}
        isOpen={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        onApply={handleApplyFromModal}
        isApplying={isApplying}
      />
    </div>
  );
}
