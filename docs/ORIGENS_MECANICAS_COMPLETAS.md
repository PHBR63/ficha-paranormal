# Documentação Técnica - Origens do Livro Base v1.3

> Sistema Unificado de Efeitos (SUE) - Ordem Paranormal RPG
> Versão: 1.0.0 | Data: 2026-01-25

## Visão Geral

Este documento detalha a implementação mecânica de todas as **26 origens oficiais** do Livro Base v1.3.
Cada origem possui um poder único que é automaticamente aplicado pelo SUE.

---

## Classificação dos Poderes de Origem

### 🟢 Passivos Automáticos (12 origens)
Efeitos aplicados constantemente, sem ativação ou custo.

| Origem | Poder | Mecânica | Campo SUE |
|--------|-------|----------|-----------|
| **Agente de Saúde** | Técnica Medicinal | +INT em toda cura | `healingBonus: 'intellect'` |
| **Desgarrado** | Calejado | +1 PV por 5% NEX | `hpBonusPerNex: 1` |
| **Investigador** | Faro para Pistas | +5 Investigação | `skillBonus: { investigacao: 5 }` |
| **Lutador** | Mão Pesada | +2 dano corpo a corpo | `meleeDamageBonus: 2` |
| **Mercenário** | Posição de Combate | +5 Iniciativa | `initiativeBonus: 5` |
| **Militar** | Para Bellum | +2 dano armas de fogo | `rangedDamageBonus: 2` |
| **Operário** | Ferramenta de Trabalho | +1 ataque/dano/margem crítica (arma escolhida) | `attackBonus: 1`, `damageBonus: 1`, `criticalMarginBonus: 1` |
| **Policial** | Patrulha | +2 Defesa | `defenseBonus: 2` |
| **Servidor Público** | Espírito Cívico | +2 Fort/Ref/Von | `fortitudeBonus: 2`, `reflexosBonus: 2`, `vontadeBonus: 2` |
| **Teórico da Conspiração** | Eu Já Sabia | RD mental = INT | `damageResistance: { mental: INT }` |
| **Universitário** | Dedicação | +1 PE, +1 PE/NEX ímpar, limite PE +1 | `peBonus: 1`, `peBonusOddNex: 1`, `peLimitBonus: 1` |
| **Vítima** | Cicatrizes Psicológicas | +1 SAN por 5% NEX | `sanityBonusPerNex: 1` |

### 🟡 Ativáveis com Custo PE (7 origens)
Requerem ativação manual e gasto de PE.

| Origem | Poder | Custo | Mecânica | Duração |
|--------|-------|-------|----------|---------|
| **Acadêmico** | Saber é Poder | 2 PE | +5 em teste de INT | 1 teste |
| **Atleta** | 110% | 2 PE | +5 em FOR/AGI (exceto Luta/Pontaria) | 1 teste |
| **Executivo** | Processo Otimizado | 2 PE | +5 em teste estendido/documentos | 1 teste |
| **T.I.** | Motor de Busca | 2 PE | Substitui teste por Tecnologia | 1 teste |
| **Trabalhador Rural** | Desbravador | 2 PE | +5 Adestramento/Sobrevivência | 1 teste |
| **Magnata** | Patrocinador da Ordem | - | Limite crédito +1 categoria | Missão |
| **Trambiqueiro** | Impostor | 2 PE | Substitui teste por Enganação | 1 cena |

### 🔵 1x por Cena (4 origens)
Podem ser usados uma vez por cena.

| Origem | Poder | Efeito |
|--------|-------|--------|
| **Religioso** | Acalentar | +10 em teste de atributo de aliado adjacente |
| **Trambiqueiro** | Impostor | Substitui teste de perícia por Enganação (2 PE) |
| **Amnésico** | Vislumbres do Passado | Teste INT DT 10 para info + 1d4 PE temp |
| **Vítima** | Cicatrizes (toggle) | Substitui teste de atributo por Vontade |

### 🟣 Narrativos/Especiais (3 origens)
Efeitos principalmente narrativos ou com mecânicas complexas.

| Origem | Poder | Efeito |
|--------|-------|--------|
| **Artista** | Magnum Opus | 1x/missão: +5 PRE contra quem te reconhece |
| **Chef** | Ingrediente Secreto | Interlúdio: grupo recebe 2 pratos |
| **Criminoso** | O Crime Compensa | Fim da missão: 1 item não conta no limite |
| **Cultista Arrependido** | Traços do Outro Lado | Poder paranormal grátis, -50% SAN inicial |
| **Engenheiro** | Ferramenta Favorita | 1 item conta como categoria abaixo |

