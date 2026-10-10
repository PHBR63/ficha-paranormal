import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { StepAttributes } from '../StepAttributes';
import { validCreation } from '@/test/fixtures/characterCreation';
import { inspectCharacterCreation } from '@/lib/character-creation-rules';

describe('Atributos no contrato de criação', () => {
  it('identifica cada ação e envia somente o atributo alterado', () => {
    const form = validCreation();
    form.attributes.agility = 1;
    const update = vi.fn();
    render(<StepAttributes formData={form} updateFormData={update} />);
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar Agilidade' }));
    expect(update).toHaveBeenCalledWith({ attributes: { ...form.attributes, agility: 2 } });
    expect(screen.getByRole('button', { name: 'Reduzir Agilidade' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Como Agilidade funciona' })).toBeEnabled();
  });

  it('mostra o mesmo total de PV da revisão com Sangue de Ferro', () => {
    const form = validCreation();
    form.nex = 15;
    form.classTrack = 'guerreiro';
    form.abilities = ['transcender-comb'];
    form.transcenderChoices = { 'transcender-comb-0': { powerId: 'sangue-de-ferro', powerName: 'Sangue de Ferro', powerElement: 'sangue' } };
    render(<StepAttributes formData={form} updateFormData={vi.fn()} />);
    expect(screen.getByText('PV:').parentElement).toHaveTextContent(new RegExp(`PV:\\s*${inspectCharacterCreation(form).displayStats.hp}`));
  });
});
