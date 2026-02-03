/**
 * useAdminFilters - Hook para filtros, busca e paginação em páginas administrativas
 * Gerencia estado de busca, filtros e paginação de forma reutilizável
 */
import { useState, useMemo, useCallback } from 'react';

export interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface SortState<T extends string = string> {
  field: T;
  order: 'asc' | 'desc';
}

export interface UseAdminFiltersOptions<T, F extends Record<string, unknown> = Record<string, unknown>> {
  /** Dados originais para filtrar */
  data: T[];
  /** Número de itens por página */
  pageSize?: number;
  /** Função de busca textual - retorna true se o item corresponde à busca */
  searchFn?: (item: T, searchTerm: string) => boolean;
  /** Função de filtro adicional - retorna true se o item passa pelos filtros */
  filterFn?: (item: T, filters: F) => boolean;
  /** Campo inicial para ordenação */
  initialSortField?: string;
  /** Ordem inicial */
  initialSortOrder?: 'asc' | 'desc';
  /** Função de ordenação customizada */
  sortFn?: (a: T, b: T, sort: SortState) => number;
}

export interface UseAdminFiltersReturn<T, F extends Record<string, unknown>> {
  // Dados filtrados e paginados
  filteredData: T[];
  paginatedData: T[];
  
  // Busca
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  // Filtros
  filters: F;
  setFilters: React.Dispatch<React.SetStateAction<F>>;
  setFilter: <K extends keyof F>(key: K, value: F[K]) => void;
  clearFilters: () => void;
  
  // Paginação
  pagination: PaginationState;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  
  // Ordenação
  sort: SortState;
  setSort: (field: string, order?: 'asc' | 'desc') => void;
  toggleSortOrder: () => void;
  
  // Estado geral
  hasActiveFilters: boolean;
  resetAll: () => void;
}

/**
 * Hook para gerenciar filtros, busca e paginação em listas administrativas
 */
export function useAdminFilters<T, F extends Record<string, unknown> = Record<string, unknown>>({
  data,
  pageSize = 20,
  searchFn,
  filterFn,
  initialSortField = '',
  initialSortOrder = 'desc',
  sortFn
}: UseAdminFiltersOptions<T, F>): UseAdminFiltersReturn<T, F> {
  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<F>({} as F);
  const [page, setPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [sort, setSortState] = useState<SortState>({
    field: initialSortField,
    order: initialSortOrder
  });

  // Dados filtrados (busca + filtros)
  const filteredData = useMemo(() => {
    let result = [...data];

    // Aplicar busca textual
    if (searchTerm && searchFn) {
      const lowerSearch = searchTerm.toLowerCase().trim();
      result = result.filter(item => searchFn(item, lowerSearch));
    }

    // Aplicar filtros adicionais
    if (filterFn && Object.keys(filters).length > 0) {
      result = result.filter(item => filterFn(item, filters));
    }

    // Aplicar ordenação
    if (sort.field && sortFn) {
      result.sort((a, b) => sortFn(a, b, sort));
    }

    return result;
  }, [data, searchTerm, searchFn, filters, filterFn, sort, sortFn]);

  // Paginação
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / currentPageSize));
  
  // Garantir que a página atual é válida
  const safePage = Math.min(Math.max(1, page), totalPages);
  
  // Dados paginados
  const paginatedData = useMemo(() => {
    const startIndex = (safePage - 1) * currentPageSize;
    return filteredData.slice(startIndex, startIndex + currentPageSize);
  }, [filteredData, safePage, currentPageSize]);

  // Resetar página quando filtros mudam
  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
    setPage(1);
  }, []);

  // Funções de filtro
  const setFilter = useCallback(<K extends keyof F>(key: K, value: F[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({} as F);
    setSearchTerm('');
    setPage(1);
  }, []);

  // Funções de paginação
  const goToPage = useCallback((newPage: number) => {
    setPage(Math.min(Math.max(1, newPage), totalPages));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage(prev => Math.max(prev - 1, 1));
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setCurrentPageSize(size);
    setPage(1);
  }, []);

  // Funções de ordenação
  const setSort = useCallback((field: string, order?: 'asc' | 'desc') => {
    setSortState(prev => ({
      field,
      order: order || (prev.field === field && prev.order === 'asc' ? 'desc' : 'asc')
    }));
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSortState(prev => ({
      ...prev,
      order: prev.order === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Reset total
  const resetAll = useCallback(() => {
    setSearchTerm('');
    setFilters({} as F);
    setPage(1);
    setSortState({ field: initialSortField, order: initialSortOrder });
  }, [initialSortField, initialSortOrder]);

  // Verificar se há filtros ativos
  const hasActiveFilters = searchTerm.length > 0 || Object.keys(filters).some(k => {
    const val = filters[k as keyof F];
    return val !== undefined && val !== null && val !== '' && val !== 'all';
  });

  return {
    filteredData,
    paginatedData,
    
    searchTerm,
    setSearchTerm: handleSearchChange,
    
    filters,
    setFilters,
    setFilter,
    clearFilters,
    
    pagination: {
      page: safePage,
      pageSize: currentPageSize,
      totalItems,
      totalPages
    },
    goToPage,
    nextPage,
    prevPage,
    setPageSize: handlePageSizeChange,
    
    sort,
    setSort,
    toggleSortOrder,
    
    hasActiveFilters,
    resetAll
  };
}

export default useAdminFilters;
