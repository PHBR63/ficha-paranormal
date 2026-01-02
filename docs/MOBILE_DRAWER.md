# MobileDrawer - Documentação

Componente de bottom-sheet otimizado para mobile, baseado no Vaul.

## Características

- ✅ Bottom-sheet nativo com swipe-to-dismiss
- ✅ Safe-area-inset automático para dispositivos com home indicator
- ✅ Overscroll-contain para evitar scroll chaining
- ✅ Estrutura flexível: header fixo, conteúdo scrollável, footer fixo
- ✅ Touch-manipulation para resposta instantânea
- ✅ Alturas responsivas baseadas em viewport
- ✅ Suporte a drawers aninhados (variante `nested`)

---

## Importação

```tsx
import {
  MobileDrawer,
  MobileDrawerTrigger,
  MobileDrawerClose,
  MobileDrawerContent,
  MobileDrawerHeader,
  MobileDrawerBody,
  MobileDrawerFooter,
  MobileDrawerTitle,
  MobileDrawerDescription,
} from "@/components/ui/mobile-drawer";
```

---

## Uso Básico

```tsx
<MobileDrawer open={isOpen} onOpenChange={setIsOpen}>
  <MobileDrawerContent maxHeight="lg">
    <MobileDrawerHeader bordered>
      <MobileDrawerTitle>Título do Drawer</MobileDrawerTitle>
      <MobileDrawerDescription>
        Descrição opcional do conteúdo
      </MobileDrawerDescription>
    </MobileDrawerHeader>

    <MobileDrawerBody>
      {/* Conteúdo scrollável aqui */}
      <p>Seu conteúdo...</p>
    </MobileDrawerBody>

    <MobileDrawerFooter bordered>
      <Button onClick={() => setIsOpen(false)}>
        Fechar
      </Button>
    </MobileDrawerFooter>
  </MobileDrawerContent>
</MobileDrawer>
```

---

## Props dos Componentes

### `MobileDrawerContent`

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `maxHeight` | `"sm" \| "md" \| "lg" \| "xl" \| "full"` | `"lg"` | Altura máxima do drawer |
| `showHandle` | `boolean` | `true` | Mostra o handle de arrastar |
| `showCloseButton` | `boolean` | `false` | Mostra botão X no canto superior direito |
| `variant` | `"default" \| "nested"` | `"default"` | Variante para drawers aninhados |

**Mapeamento de alturas:**
- `sm`: 50vh
- `md`: 65vh
- `lg`: 85vh
- `xl`: 92vh
- `full`: 100vh

### `MobileDrawerHeader`

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `bordered` | `boolean` | `false` | Adiciona borda inferior |

### `MobileDrawerBody`

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `useScrollArea` | `boolean` | `true` | Usa ScrollArea do Radix (recomendado para listas longas) |
| `maxHeight` | `string` | - | Altura máxima customizada |

### `MobileDrawerFooter`

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `bordered` | `boolean` | `false` | Adiciona borda superior |

---

## Exemplos de Uso

### 1. Modal de Confirmação Simples

```tsx
<MobileDrawer open={showConfirm} onOpenChange={setShowConfirm}>
  <MobileDrawerContent maxHeight="sm">
    <MobileDrawerHeader>
      <MobileDrawerTitle>Confirmar Ação</MobileDrawerTitle>
    </MobileDrawerHeader>

    <MobileDrawerBody useScrollArea={false}>
      <p className="text-muted-foreground">
        Tem certeza que deseja continuar?
      </p>
    </MobileDrawerBody>

    <MobileDrawerFooter>
      <Button variant="outline" onClick={() => setShowConfirm(false)}>
        Cancelar
      </Button>
      <Button onClick={handleConfirm}>
        Confirmar
      </Button>
    </MobileDrawerFooter>
  </MobileDrawerContent>
</MobileDrawer>
```

### 2. Lista com Scroll

```tsx
<MobileDrawer open={showList} onOpenChange={setShowList}>
  <MobileDrawerContent maxHeight="xl">
    <MobileDrawerHeader bordered>
      <MobileDrawerTitle>Selecione um Item</MobileDrawerTitle>
      <MobileDrawerDescription>
        {items.length} itens disponíveis
      </MobileDrawerDescription>
    </MobileDrawerHeader>

    <MobileDrawerBody>
      <div className="space-y-2">
        {items.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleSelect(item)}
          >
            {item.name}
          </Button>
        ))}
      </div>
    </MobileDrawerBody>
  </MobileDrawerContent>
</MobileDrawer>
```

### 3. Formulário com Header e Footer Fixos

