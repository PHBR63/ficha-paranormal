import { useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useCharacterActivity } from '@/hooks/character/useCharacterActivity';
import { describeCharacterActivity } from '@/lib/character-activity-presentation';
import type { ActivityCategory, ActivityPeriod } from '@/types/character-activity';

interface CharacterActivityPanelProps { characterId: string; characterName: string; compact?: boolean }
const categories: Array<{ value: ActivityCategory | ''; label: string }> = [
  { value: '', label: 'Todos' }, { value: 'roll', label: 'Rolagens' }, { value: 'ritual', label: 'Rituais' }, { value: 'application', label: 'Efeitos' },
];
/** Painel compartilhado entre desktop/mobile; a ficha recebida delimita todos os dados. */
export function CharacterActivityPanel({ characterId, characterName, compact = false }: CharacterActivityPanelProps) {
  const activity = useCharacterActivity(characterId);
  const [visibilityBusy, setVisibilityBusy] = useState(false);
  const [hasUnassignedLegacy] = useState(() => {
    try { return Boolean(localStorage.getItem('roll_history')); } catch { return false; }
  });
  const changeVisibility = async (hide: boolean) => {
    setVisibilityBusy(true);
    try { if (hide) await activity.hideHistory(); else await activity.restoreHistory(); }
    catch { /* O hook mantém o erro visível e nunca confirma uma alteração negada. */ }
    finally { setVisibilityBusy(false); }
  };
  return <Sheet>
    <SheetTrigger asChild><Button variant="outline" size={compact ? 'icon' : 'sm'} aria-label={`Histórico salvo de ${characterName}`}><History className="h-4 w-4" />{!compact && <span className="ml-2">Histórico salvo</span>}</Button></SheetTrigger>
    <SheetContent className="flex w-full flex-col sm:max-w-lg">
      <SheetHeader><SheetTitle>Histórico de {characterName}</SheetTitle></SheetHeader>
      <p className="text-sm text-muted-foreground">Registros por ficha confirmados pelo servidor. Ocultar não exclui eventos; você pode recuperá-los.</p>
      {hasUnassignedLegacy && <p role="status" className="rounded border p-3 text-sm">Há um histórico antigo neste navegador sem identificação de ficha. Ele foi preservado separadamente e não será misturado aos registros desta ficha.</p>}
      <label className="text-sm">Tipo de registro
        <select className="mt-1 w-full rounded border bg-background p-2" value={activity.category ?? ''} onChange={event => activity.setCategory(event.target.value as ActivityCategory || undefined)}>
          {categories.map(category => <option key={category.value} value={category.value}>{category.label}</option>)}
        </select>
      </label>
      <label className="text-sm">Período
        <select className="mt-1 w-full rounded border bg-background p-2" value={activity.period} onChange={event => activity.setPeriod(event.target.value as ActivityPeriod)}>
          <option value="all">Todo o histórico</option><option value="7d">Últimos 7 dias</option><option value="30d">Últimos 30 dias</option>
        </select>
      </label>
      <label className="text-sm">Sessão da campanha
        <select className="mt-1 w-full rounded border bg-background p-2" value={activity.session ? `${activity.session.campaign_version}:${activity.session.campaign_id}:${activity.session.id}` : ''} disabled={activity.sessionsLoading} onChange={event => activity.setSession(activity.sessions.find(session => `${session.campaign_version}:${session.campaign_id}:${session.id}` === event.target.value))}>
          <option value="">Todas as sessões e registros fora de campanha</option>
          {activity.sessions.map(session => <option key={`${session.campaign_version}:${session.campaign_id}:${session.id}`} value={`${session.campaign_version}:${session.campaign_id}:${session.id}`}>{session.campaign_name} · Sessão {session.session_number}{session.title ? `: ${session.title}` : ''} · {new Date(session.session_date).toLocaleDateString('pt-BR')}</option>)}
        </select>
      </label>
      {activity.sessionsError && <p role="alert" className="text-sm text-destructive">Não foi possível carregar as sessões. Atualize o histórico para tentar novamente.</p>}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => { void activity.refresh().catch(() => {}); }} disabled={activity.isFetching}><RefreshCw className="mr-1 h-4 w-4" />Atualizar</Button>
        <Button variant="outline" size="sm" onClick={() => { void changeVisibility(true); }} disabled={visibilityBusy}>Ocultar registros atuais</Button>
        <Button variant="outline" size="sm" onClick={() => { void changeVisibility(false); }} disabled={visibilityBusy}>Recuperar ocultos</Button>
      </div>
      {(activity.isError || activity.saveError) && <div role="alert" className="rounded border border-destructive p-3 text-sm">
        {activity.saveError ?? (activity.error instanceof Error ? activity.error.message : 'O histórico não foi carregado. Tente novamente.')}
      </div>}
      {activity.pendingRolls.length > 0 && <div role="status" className="rounded border p-3 text-sm">
        {activity.pendingRolls.length} rolagem(ns) aguardando gravação nesta ficha. Os resultados não serão sorteados novamente.
        <Button className="mt-2" size="sm" onClick={() => { void activity.recoverPending(); }} disabled={activity.recovering}>Tentar salvar novamente</Button>
      </div>}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        {activity.isLoading && <p role="status">Carregando histórico…</p>}
        {!activity.isLoading && !activity.isError && activity.events.length === 0 && <p className="text-sm text-muted-foreground">Nenhum registro visível. Recupere os ocultos ou faça uma nova rolagem.</p>}
        {activity.events.map(event => <article key={event.id} className="rounded border p-3">
          <p className="break-words text-sm">{describeCharacterActivity(event)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString('pt-BR')} · {event.status === 'pending' ? 'Conjuração registrada; confira os eventos de aplicação' : 'Confirmado pelo servidor'}</p>
        </article>)}
        {activity.hasNextPage && <Button variant="outline" className="w-full" onClick={() => { void activity.fetchNextPage(); }} disabled={activity.isFetchingNextPage}>Carregar mais</Button>}
      </div>
    </SheetContent>
  </Sheet>;
}
