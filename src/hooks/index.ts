/**
 * Barrel Exports - Todos os Hooks
 * 
 * Este módulo exporta todos os hooks organizados por domínio.
 * Cada subpasta contém hooks relacionados a uma área específica do sistema.
 * 
 * Organização:
 * - sue/: Sistema Unificado de Efeitos
 * - combat/: Gerenciamento de combate
 * - character/: Dados e validação de personagem
 * - inventory/: Equipamentos e itens
 * - validation/: Validação de regras
 * - campaign/: Sincronização de campanhas
 * - ui/: Interface do usuário
 * - platform/: PWA e funcionalidades de plataforma
 * 
 * @module hooks
 */

// Re-exporta de cada subpasta para acesso centralizado
export * from './sue';
export * from './combat';
export * from './character';
export * from './inventory';
export * from './validation';
export * from './campaign';
export * from './ui';
export * from './platform';

// Hooks que não se encaixam em categorias específicas
export * from './useAdminCheck';