---

## Detalhamento por Origem

### 1. Acadêmico
**Poder:** Saber é Poder  
**Tipo:** Ativável (2 PE)  
**Descrição Oficial:** "Quando faz um teste usando Intelecto, você pode gastar 2 PE para receber +5 nesse teste."

**Implementação SUE:**
```typescript
'saber-e-poder': {
  mechanics: {
    attributeTestBonus: { attribute: 'intellect', bonus: 5 },
    specialEffects: ['Testes de INT: +5 por 2 PE (ativável)'],
  },
  isToggleable: true,
  costPE: 2,
}
```

**Integração:**
- Modal de teste de perícia exibe toggle quando atributo = Intelecto
- Painel de ativação na ficha permite pré-ativar
- Custo PE deduzido automaticamente ao usar

---

### 2. Agente de Saúde
**Poder:** Técnica Medicinal  
**Tipo:** Passivo  
**Descrição Oficial:** "Sempre que cura um personagem, você adiciona seu Intelecto no total de PV curados."

**Implementação SUE:**
```typescript
'tecnica-medicinal': {
  mechanics: {
    healingBonus: 'intellect', // Flag especial: soma INT a todas as curas
    specialEffects: ['Cura: +INT PV curados (passivo)'],
  },
}
```

**Integração:**
- Trilha Médico de Campo detecta esta flag
- Todas as rolagens de cura somam INT automaticamente
- Tooltip exibe "Técnica Medicinal: +X" (onde X = INT)

---

### 3. Amnésico
**Poder:** Vislumbres do Passado  
**Tipo:** 1x/Sessão (Ativável)  
**Descrição Oficial:** "Uma vez por sessão, você pode fazer um teste de Intelecto (DT 10) para reconhecer pessoas ou lugares familiares."

**Implementação SUE:**
```typescript
'vislumbres-do-passado': {
  mechanics: {
    specialEffects: ['1x/sessão: teste INT DT 10 para reconhecer, +1d4 PE temp'],
  },
  isToggleable: true,
}
```

**Nota:** Perícias do Amnésico são escolhidas pelo Mestre (não automáticas).

---

### 4. Artista
**Poder:** Magnum Opus  
**Tipo:** 1x/Missão (Narrativo)  
**Descrição Oficial:** "Você é famoso. Uma vez por missão, +5 em testes de Presença contra quem te reconhece."

**Implementação SUE:**
```typescript
'magnum-opus': {
  mechanics: {
    specialEffects: ['1x/missão: +5 em testes de PRE contra pessoa que reconhece você'],
  },
  isToggleable: true,
}
```

---

### 5. Atleta
**Poder:** 110%  
**Tipo:** Ativável (2 PE)  
**Descrição Oficial:** "Quando faz um teste de perícia usando FOR ou AGI (exceto Luta e Pontaria), +5 por 2 PE."

**Implementação SUE:**
```typescript
'110-porcento': {
  mechanics: {
    specialEffects: ['Testes de FOR/AGI (exceto Luta/Pontaria): +5 por 2 PE'],
  },
  isToggleable: true,
  costPE: 2,
}
```

**Integração:**
- Modal de perícia detecta atributo FOR/AGI
- Exclui automaticamente Luta e Pontaria
- Toggle disponível apenas em perícias elegíveis

---

### 6. Chef
**Poder:** Ingrediente Secreto  
**Tipo:** Passivo (Interlúdio)  
**Descrição Oficial:** "Em cenas de interlúdio, você pode cozinhar um prato especial. Todos recebem benefício de 2 pratos."

**Implementação SUE:**
```typescript
'ingrediente-secreto': {
  mechanics: {
    specialEffects: ['Interlúdio: todos recebem benefício de 2 pratos ao se alimentar'],
  },
}
```

---

### 7. Criminoso
**Poder:** O Crime Compensa  
**Tipo:** Passivo (Fim de Missão)  
**Descrição Oficial:** "No final de uma missão, escolha um item encontrado. Ele não conta no seu limite na próxima missão."

**Implementação SUE:**
```typescript
'o-crime-compensa': {
  mechanics: {
    specialEffects: ['Fim da missão: 1 item encontrado não conta no limite da próxima missão'],
  },
}
```

---

