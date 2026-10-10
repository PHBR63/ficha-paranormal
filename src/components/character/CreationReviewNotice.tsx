import { Button } from "@/components/ui/button";

interface Props {
  issues?: string[];
  onReview: () => void;
}

/** Exibe lacunas da criação antiga sem assumir escolhas que o jogador não registrou. */
export function CreationReviewNotice({ issues = [], onReview }: Props) {
  if (!issues.length) return null;
  return (
    <section
      role="status"
      className="ordo-panel mb-4 p-4 border-warning/40 space-y-3"
    >
      <h2 className="font-display text-lg text-warning">
        REVISÃO DA CRIAÇÃO NECESSÁRIA
      </h2>
      <p className="text-sm">
        Os cálculos recuperáveis foram conferidos. Há escolhas que precisam ser
        revisadas; os registros anteriores foram preservados.
      </p>
      <details>
        <summary className="min-h-11 cursor-pointer py-3 text-sm">
          Ver {issues.length} pendência(s)
        </summary>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          {issues.map((issue, index) => (
            <li key={`${issue}-${index}`}>{issue}</li>
          ))}
        </ul>
      </details>
      <Button variant="outline" className="min-h-11" onClick={onReview}>
        Revisar dados da ficha
      </Button>
    </section>
  );
}
