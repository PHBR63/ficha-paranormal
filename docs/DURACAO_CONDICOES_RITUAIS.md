# Duração de condições de ritual

O teste publicado encontrou Vulnerável da Eletrocussão salvo com prazo nulo, apesar de o catálogo informar `duration: 1`. Os dois wizards só convertiam a palavra `rodada`. Livro Base v1.3 e catálogo existente: uma rodada, sem mudança da regra de resistência.

| Arquivo | Papel e comunicação |
|---|---|
| `src/lib/rituals/ritual-condition-duration.ts` | Recebe a condição de `RitualEffect` e retorna rodadas ou prazo manual e seu rótulo. Usa somente o tipo legado; não grava dados. |
| `src/components/character/RitualEffectWizard.tsx` | Desktop usa o auxiliar no aviso e em `ActiveCondition.turnsRemaining`, enviado pelo callback de aplicação existente. |
| `src/components/character/mobile/MobileRitualEffectWizard.tsx` | Mobile aplica a mesma conversão e apresentação. |
| `src/lib/rituals/__tests__/ritual-condition-duration.vitest.ts` | Confere números, `rodada` com quantidade e os prazos manuais existentes. |
| `src/components/character/__tests__/RitualEffectWizardRules.test.tsx` | Exercita Eletrocussão nos dois wizards reais, conferindo aviso de uma rodada e payload com `turnsRemaining: 1`. |
| `docs/DURACAO_CONDICOES_RITUAIS.md` | Registra falha, escopo e validação. |

Fluxo: catálogo → adaptador legado → wizard → auxiliar de duração → callback → serviço de aplicação → RPC existente → condições/histórico da ficha alvo → recibo. Cena, sustentado, permanente e prazo ausente permanecem com controle manual. Nenhuma dependência, migration ou alteração de permissão.

Não reescreve condições antigas, que podem ter sido editadas pelo mestre. Para testar, conjure Eletrocussão em alvo de QA, confira a resistência/resultado manual, aplique as condições e verifique `Vulnerável: 1 rodada` na tela e `turnsRemaining: 1` no servidor. Recarregue a ficha e confirme a duração. Os testes de resistência continuam cobrindo a anulação de condições após sucesso.
