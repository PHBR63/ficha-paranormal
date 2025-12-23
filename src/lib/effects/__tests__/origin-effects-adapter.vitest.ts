// =====================================================
// Testes Vitest - Adaptador de Efeitos de Origem
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Cobertura:
// - Mapeamento de origens para poderes
// - Mecânicas de poderes de origem
// - Conversão para UnifiedEffect
// - Efeitos dinâmicos baseados em atributos
// - Efeitos togglable (ativáveis)
// - Listagem de origens disponíveis
//

import { describe, it, expect } from 'vitest';
import {
  ORIGIN_POWER_EFFECTS,
  getOriginEffects,
  listAllOriginEffects,
} from '../origin-effects-adapter';

// =====================================================
// INTEGRIDADE DO MAPEAMENTO
// =====================================================

describe('Integridade do Mapeamento de Origens', () => {
  it('deve ter todas as origens do livro base mapeadas', () => {
    const origensBase = [
      'saber-e-poder', // Acadêmico
      'tecnica-medicinal', // Agente de Saúde
      'vislumbres-do-passado', // Amnésico
      'magnum-opus', // Artista
      '110-porcento', // Atleta
      'ingrediente-secreto', // Chef
      'o-crime-compensa', // Criminoso
      'tracos-do-outro-lado', // Cultista Arrependido
      'calejado', // Desgarrado
      'ferramenta-favorita', // Engenheiro
      'processo-otimizado', // Executivo
      'faro-para-pistas', // Investigador
      'mao-pesada', // Lutador
      'patrocinador-da-ordem', // Magnata
      'posicao-de-combate', // Mercenário
      'para-bellum', // Militar
      'ferramenta-de-trabalho', // Operário
      'patrulha', // Policial
      'acalentar', // Religioso
      'espirito-civico', // Servidor Público
      'motor-de-busca', // T.I.
      'eu-ja-sabia', // Teórico da Conspiração
      'desbravador', // Trabalhador Rural
      'impostor', // Trambiqueiro
      'aprendizagem-aplicada', // Universitário
      'cicatrizes', // Vítima
    ];

    for (const powerId of origensBase) {
      expect(ORIGIN_POWER_EFFECTS[powerId]).toBeDefined();
      expect(ORIGIN_POWER_EFFECTS[powerId].description).toBeTruthy();
    }
  });

  it('deve ter origens de suplementos mapeadas', () => {
    const origensSuplemento = [
      'companheiro-animal', // Amigo dos Animais
      'acostumado-ao-extremo', // Astronauta
      'fome-do-outro-lado', // Chef do Outro Lado
      'poder-da-amizade', // Colegial
      'nao-e-fantasia-e-cosplay', // Cosplayer
      'conexoes', // Diplomata
      'mutacao', // Experimento
    ];

    for (const powerId of origensSuplemento) {
      expect(ORIGIN_POWER_EFFECTS[powerId]).toBeDefined();
    }
  });

  it('todos os poderes devem ter mecânicas definidas', () => {
    for (const [powerId, power] of Object.entries(ORIGIN_POWER_EFFECTS)) {
      expect(power.mechanics).toBeDefined();
      expect(power.description).toBeTruthy();
    }
  });
});

// =====================================================
// MECÂNICAS DE PODERES
// =====================================================