### 8. Cultista Arrependido
**Poder:** Traços do Outro Lado  
**Tipo:** Passivo (Criação)  
**Descrição Oficial:** "Você possui um poder paranormal à sua escolha. Porém, começa o jogo com metade da Sanidade."

**Implementação SUE:**
```typescript
'tracos-do-outro-lado': {
  mechanics: {
    specialEffects: ['Poder paranormal grátis', 'Começa com metade da Sanidade'],
  },
}
```

**Nota:** Modificador de -50% SAN tratado em `calculateDerivedStats`.

---

### 9. Desgarrado
**Poder:** Calejado  
**Tipo:** Passivo  
**Descrição Oficial:** "Você recebe +1 PV para cada 5% de NEX."

**Implementação SUE:**
```typescript
'calejado': {
  mechanics: {
    hpBonusPerNex: 1, // +1 PV para cada 5% de NEX
  },
}
```

**Cálculo:** `bonus = 1 × Math.floor(nex / 5)`  
Exemplo: NEX 50% = +10 PV

---

### 10. Engenheiro
**Poder:** Ferramenta Favorita  
**Tipo:** Passivo (Inventário)  
**Descrição Oficial:** "Um item a sua escolha (exceto armas) conta como uma categoria abaixo."

**Implementação SUE:**
```typescript
'ferramenta-favorita': {
  mechanics: {
    specialEffects: ['1 item (exceto arma) conta como 1 categoria abaixo'],
  },
}
```

---

### 11. Executivo
**Poder:** Processo Otimizado  
**Tipo:** Ativável (2 PE)  
**Descrição Oficial:** "Sempre que faz um teste durante um teste estendido ou revisão de documentos, +5 por 2 PE."

**Implementação SUE:**
```typescript
'processo-otimizado': {
  mechanics: {
    specialEffects: ['Teste estendido ou revisão de documentos: +5 por 2 PE'],
  },
  isToggleable: true,
  costPE: 2,
}
```

---

### 12. Investigador
**Poder:** Faro para Pistas  
**Tipo:** Passivo  
**Descrição Oficial:** "Você recebe +5 em Investigação."

**Implementação SUE:**
```typescript
'faro-para-pistas': {
  mechanics: {
    skillBonus: { investigacao: 5 },
    specialEffects: ['+5 em Investigação (já incluído)'],
  },
}
```

**Nota:** O livro base menciona "1 PE para +5" em alguns printings, mas a versão oficial v1.3 é passivo.

---

### 13. Lutador
**Poder:** Mão Pesada  
**Tipo:** Passivo  
**Descrição Oficial:** "Você recebe +2 em rolagens de dano com ataques corpo a corpo."

**Implementação SUE:**
```typescript
'mao-pesada': {
  mechanics: {
    meleeDamageBonus: 2,
    specialEffects: ['Dano desarmado: +2'],
  },
}
```

**Nota:** O bônus aplica a TODO dano corpo a corpo, não apenas desarmado.

---

### 14. Magnata
**Poder:** Patrocinador da Ordem  
**Tipo:** Passivo (Econômico)  
**Descrição Oficial:** "Seu limite de crédito é sempre considerado um acima do atual."

**Implementação SUE:**
```typescript
'patrocinador-da-ordem': {
  mechanics: {
    specialEffects: ['Limite de crédito +1 categoria', 'Se usar: patente efetiva -1 na missão'],
  },
  isToggleable: true,
}
```

---

### 15. Mercenário
**Poder:** Posição de Combate  
**Tipo:** Passivo  
**Descrição Oficial:** "Você recebe +5 em Iniciativa."

**Implementação SUE:**
```typescript
'posicao-de-combate': {
  mechanics: {
    initiativeBonus: 5,
  },
}
```

**Nota:** O livro menciona "2 PE para ação de movimento extra no 1º turno" em algumas versões.
A versão v1.3 é +5 Iniciativa passivo.

---

### 16. Militar
**Poder:** Para Bellum  
**Tipo:** Passivo  
**Descrição Oficial:** "Você recebe +2 em rolagens de dano com armas de fogo."

**Implementação SUE:**
```typescript
'para-bellum': {
  mechanics: {
    rangedDamageBonus: 2,
    conditionalNote: 'Apenas com armas de fogo (tipo Disparo)',
  },
}
```

---

### 17. Operário
**Poder:** Ferramenta de Trabalho  
**Tipo:** Passivo (Arma Escolhida)  
**Descrição Oficial:** "Escolha uma arma simples ou tática. Você recebe +1 em testes de ataque, rolagens de dano e margem de ameaça com ela."

