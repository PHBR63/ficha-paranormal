# ✅ Plano de Correção: Poderes Ativáveis em Testes de Perícia (CONCLUÍDO)

**Status**: ✅ Implementado com sucesso em 26/01/2026

## Resumo das Correções

### Bug 1: Rolagem Automática Prematura ✅

**Problema**: O modal rolava dados automaticamente ~150-200ms após abrir, antes do jogador escolher poderes.

**Solução Implementada**:
- Adicionada fase `'preparing'` ao estado do modal
- Removido `useEffect` de auto-roll
- Painel de poderes aparece ANTES da área de dados na fase preparing
- Novo botão "ROLAR DADOS" que inicia a rolagem manualmente
- Implementado em ambos `DiceRollModal.tsx` (desktop) e `MobileDiceRollModal.tsx` (mobile)

### Bug 2: Bônus de Poderes de Origem Não Aplicados ✅

**Problema**: Poderes de origem retornavam `skillBonusChange: 0` no default case.

**Solução Implementada** em `calculatePowerActivationEffects`:
- `saber-e-poder` → +5 (Acadêmico)
- `desbravador` → +5 (Trabalhador Rural)
- `110-porcento` → +5 (Atleta)
- `faro-para-pistas` → +5 (Investigador)
- `processo-otimizado` → +5 (Executivo)
- `motor-de-busca` → swapToSkill: 'tecnologia' (T.I.)
- `impostor` → swapToSkill: 'enganacao' (Trambiqueiro)
- `magnum-opus` → +5 (Artista)
- `acalentar-aliado` → allyBonus: 10 (Religioso)
- `espirito-civico` → allyBonus: 2 (Servidor Público)
- `posicao-de-combate` → movementBonus: 1 (Mercenário)
- `patrulha-iniciativa` → attributeSwap: 'presence' (Policial)
- `o-crime-compensa` → narrativo (Criminoso)
- `tracos-do-outro-lado` → passivo (Cultista Arrependido)
- `vislumbres-do-passado` → narrativo (Amnésico)
- `cicatrizes-vontade` → swapToSkill: 'vontade' (Vítima)
- `ingrediente-secreto` → narrativo (Chef)

## Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/dice/DiceRollModal.tsx` | Fase 'preparing', botão "Rolar Dados", layout reorganizado |
| `src/components/character/mobile/MobileDiceRollModal.tsx` | Paridade com desktop, import do Button |
| `src/lib/class-powers/activatable-powers-bridge.ts` | +17 cases de poderes de origem, tipos expandidos |

## Testes Validados

```
✅ 23/23 testes passando em activatable-origins.vitest.ts
```

## Fluxo Atual

```text
┌─────────────────────────────────────────────┐
│  FASE 1: PREPARAÇÃO                         │
│  • Modal abre                               │
│  • Painel de poderes no topo                │
│  • Jogador seleciona poderes                │
│  • Botão "ROLAR DADOS"                      │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│  FASE 2: ROLAGEM                            │
│  • Animação de dados                        │
│  • PE descontado automaticamente            │
│  • Bônus aplicados no resultado             │
│  • Botão "Rolar Novamente" disponível       │
└─────────────────────────────────────────────┘
```
