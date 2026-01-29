/**
 * MacrosPanel - Painel de gerenciamento de macros de rolagem
 * 
 * Permite criar, editar, executar e organizar macros de rolagem.
 * Integra com o sistema de chat da campanha.
 */

import { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// ScrollArea removido - usando overflow nativo para evitar bug #185 com React 19
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dices,
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Download,
  Upload,
  RotateCcw,
  ChevronDown,
  Sword,
  Shield,
  Target,
  Heart,
  Sparkles,
  Zap,
  Play,
} from 'lucide-react';
import { useMacros } from '@/hooks/campaign/useMacros';
import { MacroEditor, type RollMacro, type MacroType } from '@/components/combat/MacroEditor';
import { useToast } from '@/hooks/use-toast';

// Mapa de ícones
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  dices: Dices,
  sword: Sword,
  shield: Shield,
  target: Target,
  heart: Heart,
  sparkles: Sparkles,
  zap: Zap,
};

// Mapa de cores
const COLOR_MAP: Record<string, string> = {
  default: 'bg-accent',
  red: 'bg-red-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  yellow: 'bg-yellow-500',
  orange: 'bg-orange-500',
};

// Nomes dos tipos
const TYPE_NAMES: Record<MacroType, string> = {
  skill: 'Testes de Perícia',
  attack: 'Ataques',
  damage: 'Dano',
  save: 'Resistências',
  custom: 'Personalizados',
};

interface MacrosPanelProps {
  characterId?: string;
  campaignId?: string;
  onRoll?: (formula: string, label: string, type: string) => void;
  className?: string;
}

