# Plano de Melhorias - Infraestrutura Administrativa

## Visão Geral

Este plano detalha as melhorias necessárias para os componentes administrativos do sistema Ordem Paranormal RPG, focando em padronização, refatoração, UX e funcionalidades.

---

## 📊 Diagnóstico Atual

| Arquivo | Linhas | Status | Problemas |
|---------|--------|--------|-----------|
| `AdminDataIntegrity.tsx` | 629 | ⚠️ | Cores hardcoded, arquivo grande |
| `AdminUsers.tsx` | 594 | ⚠️ | Cores hardcoded, sem busca/paginação |
| `AdminImport.tsx` | 402 | ⚠️ | Cores hardcoded |
| `RulesValidationPanel.tsx` | 695 | 🔴 | Muito grande, HTML inline |
| `SUEDebugPanel.tsx` | 1006 | 🔴 | Extremamente grande |
| `ValidationHistoryDashboard.tsx` | ? | ⚠️ | Verificar |
| `SUETestCoverageDashboard.tsx` | ? | ⚠️ | Verificar |
| `ClassPowerBonusTests.tsx` | ? | ⚠️ | Verificar |
| `JsonExamples.tsx` | 381 | ✅ | OK |
| `ImportPreview.tsx` | 123 | ✅ | OK |

---

## 🎯 Fase 1: Padronização de Cores (Prioridade Alta)

### Objetivo
Substituir todas as cores hardcoded por tokens semânticos do design system.

### Arquivos a Modificar
1. `src/pages/AdminDataIntegrity.tsx`
2. `src/pages/AdminUsers.tsx`
3. `src/pages/AdminImport.tsx`
4. `src/components/admin/RulesValidationPanel.tsx`
5. `src/components/admin/SUEDebugPanel.tsx`

### Mapeamento de Cores

| Cor Hardcoded | Token Semântico |
|---------------|-----------------|
| `text-green-500`, `text-green-400` | `text-emerald-400` ou CSS var |
| `text-blue-500`, `text-blue-400` | `text-sky-400` ou CSS var |
| `text-red-500`, `text-red-400` | `text-destructive` |
| `text-yellow-500`, `text-yellow-400` | `text-amber-400` |
| `text-purple-400`, `text-purple-500` | `text-violet-400` |
| `bg-green-500/10` | `bg-emerald-500/10` |
| `bg-blue-500/10` | `bg-sky-500/10` |
| `bg-red-500/10` | `bg-destructive/10` |

### Estimativa
- Tempo: ~2 horas
- Risco: Baixo

---

## 🧩 Fase 2: Refatoração de Arquivos Grandes (Prioridade Alta)

### 2.1 SUEDebugPanel.tsx (1006 linhas → ~4 arquivos)

#### Nova Estrutura
```
src/components/admin/sue-debug/
├── index.ts                    # Re-export
├── SUEDebugPanel.tsx           # Componente principal (~200 linhas)
├── ComputedEffectsView.tsx     # Aba de efeitos computados (~150 linhas)
├── RawEffectsView.tsx          # Aba de efeitos brutos (~150 linhas)
├── BreakdownView.tsx           # Aba de breakdown por fonte (~150 linhas)
├── EffectCategorySection.tsx   # Seção de categoria (~100 linhas)
├── EffectSourceBadge.tsx       # Badge de fonte (~50 linhas)
└── sue-debug-utils.ts          # Funções utilitárias (~100 linhas)
```

#### Benefícios
- Componentes focados e testáveis
- Manutenção simplificada
- Lazy loading possível

### 2.2 RulesValidationPanel.tsx (695 linhas → ~3 arquivos)

#### Nova Estrutura
```
src/components/admin/rules-validation/
├── index.ts
├── RulesValidationPanel.tsx    # Componente principal (~200 linhas)
├── ValidationResultsList.tsx   # Lista de resultados (~150 linhas)
├── CategorySection.tsx         # Seção de categoria (~100 linhas)
├── ValidationExporter.tsx      # Lógica de exportação (~150 linhas)
└── validation-report-templates.ts  # Templates HTML/JSON (~100 linhas)
```

### Estimativa
- Tempo: ~4 horas
- Risco: Médio (requer testes após refatoração)

---

## 🎨 Fase 3: Melhorias de UX/Navegação (Prioridade Média)

### 3.1 Navegação Unificada

Criar componente `AdminNav` para navegação consistente entre páginas admin.

```tsx
// src/components/admin/AdminNav.tsx
interface AdminNavProps {
  currentPage: 'users' | 'import' | 'integrity';
}
```

### 3.2 Breadcrumbs

Adicionar breadcrumbs em todas as páginas admin:
```
Dashboard > Administração > [Página Atual]
```

### 3.3 Indicadores de Loading

Padronizar skeleton loaders em todas as tabelas admin:
- `TableSkeleton` para tabelas
- `CardSkeleton` para cards de estatísticas
- `ChartSkeleton` para gráficos

### 3.4 ScrollArea em Modais

Verificar e adicionar ScrollArea em todos os modais que possam ter conteúdo extenso:
- Modal de correção de personagem
- Modal de confirmação de exclusão
- Modal de detalhes de validação

### Estimativa
- Tempo: ~3 horas
- Risco: Baixo

---

## 🔍 Fase 4: Busca e Paginação (Prioridade Média)

### 4.1 AdminUsers.tsx

