import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { StepRituals } from '../StepRituals';
import { CreationRitualExtras } from '../CreationRitualExtras';
import { validCreation } from '@/test/fixtures/characterCreation';
import { StepReview } from '../StepReview';
import { rebuildCharacterSheet } from '@/lib/character-builder-engine';
import { ALL_RITUALS } from '@/lib/rituals/legacy-exports';

describe('Seleção acessível de rituais na criação', () => {
  it('mostra na revisão qual ritual foi concedido por Saber Ampliado', () => {
    const form = validCreation('Ocultista');
    form.nex = 10;
    form.classTrack = 'graduado';
    form.rituals = ALL_RITUALS.filter(ritual => ritual.circle === 1).slice(0, 4).map(ritual => ritual.id);
    form.extraRituals = { 'saber-1': [ALL_RITUALS.find(ritual => ritual.name === 'Cinerária')!.id] };
    render(<StepReview formData={form} buildResult={rebuildCharacterSheet(form)} />);
    expect(screen.getByText('Saber Ampliado — 1º círculo:').parentElement).toHaveTextContent('Cinerária (medo)');
  });
  it('um clique no checkbox seleciona o ritual uma única vez', () => {
    const form = validCreation('Ocultista');
    const update = vi.fn();
    render(<StepRituals formData={form} updateFormData={update} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar Compreensão Paranormal (conhecimento, 1º círculo)' }));
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][0].rituals).toHaveLength(1);
  });

  it('distingue as quatro escolhas de Amaldiçoar Arma pelo elemento', () => {
    const form = validCreation('Ocultista');
    form.nex = 10;
    form.classTrack = 'lamina-paranormal';
    render(<CreationRitualExtras formData={form} updateFormData={vi.fn()} />);
    const choices = screen.getAllByRole('checkbox');
    expect(choices).toHaveLength(4);
    expect(new Set(choices.map(choice => choice.getAttribute('aria-label'))).size).toBe(4);
    for (const element of ['conhecimento','energia','morte','sangue']) {
      expect(screen.getByRole('checkbox', { name: new RegExp(`Amaldiçoar Arma \\(${element}, 1º círculo\\)`) })).toBeEnabled();
      expect(screen.getByText(`(${element} · 1º círculo)`)).toBeVisible();
    }
  });
});
