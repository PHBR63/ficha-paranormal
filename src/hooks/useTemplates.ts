/**
 * Hooks para Sistema de Templates de Personagem
 * 
 * @module hooks/useTemplates
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templateService } from '@/services/templateService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type {
  CharacterTemplate,
  TemplateFilters,
  CreateTemplateDto,
  UpdateTemplateDto,
  RateTemplateDto,
  TemplateWithAuthor,
  PaginatedTemplates,
} from '@/types/templates';

// ========================================
// Query Keys
// ========================================

export const templateQueryKeys = {
  all: ['templates'] as const,
  public: (filters: TemplateFilters, page: number) => 
    [...templateQueryKeys.all, 'public', filters, page] as const,
  official: () => [...templateQueryKeys.all, 'official'] as const,
  my: (userId: string) => [...templateQueryKeys.all, 'my', userId] as const,
  detail: (id: string) => [...templateQueryKeys.all, 'detail', id] as const,
  ratings: (templateId: string) => [...templateQueryKeys.all, 'ratings', templateId] as const,
  userRating: (templateId: string, userId: string) => 
    [...templateQueryKeys.all, 'userRating', templateId, userId] as const,
};

// ========================================
// Hook: usePublicTemplates
// Lista templates públicos com filtros
// ========================================

export function usePublicTemplates(filters: TemplateFilters = {}, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: templateQueryKeys.public(filters, page),
    queryFn: () => templateService.getPublicTemplates(filters, page, pageSize),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ========================================
// Hook: useOfficialTemplates
// Lista templates oficiais
// ========================================

export function useOfficialTemplates() {
  return useQuery({
    queryKey: templateQueryKeys.official(),
    queryFn: () => templateService.getOfficialTemplates(),
    staleTime: 10 * 60 * 1000, // 10 minutos - raramente mudam
  });
}

// ========================================
// Hook: useMyTemplates
// Lista templates do usuário atual
// ========================================

export function useMyTemplates() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: templateQueryKeys.my(user?.id || ''),
    queryFn: () => templateService.getMyTemplates(user!.id),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// ========================================
// Hook: useTemplate
// Busca um template específico
// ========================================

export function useTemplate(templateId: string | null) {
  return useQuery({
    queryKey: templateQueryKeys.detail(templateId || ''),
    queryFn: () => templateService.getTemplateById(templateId!),
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000,
  });
}

// ========================================
// Hook: useCreateTemplate
// Cria um novo template
// ========================================

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (dto: CreateTemplateDto) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      return templateService.createTemplate(dto, user.id);
    },
    onSuccess: (template) => {
      // Invalida queries de templates do usuário
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.my(user?.id || '') });
      
      toast({
        title: 'Template criado',
        description: `"${template.name}" foi salvo com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ========================================
// Hook: useUpdateTemplate
// Atualiza um template existente
// ========================================

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTemplateDto }) => 
      templateService.updateTemplate(id, dto),
    onSuccess: (template) => {
      // Invalida queries relacionadas
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.detail(template.id) });
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.my(user?.id || '') });
      
      toast({
        title: 'Template atualizado',
        description: `"${template.name}" foi atualizado.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ========================================
// Hook: useDeleteTemplate
// Deleta um template
// ========================================

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => templateService.deleteTemplate(id),
    onSuccess: () => {
      // Invalida queries de templates do usuário
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.my(user?.id || '') });
      
      toast({
        title: 'Template removido',
        description: 'O template foi removido com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ========================================
// Hook: useApplyTemplate
// Aplica um template à criação de personagem
// ========================================

export function useApplyTemplate() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isApplying, setIsApplying] = useState(false);

  const apply = useCallback(async (
    template: CharacterTemplate | TemplateWithAuthor,
    characterId?: string
  ) => {
    if (!user?.id) {
      toast({
        title: 'Não autenticado',
        description: 'Faça login para usar templates.',
        variant: 'destructive',
      });
      return null;
    }

    setIsApplying(true);

    try {
      // Registra aplicação para analytics
      await templateService.recordApplication(template.id, user.id, characterId);

      toast({
        title: 'Template aplicado',
        description: `"${template.name}" foi aplicado. Revise e ajuste conforme necessário.`,
      });

      return template.template_data;
    } catch (error) {
      console.error('[useApplyTemplate] Erro:', error);
      // Não mostramos erro ao usuário pois o registro de analytics não é crítico
      return template.template_data;
    } finally {
      setIsApplying(false);
    }
  }, [user?.id, toast]);

  return { apply, isApplying };
}

// ========================================
// Hook: useRateTemplate
// Avalia um template
// ========================================

export function useRateTemplate(templateId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  // Busca avaliação existente do usuário
  const { data: userRating, isLoading: isLoadingRating } = useQuery({
    queryKey: templateQueryKeys.userRating(templateId, user?.id || ''),
    queryFn: () => templateService.getUserRating(templateId, user!.id),
    enabled: !!user?.id && !!templateId,
  });

  // Mutation para avaliar
  const rateMutation = useMutation({
    mutationFn: (dto: RateTemplateDto) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      return templateService.rateTemplate(templateId, user.id, dto);
    },
    onSuccess: () => {
      // Invalida queries relacionadas
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.detail(templateId) });
      queryClient.invalidateQueries({ 
        queryKey: templateQueryKeys.userRating(templateId, user?.id || '') 
      });
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.ratings(templateId) });
      
      toast({
        title: 'Avaliação registrada',
        description: 'Obrigado pelo feedback!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao avaliar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para remover avaliação
  const deleteRatingMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      return templateService.deleteRating(templateId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.detail(templateId) });
      queryClient.invalidateQueries({ 
        queryKey: templateQueryKeys.userRating(templateId, user?.id || '') 
      });
      queryClient.invalidateQueries({ queryKey: templateQueryKeys.ratings(templateId) });
      
      toast({
        title: 'Avaliação removida',
      });
    },
  });

  return {
    userRating,
    isLoadingRating,
    rate: rateMutation.mutate,
    isRating: rateMutation.isPending,
    deleteRating: deleteRatingMutation.mutate,
    isDeletingRating: deleteRatingMutation.isPending,
  };
}

// ========================================
// Hook: useTemplateFilters
// Gerencia estado de filtros
// ========================================

export function useTemplateFilters(initialFilters: TemplateFilters = {}) {
  const [filters, setFilters] = useState<TemplateFilters>(initialFilters);
  const [page, setPage] = useState(1);

  const updateFilter = useCallback(<K extends keyof TemplateFilters>(
    key: K,
    value: TemplateFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset página ao mudar filtros
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const hasActiveFilters = Object.values(filters).some(v => 
    v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 : true)
  );

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    page,
    setPage,
  };
}