```tsx
<MobileDrawer open={showForm} onOpenChange={setShowForm}>
  <MobileDrawerContent maxHeight="lg">
    <MobileDrawerHeader bordered>
      <MobileDrawerTitle>Novo Registro</MobileDrawerTitle>
    </MobileDrawerHeader>

    <MobileDrawerBody>
      <div className="space-y-4">
        <div>
          <Label>Nome</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Descrição</Label>
          <Textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
          />
        </div>
        {/* Mais campos... */}
      </div>
    </MobileDrawerBody>

    <MobileDrawerFooter bordered>
      <Button 
        className="w-full" 
        onClick={handleSave}
        disabled={!name}
      >
        Salvar
      </Button>
    </MobileDrawerFooter>
  </MobileDrawerContent>
</MobileDrawer>
```

### 4. Drawer Aninhado (Nested)

Use a variante `nested` quando precisar abrir um drawer dentro de outro:

```tsx
// Drawer Principal
<MobileDrawer open={showMain} onOpenChange={setShowMain}>
  <MobileDrawerContent maxHeight="lg">
    <MobileDrawerHeader>
      <MobileDrawerTitle>Drawer Principal</MobileDrawerTitle>
    </MobileDrawerHeader>

    <MobileDrawerBody>
      <Button onClick={() => setShowNested(true)}>
        Abrir Drawer Aninhado
      </Button>
    </MobileDrawerBody>
  </MobileDrawerContent>
</MobileDrawer>

// Drawer Aninhado
<MobileDrawer open={showNested} onOpenChange={setShowNested}>
  <MobileDrawerContent maxHeight="md" variant="nested">
    <MobileDrawerHeader>
      <MobileDrawerTitle>Drawer Aninhado</MobileDrawerTitle>
    </MobileDrawerHeader>

    <MobileDrawerBody>
      <p>Conteúdo do drawer aninhado...</p>
    </MobileDrawerBody>

    <MobileDrawerFooter>
      <Button onClick={() => setShowNested(false)}>
        Voltar
      </Button>
    </MobileDrawerFooter>
  </MobileDrawerContent>
</MobileDrawer>
```

**Características da variante `nested`:**
- Offset visual (margem lateral)
- Borda mais pronunciada
- Sombra para dar profundidade
- Altura máxima reduzida (80vh)
- Z-index maior (z-60)
- Overlay mais leve

---

## Padrões de Uso

### ✅ Boas Práticas

1. **Use `MobileDrawerBody` para conteúdo scrollável**
   ```tsx
   <MobileDrawerBody>
     {/* Conteúdo longo aqui */}
   </MobileDrawerBody>
   ```

2. **Use bordas para separação visual**
   ```tsx
   <MobileDrawerHeader bordered>...</MobileDrawerHeader>
   <MobileDrawerFooter bordered>...</MobileDrawerFooter>
   ```

3. **Escolha a altura apropriada**
   - `sm` para confirmações simples
   - `md` para formulários curtos
   - `lg` para listas e formulários (padrão)
   - `xl` para conteúdo extenso
   - `full` para experiências fullscreen

4. **Sempre forneça forma de fechar**
   - Via swipe (automático)
   - Via botão no footer
   - Via `showCloseButton` se necessário

### ❌ Evite

1. **Não use scroll fora do `MobileDrawerBody`**
   ```tsx
   // ❌ Errado
   <MobileDrawerContent>
     <div className="overflow-y-auto">...</div>
   </MobileDrawerContent>

   // ✅ Correto
   <MobileDrawerContent>
     <MobileDrawerBody>...</MobileDrawerBody>
   </MobileDrawerContent>
   ```

2. **Não aninhe drawers sem usar `variant="nested"`**
   ```tsx
   // ❌ Errado - drawers se sobrepõem sem distinção visual
   <MobileDrawerContent>...</MobileDrawerContent>

   // ✅ Correto
   <MobileDrawerContent variant="nested">...</MobileDrawerContent>
   ```

---

## Migração de Drawer para MobileDrawer

Se você tem um componente usando o Drawer padrão do Vaul:

### Antes

```tsx
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";

<Drawer open={open} onOpenChange={setOpen}>
  <DrawerContent className="max-h-[85vh]">
    <DrawerHeader>
      <DrawerTitle>Título</DrawerTitle>
    </DrawerHeader>
    <ScrollArea className="flex-1 px-4">
      {/* conteúdo */}
    </ScrollArea>
    <div className="p-4 border-t">
      <Button>Ação</Button>
    </div>
  </DrawerContent>
</Drawer>
```

