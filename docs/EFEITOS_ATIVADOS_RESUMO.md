# Habilidades ativadas no resumo da ficha

## 1. Resumo
O resumo do SUE passa a receber os IDs ativados pelos painéis, além das alternâncias manuais. Surto de Adrenalina usa o ID canônico do catálogo; o adapter reconhece o ID antigo sem reescrever registros.

## 2. Arquivos e responsabilidades
- `useOperacoesEspeciaisTrack.ts` e `useActivatedEffects.ts`: emitem o ID canônico de Surto, com duração e escolha existentes.
- `useBonusSummaryFromSUE.ts`: recebe `activatedEffectIds` e `activeConditionalBonuses`; reúne IDs sem duplicação para `useUnifiedEffects`, retornando o resumo e seus efeitos.
- `CharacterSheet.tsx` e `MobileCharacterSheet.tsx`: passam IDs do hook de ativação ao resumo; o mobile também passa os IDs ao motor usado pelo painel SUE.
- `track-effects-adapter.ts`: recebe IDs ativos e compara habilidades; reconhece o ID legado de Surto somente para essa habilidade.
- `activated-track-summary.test.ts`: testa confirmação real do hook até o catálogo, ID legado e atualização do resumo ao encerrar uma ativação.
- `operacoes-confirmation.test.tsx`: conserva os oito cenários de confirmação com a expectativa canônica de Surto.

## 3. Fluxo
Painel → confirmação de PE existente → hook de ativação → IDs ativos → resumo/motor SUE → catálogo → efeito visível. As alternâncias continuam disponíveis. Custo, efeito e uso por rodada ainda são operações separadas.

## 4. Patch
```ts
activatedEffectIds: [...new Set([...activeConditionalBonuses, ...activatedEffectIds])]
```
Surto passa a usar `track-surto-de-adrenalina`; `track-surto-adrenalina` é aceito no adapter por compatibilidade.

## 5. Limites e dados
Sem migration, mudança de custo ou dependência. Não reescreve históricos nem registros existentes. Ativações confirmadas agora podem revelar bônus antes ausentes na tela; a operação de custo/efeito continua sem recibo atômico. Uso por rodada permanece local e não é certificado após recarga. A carga atual de efeitos conserva apenas duração de cena/concentração; efeitos de rodada ainda precisam de contexto persistido no próximo lote.

## 6. Testar
Confirmar Ataque Extra e Surto; verificar efeito ativo no resumo desktop/mobile e gasto no histórico. Recusar PE: nenhuma ativação. Encerrar ativação: remover efeito do resumo, preservando alternâncias manuais. Conferir ID legado sem alterar registros.