describe('Mecânicas de Poderes de Origem', () => {
  it('Faro para Pistas deve dar +5 em Investigação', () => {
    const power = ORIGIN_POWER_EFFECTS['faro-para-pistas'];
    expect(power.mechanics.skillBonus?.investigacao).toBe(5);
  });

  it('Posição de Combate deve dar +5 Iniciativa', () => {
    const power = ORIGIN_POWER_EFFECTS['posicao-de-combate'];
    expect(power.mechanics.initiativeBonus).toBe(5);
  });

  it('Patrulha deve dar +2 Defesa', () => {
    const power = ORIGIN_POWER_EFFECTS['patrulha'];
    expect(power.mechanics.defenseBonus).toBe(2);
  });

  it('Mão Pesada deve dar +2 dano desarmado', () => {
    const power = ORIGIN_POWER_EFFECTS['mao-pesada'];
    expect(power.mechanics.meleeDamageBonus).toBe(2);
  });

  it('Espírito Cívico deve dar bônus em resistências', () => {
    const power = ORIGIN_POWER_EFFECTS['espirito-civico'];
    expect(power.mechanics.fortitudeBonus).toBe(2);
    expect(power.mechanics.reflexosBonus).toBe(2);
    expect(power.mechanics.vontadeBonus).toBe(2);
  });

  it('Calejado deve dar PV por NEX', () => {
    const power = ORIGIN_POWER_EFFECTS['calejado'];
    expect(power.mechanics.hpBonusPerNex).toBe(1);
  });

  it('Mutação deve ter RD 2', () => {
    const power = ORIGIN_POWER_EFFECTS['mutacao'];
    expect(power.mechanics.damageReduction).toBe(2);
  });
});

// =====================================================
// PODERES TOGGLABLE
// =====================================================

describe('Poderes Togglable', () => {
  it('Saber é Poder deve ser togglable com custo 2 PE', () => {
    const power = ORIGIN_POWER_EFFECTS['saber-e-poder'];
    expect(power.isToggleable).toBe(true);
    expect(power.costPE).toBe(2);
  });

  it('110% deve ser togglable com custo 2 PE', () => {
    const power = ORIGIN_POWER_EFFECTS['110-porcento'];
    expect(power.isToggleable).toBe(true);
    expect(power.costPE).toBe(2);
  });

  it('Motor de Busca deve ser togglable com custo 2 PE', () => {
    const power = ORIGIN_POWER_EFFECTS['motor-de-busca'];
    expect(power.isToggleable).toBe(true);
    expect(power.costPE).toBe(2);
  });

  it('Poderes passivos não devem ser togglable', () => {
    expect(ORIGIN_POWER_EFFECTS['patrulha'].isToggleable).toBeUndefined();
    expect(ORIGIN_POWER_EFFECTS['posicao-de-combate'].isToggleable).toBeUndefined();
    expect(ORIGIN_POWER_EFFECTS['calejado'].isToggleable).toBeUndefined();
  });
});

// =====================================================
// PROFICIÊNCIAS CONCEDIDAS
// =====================================================

describe('Proficiências Concedidas', () => {
  it('Para Bellum deve conceder armas táticas', () => {
    const power = ORIGIN_POWER_EFFECTS['para-bellum'];
    expect(power.mechanics.grantsProficiency).toContain('Armas táticas');
  });

  it('Ferramenta de Trabalho deve conceder armas pesadas', () => {
    const power = ORIGIN_POWER_EFFECTS['ferramenta-de-trabalho'];
    expect(power.mechanics.grantsProficiency).toContain('Armas pesadas');
  });
});

// =====================================================
// CONVERSÃO PARA UNIFIED EFFECT
// =====================================================

describe('Conversão para UnifiedEffect', () => {
  it('getOriginEffects deve retornar array vazio para origem inexistente', () => {
    const effects = getOriginEffects('origem-inexistente', 'Inexistente');
    expect(effects).toEqual([]);
  });

  it('getOriginEffects deve converter Investigador corretamente', () => {
    const effects = getOriginEffects('investigador', 'Investigador');
    expect(effects.length).toBe(1);
    
    const effect = effects[0];
    expect(effect.id).toBe('origin-faro-para-pistas');
    expect(effect.name).toBe('Faro para Pistas');
    expect(effect.source).toBe('origin');
    expect(effect.sourceId).toBe('investigador');
    expect(effect.mechanics.skillBonus?.investigacao).toBe(5);
  });

  it('getOriginEffects deve converter Policial corretamente', () => {
    const effects = getOriginEffects('policial', 'Policial');
    expect(effects.length).toBe(1);
    
    const effect = effects[0];
    expect(effect.mechanics.defenseBonus).toBe(2);
  });

  it('getOriginEffects deve converter Mercenário corretamente', () => {
    const effects = getOriginEffects('mercenario', 'Mercenário');
    expect(effects.length).toBe(1);
    
    const effect = effects[0];
    expect(effect.mechanics.initiativeBonus).toBe(5);
  });
});

