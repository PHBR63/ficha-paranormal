/**
 * BulkDamageModal - Modal para aplicar dano em múltiplos personagens
 * 
 * Permite selecionar alvos e aplicar dano em área.
 * 
 * @module components/campaign/v3/master/BulkDamageModal
 */

import { memo, useState, useCallback, useRef } from 'react';
import {
  Sword as SwordIcon,
} from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { BulkDamageResult } from '@/lib/campaign-bulk-damage';
import {
  CAMPAIGN_DAMAGE_TYPES,
  CampaignBulkDamageError,
  clearPendingCampaignBulkDamage,
  confirmCampaignBulkDamage,
  restorePendingCampaignBulkDamage,
  savePendingCampaignBulkDamage,
  type CampaignBulkDamageReceipt,
  type CampaignBulkDamageRequest,
  type CampaignBulkDamageTarget,
  type CampaignDamageType,
} from '@/services/campaign-bulk-damage-service';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';

interface BulkDamageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: CampaignMemberV2[];
  onApplyDamage: (characterIds: string[], damage: number) => Promise<BulkDamageResult>;
  canApply: boolean;
  serverCampaignId?: string;
  isUpdating?: boolean;
}

export const BulkDamageModal = memo(function BulkDamageModal({
  open,
  onOpenChange,
  members,
  onApplyDamage,
  canApply,
  serverCampaignId,
  isUpdating,
}: BulkDamageModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [damage, setDamage] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [resultUncertain, setResultUncertain] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const applyingRef = useRef(false);

  // Filtra apenas jogadores com personagem
  const playersWithChar = members.filter(m => m.characters && m.role !== 'master');

  // Toggle seleção
  const toggleSelect = useCallback((charId: string) => {
    if (completedIds.includes(charId)) return;
    setFeedback(null);
    setSelectedIds(prev =>
      prev.includes(charId)
        ? prev.filter(id => id !== charId)
        : [...prev, charId]
    );
  }, [completedIds]);

  // Selecionar todos
  const selectAll = useCallback(() => {
    const availableIds = playersWithChar.map(m => m.characters!.id).filter(id => !completedIds.includes(id));
    setSelectedIds(prev => prev.length === availableIds.length ? [] : availableIds);
    setFeedback(null);
  }, [playersWithChar, completedIds]);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (applyingRef.current) return;
    if (!nextOpen) {
      setSelectedIds([]);
      setCompletedIds([]);
      setDamage('');
      setFeedback(null);
      setResultUncertain(false);
    }
    onOpenChange(nextOpen);
  }, [onOpenChange]);

  // Aplicar dano
  const handleApply = useCallback(async () => {
    const dmg = Number(damage);
    if (applyingRef.current || !canApply || !Number.isSafeInteger(dmg) || dmg <= 0 || dmg > 1_000_000 || selectedIds.length === 0) return;

    applyingRef.current = true;
    setIsApplying(true);
    setFeedback(null);
    try {
      const result = await onApplyDamage(selectedIds, dmg);
      if (result.failedIds.length === 0) {
        setSelectedIds([]);
        setCompletedIds([]);
        setDamage('');
        onOpenChange(false);
        return;
      }
      setCompletedIds(previous => [...new Set([...previous, ...result.appliedIds])]);
      setSelectedIds(result.failedIds);
      setFeedback(`${result.appliedIds.length} ficha(s) confirmada(s); ${result.failedIds.length} sem confirmação. Confira os PV e tente novamente apenas nas fichas selecionadas.`);
    } catch {
      setFeedback('Não foi possível confirmar quais fichas foram ajustadas. Confira os PV antes de tentar novamente.');
      setResultUncertain(true);
    } finally {
      applyingRef.current = false;
      setIsApplying(false);
    }
  }, [damage, selectedIds, canApply, onApplyDamage, onOpenChange]);

  if (serverCampaignId) return <ServerBulkDamageModal key={serverCampaignId} open={open} onOpenChange={onOpenChange}
    campaignId={serverCampaignId} members={members} />;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SwordIcon weight="duotone" className="h-5 w-5 text-destructive" />
            Ajuste manual de dano em área
          </DialogTitle>
          <DialogDescription>
            Use apenas quando o dano final for igual para todos os alvos. Confira RD, resistências e reações de cada ficha antes de confirmar; para valores diferentes, ajuste ficha a ficha.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Valor de dano */}
          <div className="space-y-2">
            <Label htmlFor="damage-value" className="text-sm">Dano final por alvo</Label>
            <Input
              id="damage-value"
              type="number"
              min="1"
              max="1000000"
              step="1"
              value={damage}
              onChange={(e) => { setDamage(e.target.value); setFeedback(null); }}
              placeholder="Ex: 15"
              className="text-lg font-mono"
              autoFocus
            />
          </div>

          {/* Seleção de alvos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Alvos</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px]"
                onClick={selectAll}
              >
                {selectedIds.length === playersWithChar.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </Button>
            </div>

            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {playersWithChar.map((member) => {
                const char = member.characters!;
                const isSelected = selectedIds.includes(char.id);
                const isCompleted = completedIds.includes(char.id);
                return (
                  <label
                    key={char.id}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors',
                      isSelected ? 'bg-destructive/10 border border-destructive/30' : 'hover:bg-muted',
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isCompleted || isApplying}
                      onCheckedChange={() => toggleSelect(char.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{char.name}</p>
                      {isCompleted && <p className="text-[10px] text-success">Ajuste confirmado</p>}
                      <p className="text-[10px] text-muted-foreground">
                        PV {char.hp_current}/{char.hp_max}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {!canApply && <p role="alert" className="text-sm text-destructive">Ajuste indisponível: não há conexão de alteração de PV para esta campanha.</p>}
        {feedback && <p role="alert" className="text-sm text-destructive">{feedback}</p>}

        <DialogFooter>
          <Button variant="outline" disabled={isApplying} onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleApply}
            disabled={!canApply || resultUncertain || isApplying || isUpdating || selectedIds.length === 0 || !Number.isSafeInteger(Number(damage)) || Number(damage) <= 0 || Number(damage) > 1_000_000}
          >
            {isApplying ? 'Confirmando ajustes…' : `Aplicar Dano (${selectedIds.length} alvos)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default BulkDamageModal;

type TargetDraft = {
  damage: string;
  damageType: CampaignDamageType | '';
  resistedDamage: string;
  damageReduction: string;
  immuneDamage: boolean;
  vulnerableDamage: boolean;
};

const emptyTarget = (): TargetDraft => ({
  damage: '', damageType: '', resistedDamage: '0', damageReduction: '0', immuneDamage: false, vulnerableDamage: false,
});

/** Confirma uma operação atômica v2; em resposta incerta repete o mesmo UUID e payload. */
function ServerBulkDamageModal({ open, onOpenChange, campaignId, members }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  members: CampaignMemberV2[];
}) {
  const [source, setSource] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, TargetDraft>>({});
  const [defaultDamage, setDefaultDamage] = useState('');
  const [defaultType, setDefaultType] = useState<CampaignDamageType | ''>('');
  const [pendingRequest, setPendingRequest] = useState<CampaignBulkDamageRequest | null>(() => {
    try { return restorePendingCampaignBulkDamage(campaignId); } catch { return null; }
  });
  const [storageError] = useState<string | null>(() => {
    try { restorePendingCampaignBulkDamage(campaignId); return null; }
    catch (cause) { return cause instanceof Error ? cause.message : 'Operação pendente inválida.'; }
  });
  const [receipt, setReceipt] = useState<CampaignBulkDamageReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const availableMembers = members.filter(member => member.characters);

  const reset = useCallback(() => {
    setSource(''); setSelectedIds([]); setDrafts({}); setDefaultDamage(''); setDefaultType('');
    setPendingRequest(null); setReceipt(null); setError(null);
  }, []);
  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (busyRef.current || ((pendingRequest || storageError) && !receipt)) return;
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }, [onOpenChange, pendingRequest, storageError, receipt, reset]);

  const toggleTarget = useCallback((characterId: string) => {
    setSelectedIds(previous => previous.includes(characterId)
      ? previous.filter(id => id !== characterId)
      : previous.length >= 30 ? previous : [...previous, characterId]);
    setDrafts(previous => ({ ...previous, [characterId]: previous[characterId] ?? {
      ...emptyTarget(), damage: defaultDamage, damageType: defaultType,
    } }));
    setError(null);
  }, [defaultDamage, defaultType]);

  const updateDraft = useCallback((characterId: string, change: Partial<TargetDraft>) => {
    setDrafts(previous => ({ ...previous, [characterId]: { ...(previous[characterId] ?? emptyTarget()), ...change } }));
    setError(null);
  }, []);

  const applyDefaults = useCallback(() => {
    setDrafts(previous => {
      const next = { ...previous };
      selectedIds.forEach(id => { next[id] = { ...(next[id] ?? emptyTarget()), damage: defaultDamage, damageType: defaultType }; });
      return next;
    });
  }, [selectedIds, defaultDamage, defaultType]);

  const validTargets = selectedIds.length > 0 && selectedIds.every(id => {
    const member = availableMembers.find(entry => entry.characters?.id === id);
    const draft = drafts[id];
    const gross = Number(draft?.damage);
    const resisted = Number(draft?.resistedDamage);
    const rd = Number(draft?.damageReduction);
    return !!member?.characters && !!draft && !!draft.damageType
      && Number.isSafeInteger(gross) && gross > 0 && gross <= 1_000_000
      && Number.isSafeInteger(resisted) && resisted >= 0 && resisted <= gross
      && Number.isSafeInteger(rd) && rd >= 0 && rd <= 1_000_000;
  });

  const handleConfirm = useCallback(async () => {
    if (busyRef.current || receipt || storageError) return;
    let request = pendingRequest;
    if (!request) {
      if (!validTargets || !source.trim() || source.trim().length > 150) return;
      const targets: CampaignBulkDamageTarget[] = selectedIds.map(id => {
        const character = availableMembers.find(member => member.characters?.id === id)!.characters!;
        const draft = drafts[id];
        return {
          characterId: id, damage: Number(draft.damage), damageType: draft.damageType as CampaignDamageType,
          resistedDamage: Number(draft.resistedDamage), damageReduction: Number(draft.damageReduction),
          immuneDamage: draft.immuneDamage, vulnerableDamage: draft.vulnerableDamage, expectedHp: character.hp_current,
        };
      });
      request = { operationId: crypto.randomUUID(), campaignId, source: source.trim(), targets };
      try { savePendingCampaignBulkDamage(request); }
      catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Não foi possível guardar a operação. O dano não foi enviado.');
        return;
      }
      setPendingRequest(request);
    }
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const saved = await confirmCampaignBulkDamage(request);
      clearPendingCampaignBulkDamage(campaignId);
      setReceipt(saved);
      setPendingRequest(null);
    } catch (cause) {
      if (cause instanceof CampaignBulkDamageError && cause.confirmedRejected) {
        clearPendingCampaignBulkDamage(campaignId);
        setPendingRequest(null);
      }
      setError(cause instanceof Error ? cause.message : 'Confirmação incerta. Recupere a mesma operação antes de tentar outra.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [receipt, pendingRequest, storageError, validTargets, source, selectedIds, availableMembers, drafts, campaignId]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dano em área · campanha sincronizada</DialogTitle>
          <DialogDescription>
            O mestre declara dano bruto, tipo, resistência, RD e imunidade de cada alvo. O servidor aplica todos os alvos juntos e registra o resultado em cada ficha. Confira os efeitos situacionais com a mesa.
          </DialogDescription>
        </DialogHeader>

        {receipt ? (
          <div role="status" className="space-y-2 rounded-lg border border-success/50 p-3 text-sm">
            <p className="font-semibold">Dano confirmado em {receipt.targets.length} ficha(s).</p>
            {receipt.targets.map(target => <p key={target.characterId}>
              {availableMembers.find(member => member.characters?.id === target.characterId)?.characters?.name ?? 'Ficha vinculada'}:
              {' '}{target.hpBefore} → {target.hpAfter} PV (dano final {target.finalDamage}, PV temporários usados {target.temporaryHPUsed}).
            </p>)}
          </div>
        ) : (
          <fieldset disabled={busy || !!pendingRequest || !!storageError} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="bulk-damage-source">Origem do dano</Label>
              <Input id="bulk-damage-source" maxLength={150} value={source}
                onChange={event => setSource(event.target.value)} placeholder="Ex.: explosão na sala" />
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div className="space-y-1">
                <Label htmlFor="bulk-default-damage">Dano bruto padrão</Label>
                <Input id="bulk-default-damage" type="number" min={1} max={1_000_000} step={1}
                  value={defaultDamage} onChange={event => setDefaultDamage(event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bulk-default-type">Tipo padrão</Label>
                <select id="bulk-default-type" value={defaultType}
                  onChange={event => setDefaultType(event.target.value as CampaignDamageType | '')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
                  <option value="">Selecione</option>
                  {CAMPAIGN_DAMAGE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <Button type="button" variant="outline" disabled={!selectedIds.length || !defaultDamage || !defaultType} onClick={applyDefaults}>
                Preencher alvos
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Os valores padrão são copiados ao selecionar um alvo ou clicar em Preencher alvos. Revise cada ficha antes de confirmar.</p>
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
              {availableMembers.map(member => {
                const character = member.characters!;
                const selected = selectedIds.includes(character.id);
                const draft = drafts[character.id] ?? emptyTarget();
                const gross = Number(draft.damage);
                const resisted = Number(draft.resistedDamage);
                const rd = Number(draft.damageReduction);
                const afterResistance = Math.max(0, gross - resisted);
                const afterVulnerability = draft.vulnerableDamage ? afterResistance * 2 : afterResistance;
                const final = draft.immuneDamage ? 0 : Math.max(0, afterVulnerability - rd);
                return <div key={character.id} className="rounded-lg border border-border p-3 space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Checkbox checked={selected} onCheckedChange={() => toggleTarget(character.id)}
                      disabled={!selected && selectedIds.length >= 30} />
                    {character.name} · PV {character.hp_current}/{character.hp_max}
                  </label>
                  {selected && <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="space-y-1">
                      <Label htmlFor={`gross-${character.id}`}>Dano bruto</Label>
                      <Input id={`gross-${character.id}`} type="number" min={1} max={1_000_000} step={1}
                        value={draft.damage} onChange={event => updateDraft(character.id, { damage: event.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`type-${character.id}`}>Tipo</Label>
                      <select id={`type-${character.id}`} value={draft.damageType}
                        onChange={event => updateDraft(character.id, { damageType: event.target.value as CampaignDamageType | '' })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
                        <option value="">Selecione</option>
                        {CAMPAIGN_DAMAGE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`resisted-${character.id}`}>Dano resistido</Label>
                      <Input id={`resisted-${character.id}`} type="number" min={0} max={1_000_000} step={1}
                        value={draft.resistedDamage} onChange={event => updateDraft(character.id, { resistedDamage: event.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`rd-${character.id}`}>RD</Label>
                      <Input id={`rd-${character.id}`} type="number" min={0} max={1_000_000} step={1}
                        value={draft.damageReduction} onChange={event => updateDraft(character.id, { damageReduction: event.target.value })} />
                    </div>
                    <label className="col-span-2 flex items-center gap-2 text-sm">
                      <Checkbox checked={draft.immuneDamage}
                        onCheckedChange={checked => updateDraft(character.id, {
                          immuneDamage: checked === true, ...(checked === true ? { vulnerableDamage: false } : {}),
                        })} />
                      Imune ao dano
                    </label>
                    <label className="col-span-2 flex items-center gap-2 text-sm">
                      <Checkbox checked={draft.vulnerableDamage}
                        onCheckedChange={checked => updateDraft(character.id, {
                          vulnerableDamage: checked === true, ...(checked === true ? { immuneDamage: false } : {}),
                        })} />
                      Vulnerável ao tipo de dano
                    </label>
                    <p className="col-span-2 self-center text-sm text-muted-foreground">
                      {draft.vulnerableDamage ? `Após resistência: ${afterResistance}; vulnerabilidade ×2; ` : ''}
                      Dano final após RD: {Number.isFinite(final) ? final : '—'}
                    </p>
                  </div>}
                </div>;
              })}
            </div>
            {availableMembers.length > 30 && <p className="text-xs text-muted-foreground">Selecione até 30 alvos por operação.</p>}
          </fieldset>
        )}

        {(error || storageError) && <p role="alert" className="text-sm text-destructive">{error || storageError}</p>}
        {pendingRequest && !busy && <p role="status" className="text-sm text-warning">
          A confirmação está incerta. Os dados foram congelados; recupere esta mesma operação antes de fazer qualquer novo ajuste.
        </p>}
        <DialogFooter>
          <Button variant="outline" disabled={busy || !!pendingRequest || !!storageError} onClick={() => handleOpenChange(false)}>
            {receipt ? 'Fechar' : 'Cancelar'}
          </Button>
          {!receipt && <Button variant="destructive" disabled={busy || !!storageError || (!pendingRequest && (!validTargets || !source.trim()))}
            onClick={() => void handleConfirm()}>
            {busy ? 'Confirmando no servidor…' : pendingRequest ? 'Recuperar confirmação' : `Confirmar dano (${selectedIds.length} alvos)`}
          </Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