**Implementação SUE:**
```typescript
'ferramenta-de-trabalho': {
  mechanics: {
    attackBonus: 1,
    damageBonus: 1,
    criticalMarginBonus: 1,
    requiresChosenWeapon: true,
    conditionalNote: 'Apenas com a arma escolhida (simples ou tática)',
  },
}
```

**Integração:**
- `OriginWeaponBindingModal` permite escolher arma do inventário
- Bônus só aplicados quando atacando com a arma vinculada
- Arma vinculada salva em `favoriteAbilityId`

---

### 18. Policial
**Poder:** Patrulha  
**Tipo:** Passivo  
**Descrição Oficial:** "Você recebe +2 em Defesa."

**Implementação SUE:**
```typescript
'patrulha': {
  mechanics: {
    defenseBonus: 2,
  },
}
```

---

### 19. Religioso
**Poder:** Acalentar  
**Tipo:** 1x/Cena (Ativável)  
**Descrição Oficial:** "Você recebe +5 em testes de Religião para acalmar. Além disso, quando acalma uma pessoa, ela recebe 1d6 + PRE pontos de Sanidade."

**Implementação SUE:**
```typescript
'acalentar': {
  mechanics: {
    specialEffects: ['1x/cena: +10 em teste de atributo de aliado adjacente'],
  },
  isToggleable: true,
}
```

**Nota:** A implementação atual simplifica o efeito. Versão completa requer sistema de acalmar.

---

### 20. Servidor Público
**Poder:** Espírito Cívico  
**Tipo:** Passivo  
**Descrição Oficial:** "Você recebe +2 em Fortitude, Reflexos e Vontade."

**Implementação SUE:**
```typescript
'espirito-civico': {
  mechanics: {
    fortitudeBonus: 2,
    reflexosBonus: 2,
    vontadeBonus: 2,
  },
}
```

**Nota:** O poder original menciona "ajudar", mas a versão v1.3 é bônus direto nas resistências.

---

### 21. T.I.
**Poder:** Motor de Busca  
**Tipo:** Ativável (2 PE)  
**Descrição Oficial:** "Com acesso à internet, pode substituir qualquer teste de perícia por Tecnologia por 2 PE."

**Implementação SUE:**
```typescript
'motor-de-busca': {
  mechanics: {
    specialEffects: ['Com internet: substitui teste de perícia por Tecnologia por 2 PE'],
  },
  isToggleable: true,
  costPE: 2,
}
```

---

### 22. Teórico da Conspiração
**Poder:** Eu Já Sabia  
**Tipo:** Passivo (Dinâmico)  
**Descrição Oficial:** "Você recebe resistência a dano mental igual ao seu Intelecto."

**Implementação SUE:**
```typescript
'eu-ja-sabia': {
  mechanics: {
    damageResistance: { mental: 0 }, // Calculado dinamicamente
    specialEffects: ['Resistência a dano mental = Intelecto'],
  },
}
```

**Integração:**
- Valor de `mental` é substituído pelo INT do personagem em `getOriginEffects`
- Atualiza automaticamente quando INT muda

---

### 23. Trabalhador Rural
**Poder:** Desbravador  
**Tipo:** Ativável (2 PE) + Passivo  
**Descrição Oficial:** "Quando faz teste de Adestramento ou Sobrevivência, +5 por 2 PE. Além disso, ignora penalidade de terreno difícil."

**Implementação SUE:**
```typescript
'desbravador': {
  mechanics: {
    specialEffects: [
      'Testes de Adestramento/Sobrevivência: +5 por 2 PE',
      'Ignora penalidade de terreno difícil',
    ],
  },
  isToggleable: true,
  costPE: 2,
}
```

---

### 24. Trambiqueiro
**Poder:** Impostor  
**Tipo:** 1x/Cena (2 PE)  
**Descrição Oficial:** "Uma vez por cena, pode gastar 2 PE para substituir um teste de perícia por Enganação."

**Implementação SUE:**
```typescript
'impostor': {
  mechanics: {
    specialEffects: [
      '1x/cena: +5 em Enganação para fingir ser outra pessoa',
      'Falha por 5+: descoberto',
    ],
  },
  isToggleable: true,
}
```

---

### 25. Universitário
**Poder:** Dedicação  
**Tipo:** Passivo  
**Descrição Oficial:** "Você recebe +1 PE, e mais 1 PE adicional a cada NEX ímpar (15%, 25%...). Além disso, seu limite de PE por turno aumenta em 1."

