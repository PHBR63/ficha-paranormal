import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { usePETurnBudget } from '@/hooks/character/usePETurnBudget';
import { useItemSituationalAction } from '@/hooks/useItemSituationalAction';
import { activityClient, activityFailure } from '@/services/character-activity-service';

interface ReviewableEffect {
  id: string;
  targetId: string;
  targetName: string;
  effect: string;
  createdAt: string;
}
interface ReviewOptions { canReview: boolean; events: ReviewableEffect[] }

/** Rejeita resposta incompleta: um aviso de sucesso precisa vir do servidor. */
function parseReviewOptions(value: unknown): ReviewOptions {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Revisão de Resgate indisponível.');
  const data = value as Record<string, unknown>;
  if (typeof data.canReview !== 'boolean' || !Array.isArray(data.events)) throw new Error('Revisão de Resgate incompleta.');
  const events = data.events.map(value => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Efeito incompleto.');
    const entry = value as Record<string, unknown>;
    if (typeof entry.id !== 'string' || typeof entry.targetId !== 'string'
      || typeof entry.targetName !== 'string' || typeof entry.effect !== 'string'
      || typeof entry.createdAt !== 'string') throw new Error('Efeito incompleto.');
    return entry as unknown as ReviewableEffect;
  });
  return { canReview: data.canReview, events };
}

interface Props { characterId: string; onRefetch?: () => unknown | Promise<unknown> }

/** Mestre atribui uma cura ou remoção já registrada ao médico, sem reaplicar o efeito. */
export function ResgateOtherSourceReview({ characterId, onRefetch }: Props) {
  const [effectId, setEffectId] = useState('');
  const [masterConfirmed, setMasterConfirmed] = useState(false);
  const budget = usePETurnBudget(characterId);
  const options = useQuery({
    queryKey: ['resgate-review-options', characterId], enabled: !!characterId,
    queryFn: async () => {
      const { data, error } = await activityClient.rpc('get_character_resgate_review_options', { p_character_id: characterId });
      if (error) throw activityFailure('Não foi possível conferir outras fontes de Resgate.', error);
      return parseReviewOptions(data);
    }, refetchOnReconnect: true, refetchOnWindowFocus: true, refetchInterval: 5000,
  });
  const action = useItemSituationalAction(characterId, onRefetch ?? (() => undefined), 'confirm_character_resgate_review');
  const refreshOptions = options.refetch;
  const selected = options.data?.events.find(event => event.id === effectId);
  const ready = !!options.data?.canReview && !!selected && masterConfirmed && !!budget.data?.key
    && budget.data.mode === 'combat' && budget.data.actorId === characterId && !action.busy && !action.uncertain;

  useEffect(() => {
    if (!action.receipt) return;
    setEffectId(''); setMasterConfirmed(false);
    void refreshOptions();
  }, [action.receipt, refreshOptions]);

  if (options.isLoading || (!options.data?.canReview && !options.error)) return null;
  return <div className="rounded border border-emerald-500/30 bg-background/40 p-3 space-y-2 text-sm">
    <strong className="text-emerald-200">Outras fontes de Resgate · confirmação do mestre</strong>
    <p className="text-xs text-muted-foreground">Selecione uma cura efetiva ou remoção de condição já salva na ficha do aliado neste turno. A confirmação concede +5 Defesa a ambos; não cura novamente nem gasta PE.</p>
    {options.error && <p role="alert" className="text-destructive">Não foi possível conferir os efeitos. Atualize e tente novamente.</p>}
    {options.data?.canReview && <>
      <select aria-label="Efeito para Resgate" className="w-full rounded border border-border bg-background p-2 text-foreground"
        value={effectId} disabled={action.busy || action.uncertain} onChange={event => { setEffectId(event.target.value); setMasterConfirmed(false); }}>
        <option value="">Selecione o efeito confirmado</option>
        {options.data.events.map(event => <option key={event.id} value={event.id}>
          {event.targetName} · {event.effect}
        </option>)}
      </select>
      {options.data.events.length === 0 && <p role="status" className="text-xs">Nenhuma cura ou remoção elegível neste turno. Eventos antigos e outras cenas exigem resolução manual.</p>}
      <label className="flex items-start gap-2"><Checkbox checked={masterConfirmed} disabled={!selected || action.busy || action.uncertain}
        onCheckedChange={value => setMasterConfirmed(value === true)} />Confirmei como mestre que o médico causou esse efeito no aliado.</label>
      {action.error && <p role="alert" className="text-destructive">{action.error}</p>}
      {action.receipt && <p role="status" className="text-emerald-200">Defesa de Resgate confirmada no servidor e registrada nas duas fichas.</p>}
      {action.uncertain && <Button type="button" variant="outline" disabled={action.busy}
        onClick={() => void action.recover()}>Recuperar confirmação</Button>}
      <Button type="button" disabled={!ready} onClick={() => {
        if (!selected || !budget.data?.key) return;
        void action.confirm({ sourceEventId: selected.id, targetId: selected.targetId,
          expectedTurnKey: budget.data.key, masterConfirmed: true });
      }}>Conceder +5 Defesa</Button>
    </>}
  </div>;
}
