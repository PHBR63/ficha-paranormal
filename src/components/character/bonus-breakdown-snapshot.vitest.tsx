/**
 * Testes de Snapshot para Breakdowns de Bônus na UI
 * 
 * Garante a consistência visual dos componentes que exibem
 * breakdowns de bônus, detectando mudanças não-intencionais.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TrackCombatBonusesBar } from './TrackCombatBonusesBar';
import {
  createWarrior50Scenario,
  createAnnihilator75Scenario,
  createEliteShooter65Scenario,
  createSpecOps50Scenario,
  createShockTroop60Scenario,
  createStackingExclusionScenario,
  createConditionalBonusesScenario,
  createInfiltrator75Scenario,
  createMockCombatBonuses,
  createMockDamageReduction,
  createMockEffectResistances,
  createMockBreakdown,
} from './__tests__/breakdown-test-utils';

// ============================================================================
// TESTES: TrackCombatBonusesBar
// ============================================================================

describe('TrackCombatBonusesBar - Snapshots', () => {
  const defaultProps = {
    damageReduction: createMockDamageReduction(),
    effectResistances: createMockEffectResistances(),
  };

  describe('Cenários de Combatente', () => {
    it('renderiza corretamente Guerreiro NEX 50% com Ataque Especial', () => {
      const combat = createWarrior50Scenario();
      const { container } = render(
        <TrackCombatBonusesBar 
          combat={combat} 
          {...defaultProps}
          characterClass="Combatente"
          classTrack="Guerreiro"
          nex={50}
        />
      );
      expect(container).toMatchSnapshot();
    });

    it('renderiza corretamente Aniquilador NEX 75% com Técnica Destruidor', () => {
      const combat = createAnnihilator75Scenario();
      const { container } = render(
        <TrackCombatBonusesBar 
          combat={combat} 
          {...defaultProps}
          characterClass="Combatente"
          classTrack="Aniquilador"
          nex={75}
        />
      );
      expect(container).toMatchSnapshot();
    });

    it('renderiza corretamente Atirador de Elite NEX 65% com Mira de Elite', () => {
      const combat = createEliteShooter65Scenario();
      const { container } = render(
        <TrackCombatBonusesBar 
          combat={combat} 
          {...defaultProps}
          characterClass="Combatente"
          classTrack="Atirador de Elite"
          nex={65}
        />
      );
      expect(container).toMatchSnapshot();
    });

    it('renderiza corretamente Operações Especiais NEX 50% com bônus de iniciativa', () => {
      const combat = createSpecOps50Scenario();
      const { container } = render(
        <TrackCombatBonusesBar 
          combat={combat} 
          {...defaultProps}
          characterClass="Combatente"
          classTrack="Operações Especiais"
          nex={50}
        />
      );
      expect(container).toMatchSnapshot();
    });

    it('renderiza corretamente Tropa de Choque NEX 60% com RD', () => {
      const { combat, damageReduction } = createShockTroop60Scenario();
      const { container } = render(
        <TrackCombatBonusesBar 
          combat={combat} 
          damageReduction={damageReduction}
          effectResistances={createMockEffectResistances()}
          characterClass="Combatente"
          classTrack="Tropa de Choque"
          nex={60}
        />
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('Regras de Stacking', () => {
    it('renderiza corretamente com bônus excluídos por stacking', () => {
      const combat = createStackingExclusionScenario();
      const { container } = render(
        <TrackCombatBonusesBar 
          combat={combat} 
          {...defaultProps}
        />
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('Bônus Condicionais', () => {
    it('renderiza corretamente com bônus condicionais toggleáveis', () => {
      const combat = createConditionalBonusesScenario();
      const { container } = render(
        <TrackCombatBonusesBar 
          combat={combat} 
          {...defaultProps}
        />
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('Iniciativa', () => {
    it('renderiza botão de iniciativa com breakdown detalhado', () => {
      const combat = createSpecOps50Scenario();
      const mockOnRoll = () => {};
      const { getByRole } = render(
        <TrackCombatBonusesBar 
          combat={combat} 
          {...defaultProps}
          agility={3}
          characterClass="Combatente"
          classTrack="Operações Especiais"
          nex={50}
          onInitiativeRoll={mockOnRoll}
        />
      );
      // Livro Base v1.3, p. 27: +5 da trilha; AGI 3 determina o pool, não soma +3.
      expect(getByRole('button', { name: /Iniciativa/ })).toHaveTextContent(/Iniciativa\s*\+5/);
    });

    it('não renderiza nada sem bônus de trilha e sem callback de iniciativa', () => {
      const combat = createMockCombatBonuses();
      const { container } = render(
        <TrackCombatBonusesBar 
          combat={combat} 
          {...defaultProps}
        />
      );
      expect(container.innerHTML).toBe('');
    });
  });

  describe('Cenários de Especialista', () => {
    it('renderiza corretamente Infiltrador NEX 75% com Ataque Furtivo', () => {
      const combat = createInfiltrator75Scenario();
      const { container } = render(
        <TrackCombatBonusesBar 
          combat={combat} 
          {...defaultProps}
          characterClass="Especialista"
          classTrack="Infiltrador"
          nex={75}
        />
      );
      expect(container).toMatchSnapshot();
    });
  });
});

// ============================================================================
// TESTES: Estrutura de Dados de Breakdown
// ============================================================================

describe('Estrutura de Dados de Breakdown - Snapshots', () => {
  describe('Breakdown de Ataque', () => {
    it('snapshot de ataque simples com uma fonte', () => {
      const breakdown = createMockBreakdown([
        { source: 'Ataque Especial I', value: 2, type: 'ability' },
      ]);
      expect(breakdown).toMatchSnapshot();
    });

    it('snapshot de ataque com múltiplas fontes', () => {
      const breakdown = createMockBreakdown([
        { source: 'Ataque Especial II', value: 3, type: 'ability' },
        { source: 'Mira de Elite', value: 2, type: 'track_effect' },
        { source: 'Pontaria (Veterano)', value: 1, type: 'skill_training' },
        { source: 'Ritual Arma Mental', value: 2, type: 'ritual' },
      ]);
      expect(breakdown).toMatchSnapshot();
    });

    it('snapshot de ataque com fonte excluída por stacking', () => {
      const breakdown = createMockBreakdown([
        { source: 'Ritual Arma Mental +3', value: 3, type: 'ritual' },
        { 
          source: 'Ritual Precisão +2', 
          value: 2, 
          type: 'ritual',
          excluded: true,
          excludedReason: 'Ritual maior ativo (Arma Mental +3)',
        },
      ]);
      expect(breakdown).toMatchSnapshot();
    });
  });

  describe('Breakdown de Dano', () => {
    it('snapshot de dano com dados extras', () => {
      const breakdown = createMockBreakdown([
        { source: 'Ataque Especial I', value: 2, type: 'ability' },
        { source: 'Força', value: 3, type: 'origin' },
        { source: 'Ataque Furtivo', value: '3d6', type: 'track_effect' },
      ]);
      expect(breakdown).toMatchSnapshot();
    });

    it('snapshot de dano com bônus condicional', () => {
      const breakdown = createMockBreakdown([
        { 
          source: 'Assassinar', 
          value: '2d6', 
          type: 'track_effect',
          conditional: 'Alvo desprevenido',
          toggleable: true,
          toggleId: 'assassinar',
        },
      ]);
      expect(breakdown).toMatchSnapshot();
    });
  });

  describe('Breakdown de Margem Crítica', () => {
    it('snapshot de margem com múltiplas fontes', () => {
      const breakdown = createMockBreakdown([
        { source: 'Técnica Letal', value: 2, type: 'track_effect' },
        { source: 'Disparo Letal', value: 2, type: 'track_effect' },
        { source: 'Arma Precisa', value: 1, type: 'equipment' },
      ]);
      expect(breakdown).toMatchSnapshot();
    });
  });

  describe('Breakdown de Iniciativa', () => {
    it('snapshot de iniciativa com bônus de trilha', () => {
      const breakdown = createMockBreakdown([
        { source: 'Operações Especiais', value: 5, type: 'track_effect' },
        { source: 'Agilidade', value: 3, type: 'origin' },
        { source: 'Iniciativa (Treinado)', value: 2, type: 'skill_training' },
      ]);
      expect(breakdown).toMatchSnapshot();
    });
  });

  describe('Breakdown de Redução de Dano', () => {
    it('snapshot de RD física com Casca Grossa', () => {
      const damageReduction = createMockDamageReduction({
        physical: {
          total: 5,
          breakdown: createMockBreakdown([
            { source: 'Casca Grossa', value: 3, type: 'track_effect', conditional: 'Ao bloquear' },
            { source: 'Armadura Pesada', value: 2, type: 'equipment' },
          ]),
        },
      });
      expect(damageReduction).toMatchSnapshot();
    });

    it('snapshot de RD paranormal', () => {
      const damageReduction = createMockDamageReduction({
        paranormal: {
          total: 3,
          breakdown: createMockBreakdown([
            { source: 'Proteção Paranormal', value: 3, type: 'paranormal' },
          ]),
        },
      });
      expect(damageReduction).toMatchSnapshot();
    });
  });
});

// ============================================================================
// TESTES: Cenários Completos de Personagem
// ============================================================================

describe('Cenários Completos - Snapshots', () => {
  it('snapshot completo: Guerreiro NEX 50%', () => {
    const scenario = createWarrior50Scenario();
    expect(scenario).toMatchSnapshot();
  });

  it('snapshot completo: Aniquilador NEX 75%', () => {
    const scenario = createAnnihilator75Scenario();
    expect(scenario).toMatchSnapshot();
  });

  it('snapshot completo: Atirador de Elite NEX 65%', () => {
    const scenario = createEliteShooter65Scenario();
    expect(scenario).toMatchSnapshot();
  });

  it('snapshot completo: Operações Especiais NEX 50%', () => {
    const scenario = createSpecOps50Scenario();
    expect(scenario).toMatchSnapshot();
  });

  it('snapshot completo: Tropa de Choque NEX 60%', () => {
    const scenario = createShockTroop60Scenario();
    expect(scenario).toMatchSnapshot();
  });

  it('snapshot completo: Infiltrador NEX 75%', () => {
    const scenario = createInfiltrator75Scenario();
    expect(scenario).toMatchSnapshot();
  });

  it('snapshot de stacking com exclusão', () => {
    const scenario = createStackingExclusionScenario();
    expect(scenario).toMatchSnapshot();
  });

  it('snapshot de bônus condicionais', () => {
    const scenario = createConditionalBonusesScenario();
    expect(scenario).toMatchSnapshot();
  });
});
