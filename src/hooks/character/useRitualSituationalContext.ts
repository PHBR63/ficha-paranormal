import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { confirmRitualKnowledge, getRitualSituationalContext, type RitualKnowledgeReview } from '@/services/ritual-situational-service';

/** Reconsulta a cada abertura. Conferências incertas mantêm UUID e dados para recuperação idempotente. */
export function useRitualSituationalContext(characterId: string, ritualId: string | undefined, open: boolean) {
  const queryClient = useQueryClient();
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<string>();
  const request = useRef<{ id: string; review: RitualKnowledgeReview } | null>(null);
  const busy = useRef(false);
  const currentSelection = useRef('');
  currentSelection.current = `${characterId}:${ritualId}:${open}`;
  const key = ['ritual-situational', characterId, ritualId];
  const query = useQuery({ queryKey: key, queryFn: () => getRitualSituationalContext(characterId, ritualId!), enabled: open && !!characterId && !!ritualId, staleTime: 0, retry: false });
  useEffect(() => { request.current = null; setReviewError(undefined); }, [characterId, ritualId, open]);
  const review = async (value: RitualKnowledgeReview) => {
    if (busy.current || !ritualId) return false;
    busy.current = true; setReviewing(true); setReviewError(undefined);
    request.current ??= { id: crypto.randomUUID(), review: { ...value } };
    const selection = currentSelection.current;
    const sent = request.current;
    try {
      await confirmRitualKnowledge(characterId, ritualId, sent.id, sent.review);
      await queryClient.invalidateQueries({ queryKey: ['character-activity'] });
      if (currentSelection.current !== selection) return false;
      request.current = null;
      const refreshed = await query.refetch();
      if (refreshed.isError) {
        setReviewError('Conferência registrada, mas os requisitos não puderam ser atualizados. Feche e reabra o ritual.');
        return false;
      }
      return true;
    } catch (error) {
      if (currentSelection.current === selection) setReviewError(error instanceof Error ? error.message : 'A conferência não foi confirmada.'); return false;
    } finally { busy.current = false; setReviewing(false); }
  };
  return { context: query.data, loading: open && (query.isPending || query.isFetching), error: query.error instanceof Error ? query.error.message : undefined, review, reviewing, reviewError };
}
