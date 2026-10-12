/** Expõe benefícios situacionais da arma sem aplicá-los fora da situação exigida. */
export function WeaponModificationNotes({ effects }: { effects?: string[] }) {
  if (!effects?.length) return null;
  return <section aria-label="Efeitos situacionais das modificações" className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 text-sm text-foreground">
    <p className="font-semibold">Modificações — requisitos e efeitos</p>
    {[...new Set(effects)].map(effect => <p key={effect}>{effect}</p>)}
    <p className="text-xs text-muted-foreground">Use o painel “Ocultação e saque de itens” na ficha para confirmar Discreta e Tática no servidor. Confira a situação com o mestre: este quadro não resolve camuflagem, Silenciador ou penalidades de rajada.</p>
  </section>;
}
