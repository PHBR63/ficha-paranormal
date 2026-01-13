/**
 * Serviço de Templates de Personagem
 * Gerencia CRUD, aplicação e avaliação de templates
 * 
 * @module services/templateService
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  CharacterTemplate,
  TemplateRating,
  TemplateFilters,
  CreateTemplateDto,
  UpdateTemplateDto,
  RateTemplateDto,
  TemplateWithAuthor,
  PaginatedTemplates,
  CharacterTemplateData,
} from '@/types/templates';

// ========================================
// Tipos auxiliares para queries
// ========================================

type TemplateRow = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  author_id: string;
  is_public: boolean;
  is_official: boolean;
  tags: string[] | null;
  difficulty_level: string | null;
  usage_count: number;
  rating: number | null;
  rating_count: number;
  template_data: unknown;
  min_nex: number;
  max_nex: number;
  deleted_at: string | null;
};

// ========================================
// Funções auxiliares
// ========================================

/**
 * Converte row do banco para tipo tipado
 */
function rowToTemplate(row: TemplateRow): CharacterTemplate {
  return {
    ...row,
    tags: row.tags || [],
    difficulty_level: row.difficulty_level as CharacterTemplate['difficulty_level'],
    template_data: row.template_data as CharacterTemplateData,
  };
}

/**
 * Aplica filtros à query de templates
 */
