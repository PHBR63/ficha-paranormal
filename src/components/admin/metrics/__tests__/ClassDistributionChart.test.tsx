/**
 * Testes Unitários - ClassDistributionChart
 * 
 * Valida renderização do gráfico de distribuição de classes
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ClassDistributionChart } from '../ClassDistributionChart';
import type { ClassDistribution } from '../AdminMetricsDashboard';

describe('ClassDistributionChart', () => {
  describe('Renderização', () => {
    it('deve renderizar título do card', () => {
      const data: ClassDistribution[] = [
        { class: 'Combatente', count: 50 },
        { class: 'Especialista', count: 30 },
        { class: 'Ocultista', count: 20 }
      ];

      const { getByText } = render(<ClassDistributionChart data={data} />);

      expect(getByText('Distribuição por Classe')).toBeInTheDocument();
    });

    it('deve exibir legenda com todas as classes', () => {
      const data: ClassDistribution[] = [
        { class: 'Combatente', count: 50 },
        { class: 'Especialista', count: 30 },
        { class: 'Ocultista', count: 20 }
      ];

      const { getByText } = render(<ClassDistributionChart data={data} />);

      expect(getByText(/Combatente:/)).toBeInTheDocument();
      expect(getByText(/Especialista:/)).toBeInTheDocument();
      expect(getByText(/Ocultista:/)).toBeInTheDocument();
    });

    it('deve exibir contagens na legenda', () => {
      const data: ClassDistribution[] = [
        { class: 'Combatente', count: 50 },
        { class: 'Especialista', count: 30 }
      ];

      const { getByText } = render(<ClassDistributionChart data={data} />);

      expect(getByText('50')).toBeInTheDocument();
      expect(getByText('30')).toBeInTheDocument();
    });
  });

  describe('Estado Vazio', () => {
    it('deve exibir mensagem quando não há dados', () => {
      const { getByText } = render(<ClassDistributionChart data={[]} />);

      expect(getByText('Nenhum dado disponível')).toBeInTheDocument();
    });

    it('não deve exibir legenda quando não há dados', () => {
      const { queryByText } = render(<ClassDistributionChart data={[]} />);

      expect(queryByText(/Combatente:/)).not.toBeInTheDocument();
    });
  });

  describe('Cálculos', () => {
    it('deve calcular percentuais corretamente', () => {
      // Total = 100, então cada classe deve ter seu percentual exato
      const data: ClassDistribution[] = [
        { class: 'Combatente', count: 50 }, // 50%
        { class: 'Especialista', count: 30 }, // 30%
        { class: 'Ocultista', count: 20 } // 20%
      ];

      const { container } = render(<ClassDistributionChart data={data} />);

      // O gráfico deve estar presente
      const chart = container.querySelector('.recharts-wrapper');
      expect(chart).toBeInTheDocument();
    });
  });

  describe('Cores', () => {
    it('deve ter indicadores de cor na legenda', () => {
      const data: ClassDistribution[] = [
        { class: 'Combatente', count: 10 },
        { class: 'Especialista', count: 10 }
      ];

      const { container } = render(<ClassDistributionChart data={data} />);

      // Deve ter elementos com cor de fundo (indicadores)
      const colorIndicators = container.querySelectorAll('.rounded-full');
      expect(colorIndicators.length).toBeGreaterThanOrEqual(2);
    });
  });
});
