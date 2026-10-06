import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EffectDurationNotice } from '../EffectDurationNotice';
import type { EffectOrigin } from '@/types/effect-duration';

const origin: EffectOrigin = { applicationId: 'application', castEventId: 'cast', ritualId: 'ritual', ritualName: 'Ritual QA',
  campaignId: 'campaign', campaignVersion: 'v2', sceneNumber: 3, expiresAtSceneEnd: true };
describe('Prazo e origem visíveis', () => {
  it('legado sem duração não é tratado como cena', () => {
    render(<EffectDurationNotice effect={{}} />);
    expect(screen.getByText(/Duração manual/)).toBeVisible();
  });
  it('cena sem origem exige remoção manual', () => {
    render(<EffectDurationNotice effect={{ duration: 'cena' }} />);
    expect(screen.getByText(/sem expiração automática confirmada/)).toBeVisible();
  });
  it('mostra cena e ritual somente quando há origem e expiração confirmadas', () => {
    render(<EffectDurationNotice effect={{ duration: 'cena', effectOrigin: origin }} />);
    expect(screen.getByText('Até encerrar a cena 3 da campanha de origem. Origem: Ritual QA.')).toBeVisible();
  });
  it('condição crítica com origem continua manual', () => {
    render(<EffectDurationNotice effect={{ duration: 'cena', effectOrigin: { ...origin, expiresAtSceneEnd: false } }} />);
    expect(screen.getByText(/remoção manual/)).toBeVisible();
  });
  it('sustentação não promete expiração por cena', () => {
    render(<EffectDurationNotice effect={{ duration: 'sustentado', effectOrigin: origin }} />);
    expect(screen.getByText(/confira manutenção e encerramento/)).toBeVisible();
  });
});
