/**
 * Testes de validação para os componentes de trilha do Ocultista
 * 
 * Verifica:
 * - Todas as 5 trilhas estão exportadas corretamente
 * - Mapeamentos de componentes estão corretos
 * - IDs de trilhas estão consistentes com game-ids.ts
 */

import { describe, it, expect } from 'vitest';

// Imports de trilhas
import {
  ConduitePanel,
  FlageladorPanel,
  GraduadoPanel,
  IntuitivoPanel,
  LaminaParanormalPanel,
  MobileConduitePanel,
  MobileFlageladorPanel,
  MobileGraduadoPanel,
  MobileIntuitivoPanel,
  MobileLaminaParanormalPanel,
} from '../index';

// Imports de constantes
import { OCULTISTA_TRACK_IDS, ALL_TRACK_IDS } from '@/lib/constants';

// Imports de mapeamentos
import { 
  TRACK_COMPONENT_MAP, 
  MOBILE_TRACK_COMPONENT_MAP,
  hasTrackComponent,
  hasMobileTrackComponent,
} from '../../index';

describe('Trilhas do Ocultista - Exports', () => {
  it('deve exportar todos os painéis desktop', () => {
    expect(ConduitePanel).toBeDefined();
    expect(FlageladorPanel).toBeDefined();
    expect(GraduadoPanel).toBeDefined();
    expect(IntuitivoPanel).toBeDefined();
    expect(LaminaParanormalPanel).toBeDefined();
  });

  it('deve exportar todos os painéis mobile', () => {
    expect(MobileConduitePanel).toBeDefined();
    expect(MobileFlageladorPanel).toBeDefined();
    expect(MobileGraduadoPanel).toBeDefined();
    expect(MobileIntuitivoPanel).toBeDefined();
    expect(MobileLaminaParanormalPanel).toBeDefined();
  });
});

describe('Trilhas do Ocultista - IDs', () => {
  it('OCULTISTA_TRACK_IDS deve ter exatamente 5 trilhas', () => {
    const trackIds = Object.values(OCULTISTA_TRACK_IDS);
    expect(trackIds).toHaveLength(5);
  });

  it('deve ter os IDs corretos para cada trilha', () => {
    expect(OCULTISTA_TRACK_IDS.CONDUTOR).toBe('condutor');
    expect(OCULTISTA_TRACK_IDS.FLAGELADOR).toBe('flagelador');
    expect(OCULTISTA_TRACK_IDS.GRADUADO).toBe('graduado');
    expect(OCULTISTA_TRACK_IDS.INTUITIVO).toBe('intuitivo');
    expect(OCULTISTA_TRACK_IDS.LAMINA_PARANORMAL).toBe('lamina-paranormal');
  });

  it('todas as trilhas do Ocultista devem estar em ALL_TRACK_IDS', () => {
    const ocultistaTracks = Object.values(OCULTISTA_TRACK_IDS);
    ocultistaTracks.forEach(trackId => {
      expect(ALL_TRACK_IDS).toContain(trackId);
    });
  });
});

describe('Trilhas do Ocultista - Mapeamentos', () => {
  it('TRACK_COMPONENT_MAP deve incluir todas as trilhas do Ocultista', () => {
    expect(TRACK_COMPONENT_MAP[OCULTISTA_TRACK_IDS.CONDUTOR]).toBe('ConduitePanel');
    expect(TRACK_COMPONENT_MAP[OCULTISTA_TRACK_IDS.FLAGELADOR]).toBe('FlageladorPanel');
    expect(TRACK_COMPONENT_MAP[OCULTISTA_TRACK_IDS.GRADUADO]).toBe('GraduadoPanel');
    expect(TRACK_COMPONENT_MAP[OCULTISTA_TRACK_IDS.INTUITIVO]).toBe('IntuitivoPanel');
    expect(TRACK_COMPONENT_MAP[OCULTISTA_TRACK_IDS.LAMINA_PARANORMAL]).toBe('LaminaParanormalPanel');
  });

  it('MOBILE_TRACK_COMPONENT_MAP deve incluir todas as trilhas do Ocultista', () => {
    expect(MOBILE_TRACK_COMPONENT_MAP[OCULTISTA_TRACK_IDS.CONDUTOR]).toBe('MobileConduitePanel');
    expect(MOBILE_TRACK_COMPONENT_MAP[OCULTISTA_TRACK_IDS.FLAGELADOR]).toBe('MobileFlageladorPanel');
    expect(MOBILE_TRACK_COMPONENT_MAP[OCULTISTA_TRACK_IDS.GRADUADO]).toBe('MobileGraduadoPanel');
    expect(MOBILE_TRACK_COMPONENT_MAP[OCULTISTA_TRACK_IDS.INTUITIVO]).toBe('MobileIntuitivoPanel');
    expect(MOBILE_TRACK_COMPONENT_MAP[OCULTISTA_TRACK_IDS.LAMINA_PARANORMAL]).toBe('MobileLaminaParanormalPanel');
  });

  it('hasTrackComponent deve retornar true para todas as trilhas do Ocultista', () => {
    const ocultistaTracks = Object.values(OCULTISTA_TRACK_IDS);
    ocultistaTracks.forEach(trackId => {
      expect(hasTrackComponent(trackId)).toBe(true);
    });
  });

  it('hasMobileTrackComponent deve retornar true para todas as trilhas do Ocultista', () => {
    const ocultistaTracks = Object.values(OCULTISTA_TRACK_IDS);
    ocultistaTracks.forEach(trackId => {
      expect(hasMobileTrackComponent(trackId)).toBe(true);
    });
  });
});

describe('Trilhas do Ocultista - Consistência', () => {
  it('número de trilhas mapeadas deve ser igual ao número de IDs', () => {
    const trackIdsCount = Object.values(OCULTISTA_TRACK_IDS).length;
    const mappedCount = Object.values(OCULTISTA_TRACK_IDS).filter(
      id => id in TRACK_COMPONENT_MAP
    ).length;
    
    expect(mappedCount).toBe(trackIdsCount);
  });

  it('cada trilha deve ter versão desktop e mobile mapeada', () => {
    const ocultistaTracks = Object.values(OCULTISTA_TRACK_IDS);
    
    ocultistaTracks.forEach(trackId => {
      const hasDesktop = trackId in TRACK_COMPONENT_MAP;
      const hasMobile = trackId in MOBILE_TRACK_COMPONENT_MAP;
      
      expect(hasDesktop).toBe(true);
      expect(hasMobile).toBe(true);
    });
  });
});
