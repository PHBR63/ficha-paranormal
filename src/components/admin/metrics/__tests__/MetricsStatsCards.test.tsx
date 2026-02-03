/**
 * Testes Unitários - MetricsStatsCards
 * 
 * Valida renderização dos cards de estatísticas administrativas
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MetricsStatsCards } from '../MetricsStatsCards';
import type { SystemStats } from '../AdminMetricsDashboard';

describe('MetricsStatsCards', () => {
  describe('Renderização', () => {
    it('deve renderizar todos os 4 cards', () => {
      const stats: SystemStats = {
        totalUsers: 100,
        totalCharacters: 250,
        totalCampaigns: 30,
        totalSessions: 150,
        adminCount: 5
      };

      const { getByText } = render(<MetricsStatsCards stats={stats} />);

      expect(getByText('Usuários')).toBeInTheDocument();
      expect(getByText('Personagens')).toBeInTheDocument();
      expect(getByText('Campanhas')).toBeInTheDocument();
      expect(getByText('Sessões')).toBeInTheDocument();
    });

    it('deve exibir valores corretos', () => {
      const stats: SystemStats = {
        totalUsers: 100,
        totalCharacters: 250,
        totalCampaigns: 30,
        totalSessions: 150,
        adminCount: 5
      };

      const { getByText } = render(<MetricsStatsCards stats={stats} />);

      expect(getByText('100')).toBeInTheDocument();
      expect(getByText('250')).toBeInTheDocument();
      expect(getByText('30')).toBeInTheDocument();
      expect(getByText('150')).toBeInTheDocument();
    });

    it('deve exibir contagem de admins', () => {
      const stats: SystemStats = {
        totalUsers: 100,
        totalCharacters: 250,
        totalCampaigns: 30,
        totalSessions: 150,
        adminCount: 5
      };

      const { getByText } = render(<MetricsStatsCards stats={stats} />);

      expect(getByText('5 admin(s)')).toBeInTheDocument();
    });

    it('deve exibir descrições auxiliares', () => {
      const stats: SystemStats = {
        totalUsers: 10,
        totalCharacters: 20,
        totalCampaigns: 5,
        totalSessions: 15,
        adminCount: 2
      };

      const { getByText } = render(<MetricsStatsCards stats={stats} />);

      expect(getByText('Fichas criadas')).toBeInTheDocument();
      expect(getByText('V1 e V2 combinadas')).toBeInTheDocument();
      expect(getByText('Sessões registradas')).toBeInTheDocument();
    });
  });

  describe('Valores Default', () => {
    it('deve exibir 0 quando stats é undefined', () => {
      const { getAllByText } = render(<MetricsStatsCards stats={undefined} />);

      // Deve ter quatro "0" (um para cada card)
      const zeros = getAllByText('0');
      expect(zeros).toHaveLength(4);
    });

    it('deve exibir "0 admin(s)" quando adminCount é 0', () => {
      const stats: SystemStats = {
        totalUsers: 10,
        totalCharacters: 0,
        totalCampaigns: 0,
        totalSessions: 0,
        adminCount: 0
      };

      const { getByText } = render(<MetricsStatsCards stats={stats} />);

      expect(getByText('0 admin(s)')).toBeInTheDocument();
    });
  });

  describe('Estilização', () => {
    it('deve aplicar grid de 4 colunas em telas grandes', () => {
      const stats: SystemStats = {
        totalUsers: 10,
        totalCharacters: 20,
        totalCampaigns: 5,
        totalSessions: 15,
        adminCount: 1
      };

      const { container } = render(<MetricsStatsCards stats={stats} />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('lg:grid-cols-4');
    });
  });
});
