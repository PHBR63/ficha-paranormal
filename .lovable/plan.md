
# Correção Visual: Labels do Discurso Motivador

## Resumo

Atualizar os textos dos botões da habilidade **Discurso Motivador** (Negociador, NEX 40%) para refletir corretamente a mecânica oficial de dados:
- Botão 1: `+2 (4 PE)` → `+1d20 (4 PE)`
- Botão 2: `+2 (8 PE)` → `+2d20 (8 PE)`

## Contexto

A mecânica já está correta no código (o hook `useNegociadorTrack` usa `diceBonus: 1` e `diceBonus: 2`), mas os labels dos botões exibem incorretamente "+2" em ambos os casos. Esta é uma correção puramente visual.

## Arquivo a Modificar

### `src/components/character/tracks/especialista/NegociadorPanel.tsx`

**Alterações:**

1. **Versão Mobile** (linhas 164 e 172):
   - Linha 164: `label: '4 PE'` → `label: '+1d20 (4 PE)'`
   - Linha 172: `label: '8 PE'` → `label: '+2d20 (8 PE)'`

2. **Versão Desktop** (linhas 191 e 201):
   - Linha 191: `+2 (4 PE)` → `+1d20 (4 PE)`
   - Linha 201: `+2 (8 PE)` → `+2d20 (8 PE)`

## Resultado Esperado

```text
┌─────────────────────────────────────────────────────┐
│  💬 Discurso Motivador              NEX 40%        │
│  Você e aliados em alcance curto ganham bônus...   │
│                                                     │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │  +1d20 (4 PE)    │  │  +2d20 (8 PE)    │        │
│  └──────────────────┘  └──────────────────┘        │
└─────────────────────────────────────────────────────┘
```

## Escopo

- Alteração apenas de strings de texto
- Sem impacto na lógica ou mecânica
- 4 linhas modificadas no total
