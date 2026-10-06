import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { CampaignCombatController } from '@/hooks/campaign/useCampaignCombat';
import { loadCampaignSceneHistory } from '@/services/campaign-combat-service';

interface CampaignScenePanelProps {
  campaignId: string;
  combat: CampaignCombatController;
  isMaster?: boolean;
}

/** Cena confirmada e recibos paginados; o mestre confirma o encerramento no servidor. */
export function CampaignScenePanel({ campaignId, combat, isMaster = false }: CampaignScenePanelProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submittedLocally, setSubmittedLocally] = useState(false);
  const [confirmation, setConfirmation] = useState({ sceneNumber: combat.sceneNumber, endCombat: combat.state.active });
  const [historyOpen, setHistoryOpen] = useState(false);
  const history = useInfiniteQuery({
    queryKey: ['campaign-scene-history', campaignId, combat.sceneNumber],
    queryFn: ({ pageParam }) => loadCampaignSceneHistory(campaignId, pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: page => page.nextCursor,
    enabled: historyOpen && !!campaignId,
  });
  if (combat.loading) return null;
  const confirmationChanged = confirmation.sceneNumber !== combat.sceneNumber || confirmation.endCombat !== combat.state.active;
  const title = confirmation.endCombat ? `Encerrar combate e cena ${confirmation.sceneNumber}?` : `Encerrar a cena ${confirmation.sceneNumber}?`;

  /** Conserva a autoria local até fechar o diálogo, incluindo a animação de saída. */
  const confirmSceneEnd = () => {
    setSubmittedLocally(true);
    void combat.endScene(confirmation.endCombat, confirmation.sceneNumber).then(saved => {
      if (saved) setConfirmOpen(false);
      else setSubmittedLocally(false);
    });
  };
  return (
    <section aria-label="Cena de regras" className="space-y-2 rounded-lg border p-3 min-w-0">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <p role="status" className="text-sm font-medium">{combat.error ? 'Cena aguardando conferência' : `Cena ${combat.sceneNumber}`}</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setHistoryOpen(true)}>Histórico de cenas</Button>
          {isMaster && !combat.sceneEndPending && <Button size="sm" disabled={combat.saving || !!combat.error} onClick={() => { setSubmittedLocally(false); setConfirmation({ sceneNumber: combat.sceneNumber, endCombat: combat.state.active }); setConfirmOpen(true); }}>{combat.state.active ? 'Encerrar combate e cena' : 'Encerrar cena'}</Button>}
          {isMaster && combat.sceneEndPending && <Button size="sm" disabled={combat.saving} onClick={() => { void combat.endScene(combat.state.active); }}>Conferir encerramento pendente</Button>}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Encerrar o combate também encerra a cena. Sem combate, o mestre encerra a cena manualmente.</p>
      <p className="text-xs text-muted-foreground">Efeitos até o fim da cena, limites por cena e contadores críticos ainda exigem conferência manual.</p>
      {combat.lastSceneEndedAt && <p className="text-xs">Último encerramento confirmado: {new Date(combat.lastSceneEndedAt).toLocaleString('pt-BR')}.</p>}
      {combat.error && <p role="alert" className="text-sm text-destructive">{combat.error}</p>}
      <Dialog open={confirmOpen} onOpenChange={open => { if (!combat.saving) setConfirmOpen(open); }}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>A próxima cena será aberta e o encerramento ficará salvo no servidor. Confira manualmente efeitos, limites de uso e contadores desta cena.</DialogDescription></DialogHeader>
          {combat.error && <p role="alert">{combat.error}</p>}
          {confirmationChanged && !submittedLocally && !combat.saving && !combat.sceneEndPending && <p role="alert">A cena ou o combate mudou em outra aba. Cancele e confira antes de abrir uma nova confirmação.</p>}
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" disabled={combat.saving} onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button disabled={combat.saving || submittedLocally || confirmationChanged} onClick={confirmSceneEnd}>{combat.saving || submittedLocally ? 'Confirmando no servidor...' : 'Confirmar encerramento'}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>Histórico de cenas</DialogTitle><DialogDescription>Encerramentos confirmados desta campanha, do mais recente ao mais antigo.</DialogDescription></DialogHeader>
          {history.isPending && <p role="status">Carregando histórico...</p>}
          {history.isError && <div role="alert"><p>Não foi possível carregar o histórico de cenas.</p><Button disabled={history.isFetching} onClick={() => { void history.refetch(); }}>Tentar carregar histórico novamente</Button></div>}
          {!history.isPending && !history.isError && !history.data?.pages[0]?.entries.length && <p>Nenhuma cena encerrada ainda.</p>}
          <ol className="space-y-3">{history.data?.pages.flatMap(page => page.entries).map(entry => <li key={entry.operation_id} className="rounded border p-3 text-sm"><p className="font-medium">Cena {entry.scene_number} encerrada {entry.ended_combat ? 'com o combate' : 'manualmente'}</p><time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleString('pt-BR')}</time></li>)}</ol>
          {history.hasNextPage && <Button disabled={history.isFetching} onClick={() => { void history.fetchNextPage(); }}>{history.isFetchingNextPage ? 'Carregando...' : 'Carregar cenas anteriores'}</Button>}
        </DialogContent>
      </Dialog>
    </section>
  );
}
