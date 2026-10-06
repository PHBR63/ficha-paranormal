import { supabase } from '@/integrations/supabase/client';

/**
 * Debita o custo validado do saldo conhecido e retorna o PE confirmado pelo banco.
 * O filtro pelo saldo anterior impede sobrescrever um gasto de outra aba.
 * Falhas, linhas não autorizadas e conflitos nunca são tratados como sucesso.
 */
export async function debitCharacterPE(characterId: string, expectedPE: number, cost: number): Promise<number> {
  if (!characterId || !Number.isSafeInteger(expectedPE) || expectedPE < 0
    || !Number.isSafeInteger(cost) || cost < 0) {
    throw new Error('Saldo ou custo de PE inválido. Recarregue a ficha.');
  }
  if (cost > expectedPE) throw new Error('PE insuficiente para conjurar este ritual.');
  const nextPE = expectedPE - cost;

  let result;
  try {
    result = await supabase.from('characters')
      .update({ pe_current: nextPE })
      .eq('id', characterId)
      .eq('pe_current', expectedPE)
      .select('pe_current')
      .maybeSingle();
  } catch {
    throw new Error('Não foi possível confirmar o gasto de PE. Confira sua conexão e recarregue a ficha.');
  }
  if (result.error) throw new Error('O gasto de PE não foi salvo. Confira sua conexão e o acesso à ficha.');
  if (!result.data) throw new Error('O saldo de PE mudou ou a atualização não foi autorizada. Recarregue a ficha antes de tentar novamente.');
  if (result.data.pe_current !== nextPE) throw new Error('O banco não confirmou o saldo esperado. Recarregue a ficha.');
  return result.data.pe_current;
}
