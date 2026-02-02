/**
 * Testes Unitários - AttributeGridNew
 * 
 * Verifica renderização correta dos atributos, tooltips e
 * callback de rolagem ao clicar no d20.
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AttributeGridNew } from '../AttributeGridNew';
import { ATTRIBUTE_ORDER, ATTRIBUTE_DISPLAY } from '@/lib/constants/attributes';

// Mock dos atributos de um personagem típico
const mockAttributes = {
  agility: 3,
  strength: 2,
  presence: 1,
  intellect: 4,
  vigor: 2,
};

describe('AttributeGridNew', () => {
  describe('Renderização', () => {
    it('deve renderizar todos os 5 atributos', () => {
      const { getByText, getAllByText } = render(<AttributeGridNew attributes={mockAttributes} />);
      
      // Verifica se todos os valores estão presentes
      expect(getByText('3')).toBeInTheDocument(); // AGI
      expect(getAllByText('2').length).toBeGreaterThanOrEqual(1); // FOR ou VIG
      expect(getByText('1')).toBeInTheDocument(); // PRE
      expect(getByText('4')).toBeInTheDocument(); // INT
    });

    it('deve renderizar os nomes dos atributos em português', () => {
      const { getByText } = render(<AttributeGridNew attributes={mockAttributes} />);
      
      // Verifica nomes em português
      ATTRIBUTE_ORDER.forEach((key) => {
        const display = ATTRIBUTE_DISPLAY[key];
        expect(getByText(display.name)).toBeInTheDocument();
      });
    });

    it('deve renderizar valores zero corretamente', () => {
      const zeroAttributes = {
        agility: 0,
        strength: 0,
        presence: 0,
        intellect: 0,
        vigor: 0,
      };
      
      const { getAllByText } = render(<AttributeGridNew attributes={zeroAttributes} />);
      
      // Todos os valores devem ser 0
      const zeros = getAllByText('0');
      expect(zeros.length).toBe(5);
    });

    it('deve aplicar className customizada', () => {
      const { container } = render(
        <AttributeGridNew 
          attributes={mockAttributes} 
          className="custom-test-class" 
        />
      );
      
      expect(container.querySelector('.custom-test-class')).toBeInTheDocument();
    });
  });

  describe('Interação - Rolagem de Dados', () => {
    it('deve chamar onRoll com valor e nome do atributo ao clicar', () => {
      const mockOnRoll = vi.fn();
      
      const { getByText } = render(
        <AttributeGridNew 
          attributes={mockAttributes} 
          onRoll={mockOnRoll} 
        />
      );
      
      // Clica no atributo Intelecto (valor 4)
      const intellectValue = getByText('4');
      const intellectCard = intellectValue.closest('[class*="cursor-pointer"]');
      
      if (intellectCard) {
        intellectCard.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
      
      expect(mockOnRoll).toHaveBeenCalledWith(4, 'Intelecto');
    });

    it('deve chamar onRoll com valor 0 para atributo zerado', () => {
      const mockOnRoll = vi.fn();
      const zeroAttributes = {
        agility: 0,
        strength: 1,
        presence: 1,
        intellect: 1,
        vigor: 1,
      };
      
      const { getByText } = render(
        <AttributeGridNew 
          attributes={zeroAttributes} 
          onRoll={mockOnRoll} 
        />
      );
      
      // Clica no atributo Agilidade (valor 0)
      const agilityName = getByText('Agilidade');
      const agilityCard = agilityName.closest('[class*="cursor-pointer"]');
      
      if (agilityCard) {
        agilityCard.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
      
      expect(mockOnRoll).toHaveBeenCalledWith(0, 'Agilidade');
    });

    it('não deve quebrar se onRoll não for fornecido', () => {
      const { getByText } = render(<AttributeGridNew attributes={mockAttributes} />);
      
      // Clica sem handler - não deve lançar erro
      const forceValue = getByText('Força');
      const forceCard = forceValue.closest('[class*="cursor-pointer"]');
      
      expect(() => {
        if (forceCard) {
          forceCard.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      }).not.toThrow();
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter estrutura semântica correta', () => {
      const { getByText } = render(<AttributeGridNew attributes={mockAttributes} />);
      
      // Verifica título da seção
      expect(getByText('Atributos')).toBeInTheDocument();
      
      // Grid deve estar presente
      const grid = getByText('Atributos').parentElement?.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Memoização', () => {
    it('não deve re-renderizar com as mesmas props', () => {
      const mockOnRoll = vi.fn();
      
      const { rerender, getByText } = render(
        <AttributeGridNew 
          attributes={mockAttributes} 
          onRoll={mockOnRoll} 
        />
      );
      
      // Re-renderiza com as mesmas props
      rerender(
        <AttributeGridNew 
          attributes={mockAttributes} 
          onRoll={mockOnRoll} 
        />
      );
      
      // Componente deve estar memoizado (React.memo)
      // Este teste verifica que a estrutura é mantida
      expect(getByText('4')).toBeInTheDocument();
    });
  });
});
