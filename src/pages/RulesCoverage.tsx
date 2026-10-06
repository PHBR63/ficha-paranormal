import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BASE_RULES_NOTICES, BASE_RULES_PROFILE } from '@/lib/rules/base-profile';
import { BASE_RULE_COVERAGE, RULE_COVERAGE_LABELS, filterBaseRuleCoverage } from '@/lib/rules/base-rule-coverage';

/** Consulta de capacidades sem dados pessoais, mutações de ficha ou promessas de automação integral. */
export default function RulesCoverage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [domain, setDomain] = useState('all');
  const results = filterBaseRuleCoverage(query, status, domain);
  return <main className="container max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
    <Button asChild variant="outline"><Link to="/dashboard">Voltar ao painel</Link></Button>
    <header className="space-y-2"><h1 className="font-display text-2xl">Regras e mecânicas — {BASE_RULES_PROFILE.label}</h1>
      <p className="text-sm text-muted-foreground">Mapa por famílias mecânicas. Mostra o que o sistema resolve e o que ainda precisa de conferência. Não é certificação de todas as regras ou combinações dos livros.</p></header>
    <section aria-label="Regras adotadas pela mesa" className="border rounded-lg p-4 space-y-2">
      <h2 className="font-medium">Perfil atual da mesa</h2>
      {BASE_RULES_NOTICES.map(notice => <p key={notice} className="text-sm">{notice}</p>)}
    </section>
    <section aria-label="Filtros de regras" className="grid gap-3 sm:grid-cols-3">
      <div><Label htmlFor="rule-search">Buscar regra</Label><Input id="rule-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ex.: Sangrando, ritual, NEX..." /></div>
      <div><Label htmlFor="rule-status">Situação</Label><select id="rule-status" className="w-full h-10 bg-background border rounded-md px-2 text-sm" value={status} onChange={event => setStatus(event.target.value)}>
        <option value="all">Todas</option>{Object.entries(RULE_COVERAGE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></div>
      <div><Label htmlFor="rule-domain">Área</Label><select id="rule-domain" className="w-full h-10 bg-background border rounded-md px-2 text-sm" value={domain} onChange={event => setDomain(event.target.value)}>
        <option value="all">Todas</option>{[...new Set(BASE_RULE_COVERAGE.map(rule => rule.domain))].map(value => <option key={value}>{value}</option>)}
      </select></div>
    </section>
    <p role="status" className="text-sm">{results.length} de {BASE_RULE_COVERAGE.length} famílias mecânicas. As contagens não representam percentual de regras aplicadas.</p>
    {!results.length && <p>Nenhuma regra encontrada para estes filtros.</p>}
    <div className="space-y-3">{results.map(rule => <article key={rule.id} className="border rounded-lg p-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2"><h2 className="font-medium">{rule.title}</h2><Badge variant="outline">{RULE_COVERAGE_LABELS[rule.status]}</Badge></div>
      <p className="text-xs text-muted-foreground">{rule.domain} · Livro Base v1.3, páginas impressas {rule.pages.join(', ')}.</p>
      <p className="text-sm">{rule.behavior}</p>
      <details><summary className="text-sm cursor-pointer text-primary">O que precisa de conferência</summary><p className="text-sm mt-2">{rule.remaining}</p></details>
    </article>)}</div>
  </main>;
}