### Depois

```tsx
import {
  MobileDrawer,
  MobileDrawerContent,
  MobileDrawerHeader,
  MobileDrawerTitle,
  MobileDrawerBody,
  MobileDrawerFooter,
} from "@/components/ui/mobile-drawer";

<MobileDrawer open={open} onOpenChange={setOpen}>
  <MobileDrawerContent maxHeight="lg">
    <MobileDrawerHeader>
      <MobileDrawerTitle>Título</MobileDrawerTitle>
    </MobileDrawerHeader>
    <MobileDrawerBody>
      {/* conteúdo */}
    </MobileDrawerBody>
    <MobileDrawerFooter bordered>
      <Button>Ação</Button>
    </MobileDrawerFooter>
  </MobileDrawerContent>
</MobileDrawer>
```

---

## Componentes Migrados

Os seguintes componentes já utilizam o `MobileDrawer`:

- `MobileResistanceCheckModal`
- `MobileCombatRollModal`
- `MobileRitualCastModal`
- `MobileRitualEffectWizard`
- `MobileDiceRollModal`
- `MobileRollHistory`
- `MobileRitualCastHistory`
- `MobileCombatDrawer`
- `MobileAniquiladorPanel`
- `MobileGuerreiroPanel`
- `MobileAtiradorDeElitePanel`
- `MobileMedicoDeCampoPanel`
- `MobileOperacoesEspeciaisPanel`
- `MobileTecnicoPanel`

---

# MobileActionSheet

Componente de ações rápidas estilo iOS, construído sobre o `MobileDrawer`.

## Importação

```tsx
import { 
  MobileActionSheet, 
  useActionSheet 
} from "@/components/ui/mobile-action-sheet";
```

## Características

- ✅ Lista de ações com ícones opcionais
- ✅ Suporte a ações destrutivas (vermelho)
- ✅ Botão de cancelar automático
- ✅ Separadores visuais entre grupos
- ✅ Altura automática baseada no número de ações
- ✅ Hook `useActionSheet` para gerenciamento de estado

---

## Props

### `MobileActionSheet`

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `open` | `boolean` | - | Controla se o sheet está aberto |
| `onOpenChange` | `(open: boolean) => void` | - | Callback quando o estado muda |
| `title` | `string` | - | Título opcional |
| `description` | `string` | - | Descrição/subtítulo opcional |
| `actions` | `ActionSheetAction[]` | `[]` | Lista de ações (modo simples) |
| `groups` | `ActionSheetGroup[]` | - | Lista de grupos (modo agrupado) |
| `cancelLabel` | `string` | `"Cancelar"` | Texto do botão cancelar |
| `showCancel` | `boolean` | `true` | Se deve mostrar botão cancelar |
| `onCancel` | `() => void` | - | Callback ao cancelar |
| `closeOnAction` | `boolean` | `true` | Se fecha ao clicar em ação |

### `ActionSheetAction`

| Prop | Tipo | Descrição |
|------|------|-----------|
| `id` | `string` | ID único da ação |
| `label` | `string` | Texto da ação |
| `icon` | `LucideIcon` | Ícone opcional |
| `onPress` | `() => void` | Callback ao clicar |
| `destructive` | `boolean` | Se é ação destrutiva (vermelho) |
| `disabled` | `boolean` | Se está desabilitada |
| `description` | `string` | Descrição abaixo do label |

### `ActionSheetGroup`

| Prop | Tipo | Descrição |
|------|------|-----------|
| `title` | `string` | Título opcional do grupo |
| `actions` | `ActionSheetAction[]` | Lista de ações |

---

## Exemplos de Uso

### 1. Uso Básico com Hook

```tsx
import { MobileActionSheet, useActionSheet } from "@/components/ui/mobile-action-sheet";
import { Edit, Copy, Trash2 } from "lucide-react";

function MyComponent() {
  const { isOpen, setIsOpen, open } = useActionSheet();

  return (
    <>
      <Button onClick={open}>Abrir Ações</Button>

      <MobileActionSheet
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Ações do Item"
        actions={[
          { 
            id: "edit", 
            label: "Editar", 
            icon: Edit, 
            onPress: () => console.log("Editar") 
          },
          { 
            id: "copy", 
            label: "Duplicar", 
            icon: Copy, 
            onPress: () => console.log("Duplicar") 
          },
          { 
            id: "delete", 
            label: "Excluir", 
            icon: Trash2, 
            onPress: () => console.log("Excluir"),
            destructive: true 
          },
        ]}
      />
    </>
  );
}
```

