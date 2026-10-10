import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CharacterEditModal } from '../CharacterEditModal';
import { uploadCharacterPhoto } from '@/services/character-photo-service';

vi.mock('@/services/character-photo-service', () => ({ uploadCharacterPhoto: vi.fn() }));
// Bloqueia acesso real à rede ao comparar a regressão com o caminho antigo.
vi.mock('@/integrations/supabase/client', () => ({ supabase: { storage: {
  from: () => ({ upload: async () => ({ error: new Error('QA envio negado') }) }),
} } }));
vi.mock('@/components/ui/image-uploader', () => ({
  ImageUploader: ({ onChange }: { onChange: (url: string, file: File) => void }) =>
    <button onClick={() => onChange('data:image/png;base64,cWE=', new File(['qa'], 'qa.png', { type: 'image/png' }))}>Selecionar foto QA</button>,
}));
const character = {
  id: '93aa0000-0000-4000-8000-000000000002', name: 'QA', player_name: null,
  background: null, notes: null, class: 'Combatente', origin: 'Vítima', nex: 5,
  agility: 1, strength: 1, intellect: 1, presence: 1, vigor: 1,
  skills: { reflexos: 5, vontade: 5 }, defense: 10, photo_url: null,
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(uploadCharacterPhoto).mockResolvedValue('https://example.test/qa.png');
});
describe('Confirmação, ajuda e treinamento na edição da ficha', () => {
  it('abre a ajuda de campo por clique, sem exigir hover', () => {
    render(<CharacterEditModal open onClose={vi.fn()} character={character} onSave={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ajuda sobre Foto' }));
    expect(screen.getByRole('dialog', { name: 'Ajuda: Foto' })).toBeVisible();
  });
  it('explica INT e PRE sem atribuir os máximos ao atributo errado', () => {
    render(<CharacterEditModal open initialTab="attributes" onClose={vi.fn()} character={character} onSave={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ajuda sobre INTELECTO' }));
    expect(screen.getByRole('dialog', { name: 'Ajuda: INTELECTO' })).toHaveTextContent('número de perícias treinadas');
    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Ajuda: INTELECTO' }), { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Ajuda sobre PRESENÇA' }));
    expect(screen.getByRole('dialog', { name: 'Ajuda: PRESENÇA' })).toHaveTextContent('Afeta PE máximo');
    expect(screen.getByRole('dialog', { name: 'Ajuda: PRESENÇA' })).toHaveTextContent('SAN máxima depende da classe');
  });
  it('um clique no checkbox muda o treinamento somente uma vez', () => {
    render(<CharacterEditModal open initialTab="skills" onClose={vi.fn()} character={character} onSave={vi.fn()} />);
    const checkbox = screen.getByRole('checkbox', { name: 'Treinar Ciências' });
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });
  it('falha de upload mantém o rascunho aberto e não salva como sucesso', async () => {
    vi.mocked(uploadCharacterPhoto).mockRejectedValue(new Error('Não foi possível enviar a foto.'));
    const onSave = vi.fn(), onClose = vi.fn();
    render(<CharacterEditModal open onClose={onClose} character={character} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar foto QA' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Suas alterações continuam abertas');
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
  it('só fecha depois de a gravação da ficha terminar', async () => {
    let finish!: () => void;
    const onSave = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    const onClose = vi.fn();
    render(<CharacterEditModal open onClose={onClose} character={character} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar foto QA' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ photo_url: 'https://example.test/qa.png' })));
    expect(onClose).not.toHaveBeenCalled();
    finish();
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });
  it('falha ao gravar permite repetir sem enviar a mesma mídia novamente', async () => {
    const onSave = vi.fn().mockRejectedValueOnce(new Error('Não foi possível salvar.')).mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<CharacterEditModal open onClose={onClose} character={character} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar foto QA' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(uploadCharacterPhoto).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledTimes(2);
  });
});

describe('Atributos de zero a cinco', () => {
  it('permite reduzir de 1 para 0, bloqueia valor negativo e salva zero', async () => {
    const save = vi.fn();
    render(<CharacterEditModal open initialTab="attributes" onClose={vi.fn()} character={character} onSave={save} />);
    const decrease = screen.getByRole('button', { name: 'Diminuir AGILIDADE' });
    expect(decrease).toBeEnabled();
    fireEvent.click(decrease);
    expect(decrease).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0][0].agility).toBe(0);
  });
  it('reabre atributo zero sem convertê-lo em 1 e respeita o máximo 5', () => {
    render(<CharacterEditModal open initialTab="attributes" onClose={vi.fn()} character={{ ...character, agility: 0, strength: 5 }} onSave={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Diminuir AGILIDADE' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Aumentar AGILIDADE' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Aumentar FORÇA' })).toBeDisabled();
  });
});