// =====================================================
// EFEITOS DINÂMICOS
// =====================================================

describe('Efeitos Dinâmicos Baseados em Atributos', () => {
  it('Eu Já Sabia deve ajustar RD mental baseado em INT', () => {
    const effects = getOriginEffects('teorico-da-conspiracao', 'Teórico da Conspiração', 3);
    expect(effects.length).toBe(1);
    
    const effect = effects[0];
    expect(effect.mechanics.damageResistance?.mental).toBe(3);
  });

  it('Eu Já Sabia deve usar INT = 1 como padrão', () => {
    const effects = getOriginEffects('teorico-da-conspiracao', 'Teórico da Conspiração');
    expect(effects.length).toBe(1);
    
    const effect = effects[0];
    expect(effect.mechanics.damageResistance?.mental).toBe(1);
  });

  it('Eu Já Sabia deve refletir INT alto', () => {
    const effects = getOriginEffects('teorico-da-conspiracao', 'Teórico da Conspiração', 5);
    expect(effects[0].mechanics.damageResistance?.mental).toBe(5);
  });
});

// =====================================================
// ATIVAÇÃO DE EFEITOS
// =====================================================

describe('Ativação de Efeitos', () => {
  it('efeito togglable deve estar inativo por padrão', () => {
    const effects = getOriginEffects('academico', 'Acadêmico', 3, []);
    const effect = effects[0];
    expect(effect.isToggleable).toBe(true);
    expect(effect.isActive).toBe(false);
  });

  it('efeito togglable deve estar ativo quando na lista de ativados', () => {
    const effects = getOriginEffects('academico', 'Acadêmico', 3, ['origin-saber-e-poder']);
    const effect = effects[0];
    expect(effect.isActive).toBe(true);
  });

  it('efeito passivo deve sempre estar ativo', () => {
    const effects = getOriginEffects('policial', 'Policial');
    const effect = effects[0];
    expect(effect.isToggleable).toBe(false);
    expect(effect.isActive).toBe(true);
  });
});

// =====================================================
// ALIASES DE ORIGENS
// =====================================================

describe('Aliases de Origens', () => {
  it('deve reconhecer T.I. como origem válida', () => {
    const effects = getOriginEffects('ti', 'T.I.');
    expect(effects.length).toBe(1);
    expect(effects[0].name).toBe('Motor de Busca');
  });

  it('deve reconhecer Hacker como alias de T.I.', () => {
    const effects = getOriginEffects('hacker', 'Hacker');
    expect(effects.length).toBe(1);
  });

  it('deve reconhecer Médico como alias de Agente de Saúde', () => {
    const effects = getOriginEffects('medico', 'Médico');
    expect(effects.length).toBe(1);
  });

  it('deve reconhecer Detetive como alias de Investigador', () => {
    const effects = getOriginEffects('detetive', 'Detetive');
    expect(effects.length).toBe(1);
    expect(effects[0].mechanics.skillBonus?.investigacao).toBe(5);
  });
});

// =====================================================
// LISTAGEM DE ORIGENS
// =====================================================

