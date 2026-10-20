import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMedicalStandardAction } from '@/hooks/character/useMedicalStandardAction';
import { activityClient, awaitActivityResponse } from '@/services/character-activity-service';

interface Props {
  campaignId: string;
  characterId: string;
  characterName: string;
}

interface PendingGrant { operationId: string; turnKey: string; sourceName: string }

/** Mestre confirma uma fonte de ação extra no turno atual, sem alterar a ficha. */
export function MedicalExtraActionGrant({ campaignId, characterId, characterName }: Props) {
  const queries = useQueryClient();
  const action = useMedicalStandardAction(characterId);
  const [sourceName, setSourceName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const pending = useRef<PendingGrant | null>(null);

  const confirm = async () => {
    if (busy || (!pending.current && (!action.data?.tracked || !action.data.eligible || !action.data.turnKey))) return;
    const name = sourceName.trim();
    if (!pending.current && (name.length < 3 || name.length > 120)) {
      setError('Informe a habilidade ou efeito que concedeu a ação extra.'); return;
    }
    const command = pending.current ?? { operationId: crypto.randomUUID(), turnKey: action.data!.turnKey!, sourceName: name };
    pending.current = command; setBusy(true); setError(''); setConfirmed(false);
    try {
      const response = await awaitActivityResponse(activityClient.rpc('confirm_character_medical_extra_action', {
        p_operation_id: command.operationId, p_campaign_id: campaignId, p_character_id: characterId,
        p_expected_turn_key: command.turnKey, p_source_name: command.sourceName,
      }));
      if (response.error) {
        if (['22023', '40001', '42501', '23505'].includes(response.error.code)) pending.current = null;
        throw new Error(response.error.code === '40001' ? 'O turno mudou. Atualize o combate antes de confirmar.'
          : response.error.code === '42501' ? 'Somente o mestre desta campanha pode confirmar a ação extra.'
          : response.error.code === '22023' ? 'Informe uma fonte válida para a ação extra.'
          : 'Confirmação não recebida. Recupere a mesma tentativa antes de repetir.');
      }
      if (!response.data || response.data.operation_id !== command.operationId) throw new Error('Recibo não confirmado. Recupere a mesma tentativa.');
      pending.current = null; setConfirmed(true); setSourceName('');
      await queries.invalidateQueries({ queryKey: ['medical-action-status', characterId] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Confirmação incerta. Recupere a mesma tentativa.');
    } finally { setBusy(false); }
  };

  return <section className="rounded-lg border border-emerald-500/25 bg-emerald-950/20 p-3 space-y-2 text-sm" aria-label="Ação padrão médica extra">
    <p className="font-medium">Ação padrão médica · {characterName}</p>
    {action.error && <p role="alert">Não foi possível consultar as ações do turno.</p>}
    {action.data?.tracked && <p>{action.data.spent} usada(s) de {1 + action.data.extra} disponível(is) neste turno.
      {' '}Este contador cobre Paramédico e Equipe de Trauma; confira outras ações com a mesa.</p>}
    <Input aria-label="Fonte da ação padrão extra" placeholder="Habilidade ou efeito aprovado" maxLength={120}
      value={sourceName} disabled={busy || !!pending.current}
      onChange={event => setSourceName(event.target.value)} />
    <Button type="button" variant="outline" size="sm" disabled={busy || (!pending.current && (!action.data?.eligible || !action.data?.tracked))}
      onClick={() => void confirm()}>{pending.current ? 'Recuperar confirmação' : 'Confirmar ação extra'}</Button>
    {confirmed && <p role="status" className="text-emerald-200">Ação extra confirmada no servidor para este turno.</p>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
  </section>;
}