function applyFilters(
  query: ReturnType<typeof supabase.from>,
  filters: TemplateFilters
) {
  let q = query;

  // Filtro por classe
  if (filters.classId) {
    q = q.eq('template_data->classId', filters.classId);
  }

  // Filtro por trilha
  if (filters.trackId) {
    q = q.eq('template_data->classTrack', filters.trackId);
  }

  // Filtro por origem
  if (filters.originId) {
    q = q.eq('template_data->origin', filters.originId);
  }

  // Filtro por dificuldade
  if (filters.difficulty) {
    q = q.eq('difficulty_level', filters.difficulty);
  }

  // Filtro por tags (contém todas as tags especificadas)
  if (filters.tags && filters.tags.length > 0) {
    q = q.contains('tags', filters.tags);
  }

  // Filtro por autor
  if (filters.authorId) {
    q = q.eq('author_id', filters.authorId);
  }

  // Filtro por oficial
  if (filters.isOfficial !== undefined) {
    q = q.eq('is_official', filters.isOfficial);
  }

  // Filtro por busca textual
  if (filters.search) {
    q = q.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  // Filtro por NEX mínimo
  if (filters.minNex !== undefined) {
    q = q.gte('min_nex', filters.minNex);
  }

  // Filtro por NEX máximo
  if (filters.maxNex !== undefined) {
    q = q.lte('max_nex', filters.maxNex);
  }

  return q;
}

// ========================================
// Serviço Principal
// ========================================

export const templateService = {
  // ========================================
  // CRUD - Leitura
  // ========================================

  /**
   * Busca templates públicos com filtros e paginação
   */
  async getPublicTemplates(
    filters: TemplateFilters = {},
    page = 1,
    pageSize = 20
  ): Promise<PaginatedTemplates> {
    const offset = (page - 1) * pageSize;

    // Query base para templates públicos
    let query = supabase
      .from('character_templates')
      .select('*', { count: 'exact' })
      .eq('is_public', true)
      .is('deleted_at', null);

    // Aplicar filtros
    query = applyFilters(query, filters);

    // Ordenação
    const sortBy = filters.sortBy || 'rating';
    const sortOrder = filters.sortOrder || 'desc';
    
    if (sortBy === 'rating') {
      query = query.order('rating', { ascending: sortOrder === 'asc', nullsFirst: false });
    } else {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    // Paginação
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[templateService] Erro ao buscar templates:', error);
      throw new Error(`Erro ao buscar templates: ${error.message}`);
    }

    const templates: TemplateWithAuthor[] = (data || []).map((row: any) => ({
      ...rowToTemplate(row),
    }));

    return {
      templates,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  },

  /**
   * Busca templates do usuário atual
   */
  async getMyTemplates(userId: string): Promise<CharacterTemplate[]> {
    const { data, error } = await supabase
      .from('character_templates')
      .select('*')
      .eq('author_id', userId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[templateService] Erro ao buscar meus templates:', error);
      throw new Error(`Erro ao buscar templates: ${error.message}`);
    }

    return (data || []).map(rowToTemplate);
  },

  /**
   * Busca um template por ID
   */
  async getTemplateById(id: string): Promise<TemplateWithAuthor | null> {
    const { data, error } = await supabase
      .from('character_templates')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Template não encontrado
      }
      console.error('[templateService] Erro ao buscar template:', error);
      throw new Error(`Erro ao buscar template: ${error.message}`);
    }

    return rowToTemplate(data);
  },

  /**
   * Busca templates oficiais
   */
  async getOfficialTemplates(): Promise<CharacterTemplate[]> {
    const { data, error } = await supabase
      .from('character_templates')
      .select('*')
      .eq('is_official', true)
      .eq('is_public', true)
      .is('deleted_at', null)
      .order('usage_count', { ascending: false });

    if (error) {
      console.error('[templateService] Erro ao buscar templates oficiais:', error);
      throw new Error(`Erro ao buscar templates oficiais: ${error.message}`);
    }

    return (data || []).map(rowToTemplate);
  },

  // ========================================
  // CRUD - Escrita
  // ========================================

  /**
   * Cria um novo template
   */
  async createTemplate(dto: CreateTemplateDto, authorId: string): Promise<CharacterTemplate> {
    const insertData = {
      name: dto.name,
      description: dto.description || null,
      author_id: authorId,
      is_public: dto.is_public,
      is_official: false,
      tags: dto.tags,
      difficulty_level: dto.difficulty_level || null,
      template_data: dto.template_data as unknown,
      min_nex: dto.min_nex || 5,
      max_nex: dto.max_nex || 99,
    };
    
    const { data, error } = await supabase
      .from('character_templates')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[templateService] Erro ao criar template:', error);
      throw new Error(`Erro ao criar template: ${error.message}`);
    }

    return rowToTemplate(data);
  },

  /**
   * Atualiza um template existente
   */
  async updateTemplate(id: string, dto: UpdateTemplateDto): Promise<CharacterTemplate> {
    const updateData: Record<string, unknown> = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.is_public !== undefined) updateData.is_public = dto.is_public;
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    if (dto.difficulty_level !== undefined) updateData.difficulty_level = dto.difficulty_level;
    if (dto.template_data !== undefined) updateData.template_data = dto.template_data;
    if (dto.min_nex !== undefined) updateData.min_nex = dto.min_nex;
    if (dto.max_nex !== undefined) updateData.max_nex = dto.max_nex;

    const { data, error } = await supabase
      .from('character_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[templateService] Erro ao atualizar template:', error);
      throw new Error(`Erro ao atualizar template: ${error.message}`);
    }

    return rowToTemplate(data);
  },

  /**
   * Deleta um template (soft delete)
   */
  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('character_templates')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[templateService] Erro ao deletar template:', error);
      throw new Error(`Erro ao deletar template: ${error.message}`);
    }
  },

  // ========================================
  // Aplicação de Templates
  // ========================================

  /**
   * Registra a aplicação de um template
   */
  async recordApplication(
    templateId: string,
    userId: string,
    characterId?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('template_applications')
      .insert({
        template_id: templateId,
        user_id: userId,
        character_id: characterId || null,
      });

    if (error) {
      console.error('[templateService] Erro ao registrar aplicação:', error);
      // Não lançamos erro aqui pois é apenas analytics
    }
  },

  // ========================================
  // Sistema de Avaliação
  // ========================================

  /**
   * Avalia um template
   */
  async rateTemplate(
    templateId: string,
    userId: string,
    dto: RateTemplateDto
  ): Promise<TemplateRating> {
    // Upsert para permitir atualização de avaliação existente
    const { data, error } = await supabase
      .from('template_ratings')
      .upsert({
        template_id: templateId,
        user_id: userId,
        rating: dto.rating,
        comment: dto.comment || null,
      }, {
        onConflict: 'template_id,user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('[templateService] Erro ao avaliar template:', error);
      throw new Error(`Erro ao avaliar template: ${error.message}`);
    }

    return data as TemplateRating;
  },

  /**
   * Busca avaliação do usuário para um template
   */
  async getUserRating(templateId: string, userId: string): Promise<TemplateRating | null> {
    const { data, error } = await supabase
      .from('template_ratings')
      .select('*')
      .eq('template_id', templateId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[templateService] Erro ao buscar avaliação:', error);
      return null;
    }

    return data as TemplateRating | null;
  },

  /**
   * Busca avaliações de um template
   */
  async getTemplateRatings(templateId: string): Promise<TemplateRating[]> {
    const { data, error } = await supabase
      .from('template_ratings')
      .select('*')
      .eq('template_id', templateId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[templateService] Erro ao buscar avaliações:', error);
      throw new Error(`Erro ao buscar avaliações: ${error.message}`);
    }

    return (data || []) as TemplateRating[];
  },

  /**
   * Remove avaliação do usuário
   */
  async deleteRating(templateId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('template_ratings')
      .delete()
      .eq('template_id', templateId)
      .eq('user_id', userId);

    if (error) {
      console.error('[templateService] Erro ao remover avaliação:', error);
      throw new Error(`Erro ao remover avaliação: ${error.message}`);
    }
  },
};
