import { supabase } from '@/integrations/supabase/client';

const PHOTO_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'image/gif': 'gif', 'video/webm': 'webm',
};
const MAX_PHOTO_SIZE = 100 * 1024 * 1024;

/** Envia a mídia na pasta da conta atual e retorna a URL somente após confirmação. */
export async function uploadCharacterPhoto(characterId: string, file: File): Promise<string> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(characterId)) {
    throw new Error('Ficha inválida para enviar a foto.');
  }
  const extension = PHOTO_EXTENSIONS[file.type];
  if (!extension || file.size === 0 || file.size > MAX_PHOTO_SIZE) {
    throw new Error('Use JPG, PNG, WebP, GIF ou WebM de até 100 MB.');
  }
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || user.is_anonymous) {
    throw new Error('Entre novamente na sua conta para enviar a foto.');
  }
  // A política de escrita compara auth.uid() com a primeira pasta do caminho.
  const path = `${user.id}/${characterId}-${crypto.randomUUID()}.${extension}`;
  const bucket = supabase.storage.from('character-avatars');
  const { error } = await bucket.upload(path, file, { upsert: false });
  if (error) throw new Error('Não foi possível enviar a foto. Tente novamente.');
  const { data: { publicUrl } } = bucket.getPublicUrl(path);
  if (!publicUrl) throw new Error('O envio foi confirmado, mas a URL da foto não foi recebida.');
  return publicUrl;
}