**Implementação SUE:**
```typescript
'dedicacao': {
  mechanics: {
    peBonus: 1,           // +1 PE base
    peBonusOddNex: 1,     // +1 PE por NEX ímpar
    peLimitBonus: 1,      // Limite PE/turno +1
    specialEffects: ['+1 PE base', '+1 PE por NEX ímpar', 'Limite PE/turno +1'],
  },
}
```

**Cálculo NEX ímpar:**
- NEX 15%: +1 PE
- NEX 25%: +2 PE
- NEX 35%: +3 PE
- NEX 45%: +4 PE
- etc.

**Fórmula:** `bonus = Math.floor(nex / 10)`

---

### 26. Vítima
**Poder:** Cicatrizes Psicológicas  
**Tipo:** Passivo  
**Descrição Oficial:** "Você recebe +1 de Sanidade para cada 5% de NEX."

**Implementação SUE:**
```typescript
'cicatrizes-psicologicas': {
  mechanics: {
    sanityBonusPerNex: 1,
    specialEffects: ['+1 SAN para cada 5% de NEX'],
  },
}
```

**Cálculo:** `bonus = 1 × Math.floor(nex / 5)`  
Exemplo: NEX 50% = +10 SAN

---

## Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│                        CharacterState                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ originId │  │ intellect│  │   nex    │  │ activatedEffects │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
└───────┼─────────────┼─────────────┼─────────────────┼───────────┘
        │             │             │                 │
        v             v             v                 v
┌───────────────────────────────────────────────────────────────┐
│                    getOriginEffects()                          │
│  1. Normaliza originId                                         │
│  2. Busca powerId em ORIGIN_NAME_TO_POWER_ID                   │
│  3. Recupera definição de ORIGIN_POWER_EFFECTS                 │
│  4. Calcula valores dinâmicos (ex: damageResistance.mental)    │
│  5. Verifica isActive baseado em activatedEffects              │
│  6. Retorna UnifiedEffect[]                                    │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             v
┌───────────────────────────────────────────────────────────────┐
│                     useUnifiedEffects()                        │
│  - Coleta efeitos de TODAS as fontes                           │
│  - Aplica regras de stacking                                   │
│  - Retorna ComputedEffects                                     │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             v
┌───────────────────────────────────────────────────────────────┐
│                      CharacterSheet                            │
│  - Exibe bônus calculados                                      │
│  - Tooltips mostram breakdown por fonte                        │
│  - Modais de combate/perícia consomem dados                    │
└───────────────────────────────────────────────────────────────┘
```

---

## Testes Automatizados

Os seguintes cenários são testados em `unified-effects-engine.test.ts`:

### Origens Passivas
- ✅ Desgarrado NEX 50% → +10 PV
- ✅ Vítima NEX 50% → +10 SAN
- ✅ Universitário NEX 45% → +1 PE base + 4 NEX ímpar + limite +1
- ✅ Investigador → +5 Investigação
- ✅ Policial → +2 Defesa
- ✅ Mercenário → +5 Iniciativa
- ✅ Militar → +2 dano ranged
- ✅ Lutador → +2 dano melee
- ✅ Servidor Público → +2 Fort/Ref/Von
- ✅ Teórico INT 3 → RD mental 3

### Origens Ativáveis
- ✅ Acadêmico toggle → +5 INT test quando ativo
- ✅ Atleta toggle → +5 FOR/AGI test quando ativo
- ✅ Executivo toggle → +5 teste estendido quando ativo

### Origens com Arma Escolhida
- ✅ Operário com arma vinculada → +1 ataque/dano/crit
- ✅ Operário sem arma vinculada → sem bônus

---

## Changelog

| Versão | Data | Alterações |
|--------|------|------------|
| 1.0.0 | 2026-01-25 | Documentação inicial das 26 origens v1.3 |
| 1.0.1 | 2026-01-25 | Correção Universitário (Dedicação) e Vítima (Cicatrizes Psicológicas) |
| 1.0.2 | 2026-01-25 | Adição de peBonusOddNex, peLimitBonus, sanityBonusPerNex ao SUE |

---

## Referências

- Ordem Paranormal RPG - Livro Base v1.3
- `src/lib/effects/origin-effects-adapter.ts` - Adaptador de Origens
- `src/lib/unified-effects-engine.ts` - Motor SUE
- `src/lib/character-data.ts` - Dados de Origens
