
# Plano de Correção: Scroll na Caixa de Substituição de Perícia

## Problema Identificado

O modal **SkillChoiceModal** (exibido como "Escolha: Luta ou Pontaria") não permite rolar a lista de perícias quando o modo de escolha livre (`showFreeChoice`) está ativo. O usuário vê apenas as primeiras perícias (ex: Agilidade) e não consegue acessar as demais.

### Causa Raiz

Analisando o código atual em `src/components/character/SkillChoiceModal.tsx`:

1. **Elementos fixos dentro do scroll**: O header com "Escolha uma perícia" + botão "Voltar" e o campo de busca estão **dentro** do `MobileModalBody`, ocupando o espaço scrollável. Isso:
   - Reduz a altura disponível para a lista
   - Pode confundir o cálculo de overflow do SimpleBar

2. **Estrutura do MobileModalBody**: O `CustomScroll` (SimpleBar) requer que o container tenha altura restrita e o conteúdo a exceda. A estrutura atual coloca tudo em um único bloco:

```text
┌─────────────────────────────────────┐
│ MobileModalBody (useScrollArea)    │
│ ┌─────────────────────────────────┐ │
│ │ Header + Busca (fixos?)         │ │  ← DENTRO do scroll
│ │ Lista de Perícias               │ │  ← Lista longa
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

O SimpleBar pode não estar calculando o overflow corretamente porque:
- A altura interna não ultrapassa a `maxHeight` calculada (ou o container cresce com o conteúdo)
- Elementos acima da lista consomem espaço que deveria ser scrollável

---

## Solução Proposta

Reorganizar a estrutura para separar elementos fixos do conteúdo scrollável, seguindo o padrão do projeto documentado em `BaseSelectionModal.tsx`:

```text
┌─────────────────────────────────────┐
│ MobileModalHeader                  │  ← Fixo (título + descrição)
├─────────────────────────────────────┤
│ Área Fixa (FORA do scroll)         │  ← Header + Busca
│ ┌─────────────────────────────────┐ │
│ │ "Escolha uma perícia:" + Voltar │ │
│ │ [🔍 Buscar perícia...]          │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ MobileModalBody (useScrollArea)    │  ← APENAS lista scrollável
│ ┌─────────────────────────────────┐ │
│ │ AGI - Agilidade (6)             │ │
│ │   Acrobacia                     │ │
│ │   Crime                         │ │
│ │   ...                           │ │
│ │ FOR - Força (3)                 │ │
│ │   ...                           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Alterações Técnicas

#### 1. SkillChoiceModal - Modo showFreeChoice (linhas 248-341)

**Antes** (estrutura atual):
```tsx
<MobileModalBody useScrollArea={true}>
  <div className="space-y-3">
    {/* Header com botão voltar - DENTRO do scroll */}
    <div className="flex items-center justify-between">
      <h4>Escolha uma perícia:</h4>
      <Button onClick={() => setShowFreeChoice(false)}>Voltar</Button>
    </div>
    
    {/* Campo de busca - DENTRO do scroll */}
    <div className="relative">
      <Input placeholder="Buscar perícia..." />
    </div>
    
    {/* Lista de perícias */}
    <div className="space-y-4">
      {/* grupos de perícias */}
    </div>
  </div>
</MobileModalBody>
```

**Depois** (estrutura corrigida):
```tsx
{/* Área fixa FORA do MobileModalBody */}
<div className="px-4 sm:px-6 pb-3 space-y-3 shrink-0 border-b border-border/30">
  {/* Header com botão voltar */}
  <div className="flex items-center justify-between">
    <h4 className="text-sm font-medium">Escolha uma perícia:</h4>
    <Button variant="ghost" size="sm" onClick={...}>Voltar</Button>
  </div>
  
  {/* Campo de busca */}
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
    <Input placeholder="Buscar perícia..." className="pl-10 h-9" />
  </div>
</div>

{/* MobileModalBody contém APENAS a lista scrollável */}
<MobileModalBody useScrollArea={true} maxHeight="calc(70vh - 200px)">
  <div className="space-y-4">
    {/* Lista de perícias agrupadas */}
  </div>
</MobileModalBody>
```

#### 2. ConflictResolutionModal (linhas 456-533)

Aplicar a mesma correção: mover o campo de busca para **fora** do `MobileModalBody`, como área fixa entre o header e o body.

#### 3. Ajuste de maxHeight

Usar um `maxHeight` mais conservador (ex: `calc(70vh - 200px)`) para garantir que:
- Header do modal (~60px)
- Área fixa de busca (~80px)
- Safe-area do dispositivo (~20px)
...sejam descontados corretamente.

---

## Arquivos Afetados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/character/SkillChoiceModal.tsx` | Reorganizar estrutura do modo `showFreeChoice` e `ConflictResolutionModal` |

---

## Checklist de Implementação

- [ ] Mover header "Escolha uma perícia:" + botão "Voltar" para fora do `MobileModalBody`
- [ ] Mover campo de busca para fora do `MobileModalBody`
- [ ] Ajustar `maxHeight` do `MobileModalBody` para compensar altura dos elementos fixos
- [ ] Aplicar mesma correção ao `ConflictResolutionModal`
- [ ] Testar em viewport mobile (ex: 375x812) para garantir scroll funcional
- [ ] Verificar que scrollbar do SimpleBar aparece quando lista é longa

---

## Impacto

- **Baixo risco**: Alteração estrutural localizada em componente específico
- **Alta prioridade**: Bug impede seleção de perícias no fluxo de criação de Combatente

## Tempo Estimado

~30 minutos
