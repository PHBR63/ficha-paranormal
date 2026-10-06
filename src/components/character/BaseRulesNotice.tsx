import { Link } from 'react-router-dom';

/** Acesso comum à cobertura, sem atribuir automação às regras ainda manuais. */
export function BaseRulesNotice() {
  return <p className="text-xs text-muted-foreground p-3 border rounded-lg">
    Livro Base v1.3 · Há efeitos parciais e manuais. <Link className="underline text-primary" to="/rules">Conferir regras e mecânicas</Link>
  </p>;
}