### 2. Ações com Descrição

```tsx
<MobileActionSheet
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Compartilhar"
  description="Escolha como compartilhar este item"
  actions={[
    { 
      id: "link", 
      label: "Copiar Link", 
      icon: Link,
      description: "Qualquer pessoa com o link pode ver",
      onPress: handleCopyLink 
    },
    { 
      id: "email", 
      label: "Enviar por E-mail", 
      icon: Mail,
      description: "Enviar convite direto",
      onPress: handleEmail 
    },
  ]}
/>
```

### 3. Ações Agrupadas

```tsx
<MobileActionSheet
  open={isOpen}
  onOpenChange={setIsOpen}
  groups={[
    {
      title: "Edição",
      actions: [
        { id: "edit", label: "Editar", icon: Edit, onPress: handleEdit },
        { id: "rename", label: "Renomear", icon: Type, onPress: handleRename },
      ]
    },
    {
      title: "Organizar",
      actions: [
        { id: "move", label: "Mover para...", icon: FolderOpen, onPress: handleMove },
        { id: "archive", label: "Arquivar", icon: Archive, onPress: handleArchive },
      ]
    },
    {
      actions: [
        { id: "delete", label: "Excluir", icon: Trash2, onPress: handleDelete, destructive: true },
      ]
    }
  ]}
/>
```

### 4. Sem Botão Cancelar

```tsx
<MobileActionSheet
  open={isOpen}
  onOpenChange={setIsOpen}
  showCancel={false}
  actions={[
    { id: "option1", label: "Opção 1", onPress: handleOption1 },
    { id: "option2", label: "Opção 2", onPress: handleOption2 },
  ]}
/>
```

### 5. Ações Desabilitadas

```tsx
<MobileActionSheet
  open={isOpen}
  onOpenChange={setIsOpen}
  actions={[
    { id: "save", label: "Salvar", icon: Save, onPress: handleSave },
    { 
      id: "publish", 
      label: "Publicar", 
      icon: Globe,
      description: "Complete todos os campos para publicar",
      onPress: handlePublish,
      disabled: !isFormValid 
    },
  ]}
/>
```

### 6. Controle Manual (sem fechar automaticamente)

```tsx
<MobileActionSheet
  open={isOpen}
  onOpenChange={setIsOpen}
  closeOnAction={false}
  actions={[
    { 
      id: "step1", 
      label: "Passo 1", 
      onPress: () => {
        doStep1();
        // Fecha manualmente quando quiser
        if (allDone) setIsOpen(false);
      } 
    },
  ]}
/>
```

---

## Hook `useActionSheet`

Hook utilitário para gerenciar o estado do ActionSheet:

```tsx
const { 
  isOpen,     // boolean - estado atual
  setIsOpen,  // (open: boolean) => void - setter direto
  open,       // () => void - abre o sheet
  close,      // () => void - fecha o sheet
  toggle,     // () => void - alterna o estado
} = useActionSheet();
```

---

## Padrões de Uso

### ✅ Boas Práticas

1. **Use IDs únicos para cada ação**
   ```tsx
   actions={[
     { id: "edit-item-123", ... },
     { id: "delete-item-123", ... },
   ]}
   ```

2. **Coloque ações destrutivas por último**
   ```tsx
   actions={[
     { id: "edit", label: "Editar", ... },
     { id: "share", label: "Compartilhar", ... },
     { id: "delete", label: "Excluir", destructive: true, ... }, // último
   ]}
   ```

3. **Use descrições para ações complexas**
   ```tsx
   { 
     id: "export", 
     label: "Exportar PDF",
     description: "Gera documento com todas as informações",
     ...
   }
   ```

4. **Agrupe ações relacionadas**
   ```tsx
   groups={[
     { title: "Editar", actions: [...] },
     { title: "Compartilhar", actions: [...] },
   ]}
   ```

### ❌ Evite

1. **Não use muitas ações sem agrupamento**
   ```tsx
   // ❌ Difícil de navegar
   actions={[action1, action2, action3, action4, action5, action6, action7]}

   // ✅ Melhor agrupado
   groups={[
     { title: "Grupo 1", actions: [action1, action2, action3] },
     { title: "Grupo 2", actions: [action4, action5, action6, action7] },
   ]}
   ```

2. **Não misture `actions` e `groups`**
   ```tsx
   // ❌ Comportamento indefinido
   <MobileActionSheet actions={[...]} groups={[...]} />

   // ✅ Use um ou outro
   <MobileActionSheet actions={[...]} />
   // ou
   <MobileActionSheet groups={[...]} />
   ```
