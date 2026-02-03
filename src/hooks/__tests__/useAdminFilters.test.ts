/**
 * Testes Unitários - useAdminFilters
 * 
 * Valida filtros, busca, paginação e ordenação do hook administrativo
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdminFilters } from '../useAdminFilters';

// Dados de teste
interface TestItem {
  id: number;
  name: string;
  category: string;
  value: number;
}

const mockData: TestItem[] = [
  { id: 1, name: 'Alpha', category: 'A', value: 100 },
  { id: 2, name: 'Beta', category: 'B', value: 200 },
  { id: 3, name: 'Gamma', category: 'A', value: 150 },
  { id: 4, name: 'Delta', category: 'C', value: 300 },
  { id: 5, name: 'Epsilon', category: 'B', value: 250 },
  { id: 6, name: 'Zeta', category: 'A', value: 175 },
  { id: 7, name: 'Eta', category: 'C', value: 125 },
  { id: 8, name: 'Theta', category: 'B', value: 225 },
];

// Funções auxiliares de teste
const searchFn = (item: TestItem, term: string) =>
  item.name.toLowerCase().includes(term);

const filterFn = (item: TestItem, filters: { category?: string }) =>
  !filters.category || filters.category === 'all' || item.category === filters.category;

const sortFn = (a: TestItem, b: TestItem, sort: { field: string; order: 'asc' | 'desc' }) => {
  const modifier = sort.order === 'asc' ? 1 : -1;
  if (sort.field === 'value') {
    return (a.value - b.value) * modifier;
  }
  return a.name.localeCompare(b.name) * modifier;
};

describe('useAdminFilters', () => {
  describe('Inicialização', () => {
    it('deve inicializar com dados completos', () => {
      const { result } = renderHook(() =>
        useAdminFilters<TestItem>({ data: mockData })
      );

      expect(result.current.filteredData).toHaveLength(8);
      expect(result.current.searchTerm).toBe('');
      expect(result.current.hasActiveFilters).toBe(false);
    });

    it('deve inicializar com pageSize padrão de 20', () => {
      const { result } = renderHook(() =>
        useAdminFilters<TestItem>({ data: mockData })
      );

      expect(result.current.pagination.pageSize).toBe(20);
    });

    it('deve aceitar pageSize customizado', () => {
      const { result } = renderHook(() =>
        useAdminFilters<TestItem>({ data: mockData, pageSize: 5 })
      );

      expect(result.current.pagination.pageSize).toBe(5);
      expect(result.current.paginatedData).toHaveLength(5);
    });
  });

  describe('Busca Textual', () => {
    it('deve filtrar por termo de busca', () => {
      const { result } = renderHook(() =>
        useAdminFilters<TestItem>({ data: mockData, searchFn })
      );

      act(() => {
        result.current.setSearchTerm('alpha');
      });

      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].name).toBe('Alpha');
    });

    it('deve resetar página ao buscar', () => {
      const { result } = renderHook(() =>
        useAdminFilters<TestItem>({ data: mockData, pageSize: 2, searchFn })
      );

      // Ir para página 2
      act(() => {
        result.current.goToPage(2);
      });
      expect(result.current.pagination.page).toBe(2);

      // Buscar - deve voltar para página 1
      act(() => {
        result.current.setSearchTerm('eta');
      });
      expect(result.current.pagination.page).toBe(1);
    });

    it('deve indicar filtro ativo com termo de busca', () => {
      const { result } = renderHook(() =>
        useAdminFilters<TestItem>({ data: mockData, searchFn })
      );

      expect(result.current.hasActiveFilters).toBe(false);

      act(() => {
        result.current.setSearchTerm('test');
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('deve ser case-insensitive na busca', () => {
      const { result } = renderHook(() =>
        useAdminFilters<TestItem>({ data: mockData, searchFn })
      );

      act(() => {
        result.current.setSearchTerm('BETA');
      });

      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].name).toBe('Beta');
    });
  });

  describe('Filtros', () => {
    it('deve aplicar filtro por categoria', () => {
      const { result } = renderHook(() =>
        useAdminFilters<TestItem, { category?: string }>({
          data: mockData,
          filterFn
        })
      );

      act(() => {
        result.current.setFilter('category', 'A');
      });

      expect(result.current.filteredData).toHaveLength(3);
      expect(result.current.filteredData.every(i => i.category === 'A')).toBe(true);
    });

    it('deve combinar busca e filtro', () => {
      const { result } = renderHook(() =>
        useAdminFilters<TestItem, { category?: string }>({
          data: mockData,
          searchFn,
          filterFn
        })
      );

      act(() => {
        result.current.setFilter('category', 'A');
        result.current.setSearchTerm('gamma');
      });

      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].name).toBe('Gamma');
    });

    it('deve limpar filtros com clearFilters', () => {
      const { result } = renderHook(() =>
        useAdminFilters<TestItem, { category?: string }>({
          data: mockData,
          searchFn,
          filterFn
        })
      );

      act(() => {
        result.current.setFilter('category', 'A');
        result.current.setSearchTerm('gamma');
      });

      expect(result.current.hasActiveFilters).toBe(true);

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.hasActiveFilters).toBe(false);
      expect(result.current.filteredData).toHaveLength(8);
    });

    it('deve ignorar filtro "all"', () => {
      const { result } = renderHook(() =>
        useAdminFilters<TestItem, { category?: string }>({
          data: mockData,
          filterFn
        })
      );

      act(() => {
        result.current.setFilter('category', 'all');
      });

      expect(result.current.filteredData).toHaveLength(8);
      expect(result.current.hasActiveFilters).toBe(false);
    });
  });

  describe('Paginação', () => {
    it('deve paginar corretamente', () => {
      const { result } = renderHook(() =>
        useAdminFilters<TestItem>({ data: mockData, pageSize: 3 })
      );

      expect(result.current.paginatedData).toHaveLength(3);
      expect(result.current.pagination.totalPages).toBe(3);
    });

    it('deve navegar entre páginas', () => {
      const { result } = renderHook(() =>
        useAdminFilters<TestItem>({ data: mockData, pageSize: 3 })
      );

      expect(result.current.paginatedData[0].id).toBe(1);

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.pagination.page).toBe(2);
      expect(result.current.paginatedData[0].id).toBe(4);

      act(() => {
        result.current.prevPage();
      });

      expect(result.current.pagination.page).toBe(1);
    });

    it('não deve ultrapassar limites de página', () => {
      const { result } = renderHook(() =>
        useAdminFilters<TestItem>({ data: mockData, pageSize: 3 })
      );

      // Tentar ir antes da primeira página
      act(() => {
        result.current.prevPage();
      });
      expect(result.current.pagination.page).toBe(1);

      // Ir para última página
      act(() => {
        result.current.goToPage(3);
      });
      expect(result.current.pagination.page).toBe(3);

      // Tentar ir além
      act(() => {
        result.current.nextPage();
      });
      expect(result.current.pagination.page).toBe(3);
    });

    it('deve alterar tamanho da página', () => {
      const { result } = renderHook(() =>
        useAdminFilters<TestItem>({ data: mockData, pageSize: 3 })
      );

      expect(result.current.pagination.totalPages).toBe(3);

      act(() => {
        result.current.setPageSize(4);
      });

      expect(result.current.pagination.pageSize).toBe(4);
      expect(result.current.pagination.totalPages).toBe(2);
      expect(result.current.pagination.page).toBe(1); // Reset para 1
    });

    it('deve ajustar página quando filtros reduzem dados', () => {
      const { result } = renderHook(() =>
        useAdminFilters<TestItem, { category?: string }>({
          data: mockData,
          pageSize: 2,
          filterFn
        })
      );

      // Ir para página 4
      act(() => {
        result.current.goToPage(4);
      });
      expect(result.current.pagination.page).toBe(4);

      // Filtrar - total de páginas diminui
      act(() => {
        result.current.setFilter('category', 'A');
      });

      // Página deve ajustar para ser válida (max 2 páginas com 3 itens)
      expect(result.current.pagination.page).toBeLessThanOrEqual(2);
    });
  });

  describe('Ordenação', () => {
    it('deve ordenar por campo', () => {
      const { result } = renderHook(() =>
        useAdminFilters<TestItem>({
          data: mockData,
          sortFn,
          initialSortField: 'value',
          initialSortOrder: 'asc'
        })
      );

      expect(result.current.filteredData[0].value).toBe(100);
      expect(result.current.filteredData[7].value).toBe(300);
    });

    it('deve alternar ordem', () => {
      const { result } = renderHook(() =>
        useAdminFilters<TestItem>({
          data: mockData,
          sortFn,
          initialSortField: 'value',
          initialSortOrder: 'asc'
        })
      );

      act(() => {
        result.current.toggleSortOrder();
      });

      expect(result.current.sort.order).toBe('desc');
      expect(result.current.filteredData[0].value).toBe(300);
    });

    it('deve trocar campo de ordenação', () => {
      const { result } = renderHook(() =>
        useAdminFilters<TestItem>({
          data: mockData,
          sortFn,
          initialSortField: 'value'
        })
      );

      act(() => {
        result.current.setSort('name', 'asc');
      });

      expect(result.current.sort.field).toBe('name');
      expect(result.current.sort.order).toBe('asc');
    });
  });

  describe('Reset', () => {
    it('deve resetar todos os estados', () => {
      const { result } = renderHook(() =>
        useAdminFilters<TestItem, { category?: string }>({
          data: mockData,
          pageSize: 3,
          searchFn,
          filterFn,
          sortFn,
          initialSortField: 'value',
          initialSortOrder: 'desc'
        })
      );

      // Modificar tudo
      act(() => {
        result.current.setSearchTerm('test');
        result.current.setFilter('category', 'A');
        result.current.goToPage(2);
        result.current.setSort('name', 'asc');
      });

      // Resetar
      act(() => {
        result.current.resetAll();
      });

      expect(result.current.searchTerm).toBe('');
      expect(result.current.filters).toEqual({});
      expect(result.current.pagination.page).toBe(1);
      expect(result.current.sort.field).toBe('value');
      expect(result.current.sort.order).toBe('desc');
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com dados vazios', () => {
      const { result } = renderHook(() =>
        useAdminFilters<TestItem>({ data: [] })
      );

      expect(result.current.filteredData).toHaveLength(0);
      expect(result.current.paginatedData).toHaveLength(0);
      expect(result.current.pagination.totalPages).toBe(1);
    });

    it('deve lidar com mudança de dados externos', () => {
      const { result, rerender } = renderHook(
        ({ data }) => useAdminFilters<TestItem>({ data }),
        { initialProps: { data: mockData } }
      );

      expect(result.current.filteredData).toHaveLength(8);

      // Simular atualização externa
      rerender({ data: mockData.slice(0, 3) });

      expect(result.current.filteredData).toHaveLength(3);
    });
  });
});
