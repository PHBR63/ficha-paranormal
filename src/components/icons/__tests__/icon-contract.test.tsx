import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ELEMENT_SYMBOLS } from '../element-symbols';
import { Heart, X } from '../ordem-icons';
import { getElementIcon, getItemIcon } from '@/components/character/mobile/utils';
import { getElementConfig } from '@/lib/element-config';

describe('Contrato dos ícones nas telas existentes', () => {
  it.each(Object.entries(ELEMENT_SYMBOLS))('mantém o elemento %s, rótulo, tamanho e ref', (element, Symbol) => {
    const ref = createRef<SVGSVGElement>();
    render(<Symbol ref={ref} size={32} role="img" aria-label={element} className="h-8 w-8" />);
    const icon = screen.getByRole('img', { name: element });
    expect(ref.current).toBe(icon);
    expect(icon).toHaveAttribute('width', '32');
    expect(icon).not.toHaveAttribute('aria-hidden');
    expect(icon.querySelector('image')).toHaveAttribute('href', `/icons/elements/${element}.png`);
    expect(getElementConfig(element.toUpperCase())?.icon).toBe(Symbol);
  });

  it('preserva ref, descrição e classes de um recurso da ficha', () => {
    const ref = createRef<SVGSVGElement>();
    render(<Heart ref={ref} size={20} fill="none" role="img" aria-label="Pontos de Vida" className="text-red-400" />);
    const icon = screen.getByRole('img', { name: 'Pontos de Vida' });
    expect(ref.current).toBe(icon);
    expect(icon).toHaveClass('lucide-heart', 'text-red-400');
    expect(icon).toHaveAttribute('width', '20');
    expect(icon).toHaveAttribute('fill', 'currentColor');
  });

  it('herda a cor do texto em fundos escuros sem receber fill', () => {
    render(<Heart role="img" aria-label="Vida" />);
    expect(screen.getByRole('img', { name: 'Vida' })).toHaveAttribute('fill', 'currentColor');
  });

  it('mantém o nome do botão de fechar sem anunciar ícones decorativos', () => {
    render(<button aria-label="Fechar"><X /></button>);
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeVisible();
  });
});

describe('Ícones dos helpers mobile', () => {
  it.each(['sangue', 'morte', 'conhecimento', 'energia', 'medo'])('renderiza símbolo oficial de %s sem emoji', element => {
    const { container } = render(getElementIcon(element));
    expect(container.querySelector('svg')).toHaveAttribute('data-element-symbol', element);
    expect(container.textContent).toBe('');
  });
  it.each(['weapon', 'armor', 'medical', 'investigation', 'communication', 'field', 'paranormal', 'document', 'survival', '0', 'I', 'II', 'III', 'IV', 'custom'])('renderiza SVG para item %s sem alterar o tipo', type => {
    const { container } = render(getItemIcon(type));
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.textContent).toBe('');
    if (type === 'II') {
      expect(container.querySelector('svg')).toHaveClass('text-blue-400');
      expect(container.querySelector('svg')).toHaveAttribute('fill', 'currentColor');
    }
  });
  it('usa fallback neutro para elemento desconhecido', () => {
    const { container } = render(getElementIcon('custom'));
    expect(container.querySelector('svg')).not.toHaveAttribute('data-element-symbol');
  });
});
