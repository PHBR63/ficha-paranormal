import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StepSkills } from '../StepSkills';
import { rebuildCharacterSheet } from '@/lib/character-builder-engine';
import type { CharacterFormData } from '@/pages/CharacterCreate';

afterEach(cleanup);

// Reproduz o modelo Guerreiro com treinamentos repetidos na lista livre.
function templateForm(freeSkills: string[]): CharacterFormData {
  return {
    name: 'QA', playerName: '', concept: '', age: null, gender: '', appearance: '',
    personality: '', photoUrl: null, photoFile: null, origin: 'militar',
    characterClass: 'Combatente', nex: 5, patent: 'Recruta',
    attributes: { agility: 1, strength: 3, intellect: 1, presence: 1, vigor: 3 },
    originSkills: [], classSkillChoices: { combat: 'luta', defense: 'fortitude' },
    freeSkills, conflictResolutions: {}, skills: {}, powers: [], background: '',
    proficiencies: [], abilities: [], classTrack: 'guerreiro', trackAbilities: [],
    rituals: [], originParanormalPower: null, skillTrainingChoices: {},
    transcenderChoices: {}, classPowerChoices: {},
  };
}

describe('Perícias livres de templates', () => {
  it('mostra 2/2 quando as outras perícias já são concedidas pela origem e classe', () => {
    const form = templateForm(['pontaria', 'luta', 'fortitude', 'atletismo', 'intimidacao', 'atletismo']);
    render(<StepSkills formData={form} updateFormData={vi.fn()} buildResult={rebuildCharacterSheet(form)} />);
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Luta +5' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Vontade não treinada' })).toBeDisabled();
  });

  it('mantém uma escolha disponível quando resta um ponto livre', () => {
    const form = templateForm(['luta', 'fortitude', 'atletismo']);
    render(<StepSkills formData={form} updateFormData={vi.fn()} buildResult={rebuildCharacterSheet(form)} />);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vontade não treinada' })).toBeEnabled();
    expect(form.freeSkills).toEqual(['luta', 'fortitude', 'atletismo']);
  });
});
