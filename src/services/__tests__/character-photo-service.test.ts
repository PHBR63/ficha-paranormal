import { beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadCharacterPhoto } from '../character-photo-service';

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), upload: vi.fn(), getPublicUrl: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  auth: { getUser: mocks.getUser },
  storage: { from: () => ({ upload: mocks.upload, getPublicUrl: mocks.getPublicUrl }) },
} }));
const characterId = '93aa0000-0000-4000-8000-000000000002';
const ownerId = '93aa0000-0000-4000-8000-000000000003';
const file = () => new File(['qa'], 'nome-original.png', { type: 'image/png' });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: ownerId, is_anonymous: false } }, error: null });
  mocks.upload.mockResolvedValue({ error: null });
  mocks.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.test/qa.png' } });
});
describe('Envio confirmado de foto', () => {
  it('usa a pasta da conta exigida pela política, sem sobrescrever arquivos', async () => {
    expect(await uploadCharacterPhoto(characterId, file())).toBe('https://example.test/qa.png');
    expect(mocks.upload).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`^${ownerId}/${characterId}-.+\\.png$`)), expect.any(File), { upsert: false });
  });
  it('propaga falha de envio sem produzir URL de sucesso', async () => {
    mocks.upload.mockResolvedValue({ error: { message: 'RLS negou' } });
    await expect(uploadCharacterPhoto(characterId, file())).rejects.toThrow('Não foi possível enviar');
    expect(mocks.getPublicUrl).not.toHaveBeenCalled();
  });
  it.each([null, { id: ownerId, is_anonymous: true }])('recusa ausência de conta real: %s', async user => {
    mocks.getUser.mockResolvedValue({ data: { user }, error: null });
    await expect(uploadCharacterPhoto(characterId, file())).rejects.toThrow('Entre novamente');
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it('recusa erro de autenticação antes de enviar o arquivo', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: new Error('rede') });
    await expect(uploadCharacterPhoto(characterId, file())).rejects.toThrow('Entre novamente');
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it('valida a ficha e o formato sem chamar a integração', async () => {
    await expect(uploadCharacterPhoto('../outra-pasta', file())).rejects.toThrow('Ficha inválida');
    await expect(uploadCharacterPhoto(characterId, new File(['qa'], 'qa.svg', { type: 'image/svg+xml' }))).rejects.toThrow('Use JPG');
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
  it('recusa arquivo vazio ou maior que o limite já usado pelo seletor', async () => {
    await expect(uploadCharacterPhoto(characterId, new File([], 'vazio.png', { type: 'image/png' }))).rejects.toThrow('100 MB');
    const large = file();
    Object.defineProperty(large, 'size', { value: 100 * 1024 * 1024 + 1 });
    await expect(uploadCharacterPhoto(characterId, large)).rejects.toThrow('100 MB');
    expect(mocks.upload).not.toHaveBeenCalled();
  });
});
