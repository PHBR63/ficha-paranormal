import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CampaignHeader } from '../CampaignHeader';
import { CampaignStatusBar } from '../CampaignStatusBar';

afterEach(cleanup);

describe('nomes acessíveis das ações de campanha em telas estreitas', () => {
  it('identifica voltar e configurações sem depender de ícones ou tooltips', () => {
    const settings = vi.fn();
    render(<MemoryRouter><TooltipProvider>
      <CampaignHeader campaignName="Teste" isMaster onOpenSettings={settings} />
    </TooltipProvider></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Voltar para campanhas' }).getAttribute('title')).toBe('Voltar para campanhas');
    const button = screen.getByRole('button', { name: 'Abrir configurações da campanha' });
    expect(button.getAttribute('title')).toBe('Abrir configurações da campanha');
    fireEvent.click(button);
    expect(settings).toHaveBeenCalledTimes(1);
  });
  it.each([false, true])('identifica ações do rodapé com sessão ativa=%s e preserva seus callbacks', active => {
    const dice = vi.fn(); const notes = vi.fn(); const start = vi.fn(); const end = vi.fn();
    render(<TooltipProvider>
      <CampaignStatusBar members={[]} presenceMap={{}} isMaster hasActiveSession={active}
        onOpenDice={dice} onOpenNotes={notes} onStartSession={start} onEndSession={end} />
    </TooltipProvider>);
    for (const label of ['Rolar dados', 'Abrir notas rápidas', active ? 'Encerrar sessão atual' : 'Iniciar nova sessão']) {
      const button = screen.getByRole('button', { name: label });
      expect(button.getAttribute('aria-label')).toBe(label);
      expect(button.getAttribute('title')).toBe(label);
      fireEvent.click(button);
    }
    expect(dice).toHaveBeenCalledTimes(1); expect(notes).toHaveBeenCalledTimes(1);
    expect(active ? end : start).toHaveBeenCalledTimes(1);
    expect(active ? start : end).not.toHaveBeenCalled();
  });
});
