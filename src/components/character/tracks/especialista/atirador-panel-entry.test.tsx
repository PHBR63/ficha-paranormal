import { act, render, renderHook, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AtiradorDeElitePanel } from './AtiradorDeElitePanel';
import { ATIRADOR_ABILITIES, useAtiradorDeEliteTrack } from './useAtiradorDeEliteTrack';

const device = vi.hoisted(() => ({ mobile: false }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => device.mobile }));

beforeEach(() => { device.mobile = false; });

describe.each([false, true])('painel do Atirador de Elite no mobile=%s', mobile => {
  it('encaminha Disparo Letal ao ataque, sem ativação ou cobrança local', () => {
    device.mobile = mobile;
    const onPEChange = vi.fn();
    const onActivateEffect = vi.fn();
    render(<AtiradorDeElitePanel classTrack="atirador-elite" nex={40} peCurrent={5}
      intellect={2} onPEChange={onPEChange} onActivateEffect={onActivateEffect}
      isEffectActive={() => true} />);

    expect(screen.getByText('Ao Mirar')).toBeInTheDocument();
    expect(screen.getByText(/O servidor confirma o custo e o histórico/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Usar' })).not.toBeInTheDocument();
    expect(screen.queryByText('ATIVO')).not.toBeInTheDocument();
    expect(onPEChange).not.toHaveBeenCalled();
    expect(onActivateEffect).not.toHaveBeenCalled();
  });
});

it('recusa a ativação antiga sem alterar PE ou efeitos', async () => {
  const onPEChange = vi.fn();
  const onActivateEffect = vi.fn();
  const { result } = renderHook(() => useAtiradorDeEliteTrack({
    classTrack: 'atirador-elite', nex: 40, peCurrent: 5, intellect: 2,
    onPEChange, onActivateEffect,
  }));
  const lethalShot = ATIRADOR_ABILITIES.find(ability => ability.id === 'disparo-letal')!;
  await act(async () => { await result.current.handleUseAbility(lethalShot); });
  expect(onPEChange).not.toHaveBeenCalled();
  expect(onActivateEffect).not.toHaveBeenCalled();
});