#### Funcionalidades
1. **Campo de busca** - Filtrar por nome/email
2. **Filtro por role** - Admin/Moderador/Usuário
3. **Paginação** - 20 usuários por página
4. **Ordenação** - Por nome, data de cadastro, role

#### Implementação
```tsx
// Hook personalizado
function useAdminUsersList() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<AppRole | 'all'>('all');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'role'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Query com filtros
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter, page, sortBy, sortOrder],
    queryFn: () => fetchUsersWithFilters({ search, roleFilter, page, sortBy, sortOrder })
  });
  
  return { data, isLoading, filters, setters };
}
```

### 4.2 AdminDataIntegrity.tsx

#### Funcionalidades
1. **Busca por nome** do personagem
2. **Filtro por tipo de problema** (classe inválida, trilha inválida, etc.)
3. **Paginação** - Para listas grandes

### Estimativa
- Tempo: ~4 horas
- Risco: Baixo

---

## 📋 Cronograma Sugerido

| Fase | Descrição | Tempo | Prioridade |
|------|-----------|-------|------------|
| 1 | Padronização de Cores | 2h | 🔴 Alta |
| 2 | Refatoração SUEDebugPanel | 2h | 🔴 Alta |
| 2 | Refatoração RulesValidationPanel | 2h | 🔴 Alta |
| 3 | AdminNav + Breadcrumbs | 1.5h | 🟡 Média |
| 3 | Loading States | 1h | 🟡 Média |
| 3 | ScrollArea em Modais | 0.5h | 🟡 Média |
| 4 | Busca/Paginação AdminUsers | 2h | 🟡 Média |
| 4 | Busca/Filtro AdminDataIntegrity | 2h | 🟡 Média |

**Total Estimado: ~13 horas de desenvolvimento**

---

## ✅ Checklist de Implementação

### Fase 1 - Cores ✅ CONCLUÍDA
- [x] AdminDataIntegrity.tsx - Substituir cores hardcoded
- [x] AdminUsers.tsx - Substituir cores hardcoded
- [x] AdminImport.tsx - Verificado (não precisava alteração)
- [x] RulesValidationPanel.tsx - Substituir cores hardcoded
- [x] SUEDebugPanel.tsx - Substituir cores hardcoded
- [x] Criado `src/lib/admin-theme-tokens.ts` para referência futura

### Fase 2 - Refatoração ✅ CONCLUÍDA
- [x] Criar estrutura de pastas sue-debug/
- [x] Extrair ComputedEffectsView
- [x] Extrair RawEffectsView
- [x] Extrair BreakdownView
- [x] Extrair EffectCategorySection
- [x] Extrair EffectSourceBadge
- [x] Criar subcomponentes de seção (Flags, CombatAdvanced, SneakAttack, Healing, Occultist, Skills)
- [x] Criar estrutura rules-validation/
- [x] Extrair ValidationResultsList
- [x] Extrair CategorySection
- [x] Extrair validation-report-templates.ts
- [x] Manter compatibilidade com imports existentes

### Fase 3 - UX ✅ CONCLUÍDA
- [x] Criar AdminNav.tsx
- [x] Adicionar breadcrumbs
- [x] Criar componentes skeleton
- [x] Verificar ScrollArea em modais (imports adicionados)

### Fase 4 - Busca/Paginação ✅ CONCLUÍDA
- [x] useAdminFilters hook
- [x] AdminSearchBar component
- [x] AdminPagination component
- [x] Aplicar em AdminUsers
- [x] Aplicar em AdminDataIntegrity

---

## 📁 Nova Estrutura de Arquivos

### SUEDebugPanel (1008 → ~200 linhas por arquivo)
```
src/components/admin/sue-debug/
├── index.ts                    # Re-exports
├── SUEDebugPanel.tsx           # Componente principal (~270 linhas)
├── ComputedEffectsView.tsx     # Aba de efeitos computados (~110 linhas)
├── RawEffectsView.tsx          # Aba de efeitos brutos (~70 linhas)
├── BreakdownView.tsx           # Aba de breakdown por fonte (~90 linhas)
├── EffectCategorySection.tsx   # Seção de categoria (~90 linhas)
├── EffectSourceBadge.tsx       # Badge de fonte (~55 linhas)
├── sue-debug-constants.ts      # Constantes visuais (~65 linhas)
├── sue-debug-types.ts          # Tipos e interfaces (~40 linhas)
└── sections/
    ├── index.ts                # Re-exports
    ├── FlagsSection.tsx        # Seção de flags (~40 linhas)
    ├── CombatAdvancedSection.tsx  # Combate avançado (~145 linhas)
    ├── SneakAttackSection.tsx  # Ataque furtivo (~40 linhas)
    ├── HealingSection.tsx      # Cura (~40 linhas)
    ├── OccultistSection.tsx    # Ocultista (~50 linhas)
    └── SkillsSection.tsx       # Perícias (~70 linhas)
```

### RulesValidationPanel (695 → ~150 linhas por arquivo)
```
src/components/admin/rules-validation/
├── index.ts                    # Re-exports
├── RulesValidationPanel.tsx    # Componente principal (~280 linhas)
├── ValidationResultsList.tsx   # Lista de resultados (~40 linhas)
├── CategorySection.tsx         # Seção de categoria (~115 linhas)
├── validation-constants.tsx    # Ícones e constantes (~55 linhas)
└── validation-report-templates.ts  # Templates JSON/HTML (~195 linhas)
```

---

## 🚀 Próximos Passos

Para continuar a implementação, responda com:

1. **"Iniciar Fase 4"** - Busca e paginação