describe('Listagem de Origens Disponíveis', () => {
  it('listAllOriginEffects deve retornar todas as origens', () => {
    const list = listAllOriginEffects();
    expect(list.length).toBeGreaterThanOrEqual(26); // Livro base
  });

  it('listAllOriginEffects deve incluir informações corretas', () => {
    const list = listAllOriginEffects();
    
    const investigador = list.find(o => o.originId === 'investigador');
    expect(investigador).toBeDefined();
    expect(investigador?.powerId).toBe('faro-para-pistas');
    expect(investigador?.powerName).toBe('Faro para Pistas');
    expect(investigador?.hasMechanics).toBe(true);
  });

  it('listAllOriginEffects deve identificar toggleable corretamente', () => {
    const list = listAllOriginEffects();
    
    const academico = list.find(o => o.originId === 'academico');
    expect(academico?.isToggleable).toBe(true);
    
    const policial = list.find(o => o.originId === 'policial');
    expect(policial?.isToggleable).toBe(false);
  });
});

// =====================================================
// DESCRIÇÕES
// =====================================================

describe('Descrições de Poderes', () => {
  it('todos os poderes devem ter descrições não vazias', () => {
    for (const [powerId, power] of Object.entries(ORIGIN_POWER_EFFECTS)) {
      expect(power.description).toBeTruthy();
      expect(power.description.length).toBeGreaterThan(10);
    }
  });

  it('descrições devem conter informações relevantes', () => {
    const saberEPoder = ORIGIN_POWER_EFFECTS['saber-e-poder'];
    expect(saberEPoder.description).toContain('Intelecto');
    expect(saberEPoder.description).toContain('2 PE');
    expect(saberEPoder.description).toContain('+5');
  });
});

// =====================================================
// EFEITOS ESPECIAIS
// =====================================================

describe('Efeitos Especiais', () => {
  it('origens com efeitos especiais devem ter specialEffects', () => {
    const tecnicaMedicinal = ORIGIN_POWER_EFFECTS['tecnica-medicinal'];
    expect(tecnicaMedicinal.mechanics.specialEffects).toBeDefined();
    expect(tecnicaMedicinal.mechanics.specialEffects?.length).toBeGreaterThan(0);
  });

  it('Vislumbres do Passado deve ter efeito especial', () => {
    const vislumbres = ORIGIN_POWER_EFFECTS['vislumbres-do-passado'];
    expect(vislumbres.mechanics.specialEffects).toBeDefined();
    expect(vislumbres.mechanics.specialEffects?.some(e => e.includes('1x/sessão'))).toBe(true);
  });

  it('Magnum Opus deve ter efeito especial', () => {
    const magnumOpus = ORIGIN_POWER_EFFECTS['magnum-opus'];
    expect(magnumOpus.mechanics.specialEffects?.some(e => e.includes('1x/missão'))).toBe(true);
  });
});

// =====================================================
// NORMALIZAÇÃO DE IDS
// =====================================================

describe('Normalização de IDs', () => {
  it('deve normalizar IDs com acentos', () => {
    // Teórico da Conspiração com acento
    const effects1 = getOriginEffects('teórico-da-conspiração', 'Teórico');
    const effects2 = getOriginEffects('teorico-da-conspiracao', 'Teórico');
    
    // Ambos devem funcionar ou retornar array vazio consistentemente
    expect(effects1.length).toBe(effects2.length);
  });

  it('deve normalizar IDs com espaços', () => {
    // Diferentes formatos devem ser tratados
    const effects = getOriginEffects('servidor-publico', 'Servidor Público');
    expect(effects.length).toBe(1);
  });
});

// =====================================================
// CUSTO DE PE
// =====================================================

describe('Custo de PE', () => {
  it('efeitos com custo devem ter conditions definidas', () => {
    const effects = getOriginEffects('academico', 'Acadêmico');
    const effect = effects[0];
    
    expect(effect.conditions).toBeDefined();
    expect(effect.conditions?.costPE).toBe(2);
  });

  it('efeitos sem custo não devem ter conditions com costPE', () => {
    const effects = getOriginEffects('policial', 'Policial');
    const effect = effects[0];
    
    expect(effect.conditions?.costPE).toBeUndefined();
  });
});