export function MacrosPanel({ characterId, campaignId, onRoll, className }: MacrosPanelProps) {
  const { toast } = useToast();
  
  // Usa characterId se fornecido, senão usa campaignId como fallback para localStorage key
  const macroKey = characterId || campaignId || 'global';
  
  const {
    macros,
    isLoading,
    addMacro,
    updateMacro,
    deleteMacro,
    duplicateMacro,
    exportMacros,
    importMacros,
    resetToDefaults,
  } = useMacros({ characterId: macroKey });

  // Estados locais
  const [searchQuery, setSearchQuery] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMacro, setEditingMacro] = useState<RollMacro | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<MacroType[]>(['skill', 'attack', 'save']);

  // Filtra e agrupa macros
  const filteredMacros = useMemo(() => {
    const filtered = macros.filter(m =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.label?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Agrupa por tipo
    const grouped: Record<MacroType, RollMacro[]> = {
      skill: [],
      attack: [],
      damage: [],
      save: [],
      custom: [],
    };

    filtered.forEach(m => {
      grouped[m.type].push(m);
    });

    return grouped;
  }, [macros, searchQuery]);

  // =====================================================
  // ESTABILIZAÇÃO DE CALLBACKS (Prevenção de loop #185)
  // =====================================================
  // Refs para funções que mudam - evita re-criar callbacks inline
  const onRollRef = useRef(onRoll);
  const toastFnRef = useRef(toast);
  
  useEffect(() => { onRollRef.current = onRoll; }, [onRoll]);
  useEffect(() => { toastFnRef.current = toast; }, [toast]);
  
  // Executa rolagem - callback estável
  const handleRoll = useCallback((macro: RollMacro) => {
    const formula = `${macro.diceCount}d${macro.diceType}${macro.bonus > 0 ? `+${macro.bonus}` : macro.bonus < 0 ? macro.bonus : ''}`;
    const label = macro.label || macro.name;
    
    // Chama onRoll se disponível, senão apenas mostra o toast
    if (onRollRef.current) {
      onRollRef.current(formula, label, macro.type);
    }
    
    toastFnRef.current?.({
      title: `🎲 ${macro.name}`,
      description: onRollRef.current ? `Rolando ${formula}...` : `Fórmula: ${formula}`,
      duration: 2000,
    });
  }, []);

  // Editar macro - callback estável
  const handleEdit = useCallback((macro: RollMacro) => {
    setEditingMacro(macro);
    setEditorOpen(true);
  }, []);

  // Nova macro - callback estável
  const handleNew = useCallback(() => {
    setEditingMacro(null);
    setEditorOpen(true);
  }, []);

  // Salvar macro - callback estável
  const handleSave = useCallback((macroData: Omit<RollMacro, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingMacro) {
      updateMacro(editingMacro.id, macroData);
      toastFnRef.current?.({ title: 'Macro atualizada', description: `"${macroData.name}" foi salva.` });
    } else {
      addMacro(macroData);
      toastFnRef.current?.({ title: 'Macro criada', description: `"${macroData.name}" foi adicionada.` });
    }
  }, [editingMacro, updateMacro, addMacro]);

  // Deletar macro - callback estável
  const handleDelete = useCallback((macroId: string) => {
    const macro = macros.find(m => m.id === macroId);
    deleteMacro(macroId);
    toastFnRef.current?.({ title: 'Macro excluída', description: `"${macro?.name}" foi removida.` });
  }, [macros, deleteMacro]);

  // Duplicar macro - callback estável
  const handleDuplicate = useCallback((macroId: string) => {
    const duplicate = duplicateMacro(macroId);
    if (duplicate) {
      toastFnRef.current?.({ title: 'Macro duplicada', description: `"${duplicate.name}" foi criada.` });
    }
  }, [duplicateMacro]);

  // Exportar - callback estável
  const handleExport = useCallback(() => {
    const json = exportMacros();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `macros-${characterId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toastFnRef.current?.({ title: 'Macros exportadas', description: `${macros.length} macros salvas.` });
  }, [exportMacros, characterId, macros.length]);

  // Importar - callback estável
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const count = importMacros(reader.result as string);
          toastFnRef.current?.({ title: 'Macros importadas', description: `${count} macros adicionadas.` });
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [importMacros]);

  // Resetar - callback estável
  const handleReset = useCallback(() => {
    resetToDefaults();
    toastFnRef.current?.({ title: 'Macros restauradas', description: 'Macros padrão foram restauradas.' });
  }, [resetToDefaults]);

  // Toggle de categoria expandida - callback estável
  const toggleType = useCallback((type: MacroType) => {
    setExpandedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  }, []);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Dices className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Dices className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg tracking-wider">MACROS</h3>
          <Badge variant="secondary" className="ml-1">
            {macros.length}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleNew} className="gap-1">
            <Plus className="w-4 h-4" />
            Nova
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleImport}>
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleReset} className="text-destructive">
                <RotateCcw className="w-4 h-4 mr-2" />
                Restaurar Padrão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Busca */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar macros..."
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Lista de Macros - usando overflow nativo para evitar bug #185 */}
      <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <div className="p-3 space-y-2">
          {(Object.keys(filteredMacros) as MacroType[]).map((type) => {
            const typeMacros = filteredMacros[type];
            if (typeMacros.length === 0) return null;

            const isExpanded = expandedTypes.includes(type);

            return (
              <Collapsible
                key={type}
                open={isExpanded}
                onOpenChange={() => toggleType(type)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">
                    {TYPE_NAMES[type]}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {typeMacros.length}
                    </Badge>
                    <ChevronDown className={cn(
                      'w-4 h-4 transition-transform',
                      isExpanded && 'rotate-180'
                    )} />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="mt-1 space-y-1">
                    <AnimatePresence mode="popLayout">
                      {typeMacros.map((macro) => (
                        <MacroItem
                          key={macro.id}
                          macro={macro}
                          onRoll={handleRoll}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onDuplicate={handleDuplicate}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}

          {macros.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Dices className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhuma macro criada</p>
              <Button
                variant="link"
                size="sm"
                onClick={handleNew}
                className="mt-2"
              >
                Criar primeira macro
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Editor Dialog */}
      <MacroEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        macro={editingMacro}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}

// =====================================================
// COMPONENTE MACROITEM - Memoizado para evitar re-renders
// =====================================================
interface MacroItemProps {
  macro: RollMacro;
  onRoll: (macro: RollMacro) => void;
  onEdit: (macro: RollMacro) => void;
  onDelete: (macroId: string) => void;
  onDuplicate: (macroId: string) => void;
}

const MacroItem = memo(function MacroItem({
  macro, 
  onRoll, 
  onEdit, 
  onDelete, 
  onDuplicate 
}: MacroItemProps) {
  const IconComponent = ICON_MAP[macro.icon || 'dices'] || Dices;
  const colorClass = COLOR_MAP[macro.color || 'default'] || COLOR_MAP.default;
  
  const formula = `${macro.diceCount}d${macro.diceType}${macro.bonus > 0 ? `+${macro.bonus}` : macro.bonus < 0 ? macro.bonus : ''}`;

  // Handlers locais estáveis - chamam callbacks do pai com o macro
  const handleRollClick = useCallback(() => onRoll(macro), [onRoll, macro]);
  const handleEditClick = useCallback(() => onEdit(macro), [onEdit, macro]);
  const handleDeleteClick = useCallback(() => onDelete(macro.id), [onDelete, macro.id]);
  const handleDuplicateClick = useCallback(() => onDuplicate(macro.id), [onDuplicate, macro.id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="group flex items-center gap-2 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
    >
      {/* Ícone colorido */}
      <div className={cn(
        'flex items-center justify-center w-8 h-8 rounded-lg text-white shrink-0',
        colorClass
      )}>
        <IconComponent className="w-4 h-4" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{macro.name}</p>
        <p className="text-xs text-muted-foreground font-mono">{formula}</p>
      </div>

      {/* Ações - Tooltip removido para evitar loop #185 com Radix */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleRollClick}
          title="Rolar"
        >
          <Play className="w-3.5 h-3.5 text-primary" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleRollClick}>
              <Play className="w-4 h-4 mr-2" />
              Rolar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleEditClick}>
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicateClick}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
});

export default MacrosPanel;
