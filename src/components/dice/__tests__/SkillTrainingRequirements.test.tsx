import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DiceRollModal } from '../DiceRollModal';
import { MobileDiceRollModal } from '@/components/character/mobile/MobileDiceRollModal';
import * as diceEngine from '@/lib/dice-roller';
import { SkillsByAttribute } from '@/components/character/SkillsByAttribute';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SKILLS } from '@/lib/character-data';
import { getSkillTrainingRequirement } from '@/lib/skill-test-requirements';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
beforeEach(() => { vi.useFakeTimers(); vi.spyOn(Math, 'random').mockReturnValue(0.45); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

it('confere as 28 entradas com a tabela oficial, incluindo Medicina e Profissão', () => {
  expect(SKILLS).toHaveLength(28);
  expect(SKILLS.filter(s => s.requiresTraining).map(s => s.id)).toEqual([
    'adestramento', 'artes', 'ciencias', 'crime', 'ocultismo', 'pilotagem', 'profissao', 'religiao', 'tatica', 'tecnologia',
  ]);
});
it('reconhece nomes legados, respeita zero canônico e rejeita graus inválidos', () => {
  expect(getSkillTrainingRequirement('Ciências', { 'Ciências': 1 })).toBeNull();
  expect(getSkillTrainingRequirement('Ciências', { ciencias: 0, 'Ciências': 3 })).toContain('exige treinamento');
  for (const value of [-1, 5, NaN, 0.5]) expect(getSkillTrainingRequirement('Ciências', { ciencias: value })).not.toBeNull();
  expect(getSkillTrainingRequirement('Intelecto', {})).toBeNull();
  expect(getSkillTrainingRequirement('Crime', {}, NaN)).not.toBeNull();
});

for (const [name, Modal] of [['desktop', DiceRollModal], ['mobile', MobileDiceRollModal]] as const) {
  describe(`requisito de treino no ${name}`, () => {
    it('bloqueia perícia destreinada com bônus alto antes de sorteio, PE e histórico', async () => {
      const complete = vi.fn(); const pe = vi.fn();
      render(<Modal open onClose={() => undefined} label="Profissão" currentSkill="profissao" attributeValue={3}
        skillBonus={15} characterSkillTraining={{ profissao: 0 }} onRollComplete={complete} onPEChange={pe} />);
      expect(screen.getByRole('alert').textContent).toContain('Profissão exige treinamento');
      const engine = vi.spyOn(diceEngine, 'rollSkillTest');
      expect(screen.getByRole('button', { name: /ROLAR DADOS/ })).toBeDisabled();
      fireEvent.click(screen.getByRole('button', { name: /ROLAR DADOS/ }));
      await act(async () => { vi.advanceTimersByTime(2000); });
      expect(engine).not.toHaveBeenCalled();
      expect(complete).not.toHaveBeenCalled(); expect(pe).not.toHaveBeenCalled();
    });
    it.each([1, 2, 3])('libera treinamento de grau %s sem alterar a ficha', async level => {
      const complete = vi.fn(); const training = { profissao: level };
      render(<Modal open onClose={() => undefined} label="Profissão" currentSkill="profissao" attributeValue={1}
        skillBonus={level * 5} characterSkillTraining={training} onRollComplete={complete} />);
      expect(screen.queryByRole('alert')).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: /ROLAR DADOS/ }));
      await act(async () => { vi.advanceTimersByTime(2000); });
      expect(complete).toHaveBeenCalledTimes(1); expect(training.profissao).toBe(level);
    });
    it('libera Medicina genérica sem treinamento', async () => {
      const complete = vi.fn();
      render(<Modal open onClose={() => undefined} label="Medicina" currentSkill="medicina" attributeValue={1} onRollComplete={complete} />);
      fireEvent.click(screen.getByRole('button', { name: /ROLAR DADOS/ }));
      await act(async () => { vi.advanceTimersByTime(2000); }); expect(complete).toHaveBeenCalledTimes(1);
    });
    it('exige Eclético selecionado e aguarda confirmação do PE antes de entregar resultado', async () => {
      const complete = vi.fn(); let confirm!: (value: boolean) => void;
      const pe = vi.fn(() => new Promise<boolean>(resolve => { confirm = resolve; }));
      render(<Modal open onClose={() => undefined} label="Pilotagem" currentSkill="pilotagem"
        attributeValue={1} skillBonus={15} bonusSources={[{ label: "Bônus situacional", type: "power", value: 15 }]}
        peCurrent={10} characterSkillTraining={{ pilotagem: 0 }} onPEChange={pe} onRollComplete={complete}
        activatablePowers={[{ id: 'ecletico-treinado', name: 'Eclético', description: 'Treino temporário', peCost: 2,
          effect: '+5 treino', effectType: 'skill_trained', skillBonus: 5, icon: 'zap' }]} />);
      expect(screen.getByRole('alert').textContent).toContain('Pilotagem exige treinamento');
      fireEvent.click(screen.getByRole('switch'));
      expect(screen.queryByRole('alert')).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: /ROLAR DADOS/ }));
      await act(async () => { vi.advanceTimersByTime(2000); });
      expect(pe).toHaveBeenCalledExactlyOnceWith(8); expect(complete).not.toHaveBeenCalled();
      await act(async () => { confirm(true); }); expect(complete).toHaveBeenCalledTimes(1);
      expect(complete.mock.calls[0][0]).toMatchObject({ skillBonus: 5, otherBonuses: 15, total: 30 });
    });
  });
}


it('mostra o requisito na lista acessível e lê treinamento legado sem confundir bônus', () => {
  const onRoll = vi.fn();
  render(<TooltipProvider><SkillsByAttribute skills={{ 'Ciências': 1 }} attributes={{ intellect: 2 }}
    skillBonuses={{ profissao: { total: 15 } }} onRoll={onRoll} /></TooltipProvider>);
  const required = screen.getByRole('button', { name: 'Testar Profissão: exige treinamento' });
  expect(required.textContent).toContain('Exige treinamento');
  expect(screen.getByRole('button', { name: 'Testar Medicina' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Testar Ciências' }));
  expect(onRoll).toHaveBeenCalledWith(7, 'Ciências', 2, 0, 0);
});

