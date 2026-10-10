import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { RitualKnowledgeReview } from '@/services/ritual-situational-service';
import type { RitualSituationalContext, RitualSituationalDeclaration } from '@/lib/rituals/situational-requirements';

export interface RitualSituationalProps {
  context?: RitualSituationalContext;
  loading?: boolean;
  error?: string;
  onReview?: (review: RitualKnowledgeReview) => Promise<boolean>;
  reviewing?: boolean;
  reviewError?: string;
}
interface Props extends RitualSituationalProps {
  value: RitualSituationalDeclaration;
  onChange: (value: RitualSituationalDeclaration) => void;
  disabled: boolean;
}

/** Requisitos compartilhados entre desktop/mobile; editar não debita recursos nem executa ações. */
export function RitualSituationalForm({ context, loading, error, value, onChange, disabled, onReview, reviewing, reviewError }: Props) {
  const [showReview, setShowReview] = useState(false);
  const [source, setSource] = useState<RitualKnowledgeReview['source']>('memorized');
  const [knownBeforeBlade, setKnownBeforeBlade] = useState(false);
  const [note, setNote] = useState('');
  if (loading) return <p role="status" className="text-sm">Conferindo fonte e requisitos do ritual no servidor…</p>;
  if (error) return <p role="alert" className="text-sm text-destructive">{error} Feche e reabra a conjuração para conferir novamente.</p>;
  if (!context) return null;
  const knowledgePending = context.bladeKnowledge === 'unverified';
  return <div className="space-y-3 min-w-0 text-sm">
    {context.source === 'unverified' && <p role="alert">A fonte antiga deste ritual não foi registrada. O mestre precisa conferir se está memorizado ou no Grimório Ritualístico.</p>}
    {context.source === 'grimoire' && <fieldset disabled={disabled} className="rounded-lg border p-3 space-y-2 min-w-0">
      <legend className="px-1 font-medium">Grimório Ritualístico · Livro Base, p.35</legend>
      <p>Fonte: grimório. Primeiro empunhe o item e gaste uma ação completa folheando-o para relembrar este ritual. Depois, use a execução própria do ritual; a consulta não custa PE.</p>
      {!context.grimoireItems.length ? <p role="alert" className="text-destructive">O Grimório Ritualístico não está no inventário. Grimório Vivo não substitui esse item.</p> : <>
        <label className="block space-y-1"><span>Grimório utilizado</span><select className="w-full min-h-11 rounded-md border bg-background p-2" value={value.grimoireItemId || ''} onChange={event => onChange({ ...value, grimoireItemId: event.target.value, grimoireHeld: false, grimoireRead: false })}>
          <option value="">Selecione o grimório</option>{context.grimoireItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label>
        <label className="min-h-11 flex items-center gap-3"><input type="checkbox" checked={value.grimoireHeld === true} onChange={event => onChange({ ...value, grimoireHeld: event.target.checked })} /><span>Estou empunhando o Grimório Ritualístico.</span></label>
        <label className="min-h-11 flex items-center gap-3"><input type="checkbox" checked={value.grimoireRead === true} onChange={event => onChange({ ...value, grimoireRead: event.target.checked })} /><span>Já gastei uma ação completa folheando o grimório para esta conjuração.</span></label>
        <p className="text-xs text-muted-foreground">A mesa confere mãos e ações disponíveis. Estas declarações serão registradas; o sistema não concede uma ação extra.</p>
      </>}
    </fieldset>}
    {context.bladeEligible && <fieldset disabled={disabled} className="rounded-lg border p-3 space-y-2">
      <legend className="px-1 font-medium">Lâmina Maldita · Livro Base, p.35</legend>
      <p>O mestre confirmou que este ritual já era conhecido antes de receber Lâmina Maldita.</p>
      <label className="min-h-11 flex items-center gap-3"><input type="checkbox" checked={value.bladeMovement === true} onChange={event => onChange({ ...value, bladeMovement: event.target.checked })} /><span>Gastar +1 PE para conjurar como ação de movimento.</span></label>
    </fieldset>}
    {knowledgePending && <p role="status">A opção de movimento exige confirmação do mestre de que Amaldiçoar Arma já era conhecido antes de receber Lâmina Maldita. A execução padrão continua disponível.</p>}
    {context.canReview && onReview && <>
      <Button variant="outline" className="min-h-11 w-full whitespace-normal" disabled={disabled || reviewing} onClick={() => { setSource(context.source === 'grimoire' ? 'grimoire' : 'memorized'); setKnownBeforeBlade(context.bladeKnowledge === 'confirmed'); setShowReview(!showReview); }}>Conferência do mestre: fonte e conhecimento anterior</Button>
      {showReview && <fieldset disabled={disabled || reviewing} className="border rounded-lg p-3 space-y-3">
        <legend>Conferência histórica do mestre</legend>
        <label className="block space-y-1"><span>Fonte conferida do ritual</span><select className="w-full min-h-11 rounded-md border bg-background p-2" value={source} onChange={event => setSource(event.target.value as RitualKnowledgeReview['source'])}><option value="memorized">Memorizado</option><option value="grimoire">Grimório Ritualístico</option></select></label>
        {context.bladeAvailable && <label className="min-h-11 flex items-center gap-3"><input type="checkbox" checked={knownBeforeBlade} onChange={event => setKnownBeforeBlade(event.target.checked)} /><span>Confirmo que este Amaldiçoar Arma já era conhecido antes de receber Lâmina Maldita.</span></label>}
        <label className="block space-y-1"><span>Registro da conferência</span><textarea className="w-full min-h-20 rounded-md border bg-background p-2" maxLength={500} value={note} onChange={event => setNote(event.target.value)} /></label>
        <p className="text-xs text-muted-foreground">Informe a fonte consultada ou a decisão da mesa (10 a 500 caracteres). O registro fica no servidor, sem gasto de PE ou SAN.</p>
        <Button className="w-full min-h-11" disabled={note.trim().length < 10} onClick={async () => { if (await onReview({ source, knownBeforeBlade, note: note.trim() })) setShowReview(false); }}>Confirmar conferência histórica</Button>
      </fieldset>}
    </>}
    {!context.canReview && (context.source === 'unverified' || knowledgePending) && <p className="text-xs text-muted-foreground">Peça ao mestre de uma campanha vinculada à ficha para registrar a conferência. O jogador não pode liberar esse benefício por declaração própria.</p>}
    {reviewError && <p role="alert" className="text-destructive">{reviewError}</p>}
  </div>;
}
