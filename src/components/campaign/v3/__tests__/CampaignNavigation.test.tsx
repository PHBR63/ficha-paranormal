import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CampaignNavigation } from '../CampaignNavigation';

afterEach(cleanup);

describe('navegação acessível de campanha', () => {
  it('nomeia todas as abas do mestre e descreve seu objetivo', () => {
    render(<CampaignNavigation activeTab="panel" onTabChange={vi.fn()} isMaster />);
    for (const label of ['Painel', 'Chat', 'Mapa', 'Recursos', 'Mestre']) {
      expect(screen.getByRole('tab', { name: label }).getAttribute('title')).toBeTruthy();
    }
  });
  it('não apresenta ferramentas do mestre para jogador', () => {
    render(<CampaignNavigation activeTab="panel" onTabChange={vi.fn()} />);
    expect(screen.queryByRole('tab', { name: 'Mestre' })).toBeNull();
    expect(screen.getAllByRole('tab')).toHaveLength(4);
  });
});
