// Painel de Histórico de Alterações do Personagem
// Mostra todas as mudanças feitas no personagem ao longo do tempo

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { History, ArrowRight, User, Dices, BookOpen, FileText, Heart, Zap, Brain, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Tipos para o histórico
interface ChangeEntry {
  id: string;
  character_id: string;
  user_id: string;
  change_type: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  description: string | null;
  created_at: string;
}
interface CharacterHistoryPanelProps {
  characterId: string;
  characterName: string;
}

// Mapeamento de tipos para ícones e cores
const changeTypeConfig: Record<string, {
  icon: React.ElementType;
  color: string;
  label: string;
}> = {
  attribute: {
    icon: Dices,
    color: 'text-primary',
    label: 'Atributo'
  },
  skill: {
    icon: BookOpen,
    color: 'text-secondary',
    label: 'Perícia'
  },
  info: {
    icon: User,
    color: 'text-accent',
    label: 'Informação'
  },
  stats: {
    icon: Heart,
    color: 'text-destructive',
    label: 'Status'
  },
  defense: {
    icon: Zap,
    color: 'text-warning',
    label: 'Defesa'
  },
  photo: {
    icon: User,
    color: 'text-muted-foreground',
    label: 'Foto'
  }
};

// Mapeamento de nomes de campos para português
const fieldNameMap: Record<string, string> = {
  name: 'Nome',
  player_name: 'Nome do Jogador',
  age: 'Idade',
  gender: 'Gênero',
  appearance: 'Aparência',
  personality: 'Personalidade',
  background: 'História',
  notes: 'Notas',
  agility: 'Agilidade',
  strength: 'Força',
  intellect: 'Intelecto',
  presence: 'Presença',
  vigor: 'Vigor',
  defense: 'Defesa',
  photo_url: 'Foto',
  skills: 'Perícias',
  hp_current: 'PV Atual',
  hp_max: 'PV Máximo',
  pe_current: 'PE Atual',
  pe_max: 'PE Máximo',
  san_current: 'SAN Atual',
  san_max: 'SAN Máximo'
};
export function CharacterHistoryPanel({
  characterId,
  characterName
}: CharacterHistoryPanelProps) {
  const {
    user
  } = useAuth();
  const [history, setHistory] = useState<ChangeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Carrega histórico quando abre o painel
  useEffect(() => {
    if (open && characterId) {
      loadHistory();
    }
  }, [open, characterId]);

  // Função para carregar histórico do banco
  const loadHistory = async () => {
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from('character_change_history').select('*').eq('character_id', characterId).order('created_at', {
        ascending: false
      }).limit(100);
      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para limpar histórico
  const clearHistory = async () => {
    if (!confirm('Tem certeza que deseja limpar todo o histórico?')) return;
    try {
      const {
        error
      } = await supabase.from('character_change_history').delete().eq('character_id', characterId);
      if (error) throw error;
      setHistory([]);
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
    }
  };

  // Agrupa histórico por data
  const groupedHistory = history.reduce((groups, entry) => {
    const date = format(new Date(entry.created_at), 'dd/MM/yyyy', {
      locale: ptBR
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, ChangeEntry[]>);
  return <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-xs text-justify">
          <History className="w-4 h-4" />
          Histórico de edição do personagem  
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display tracking-wider flex items-center gap-2">
            <History className="w-5 h-5" />
            HISTÓRICO DE ALTERAÇÕES
          </SheetTitle>
          <p className="text-sm text-muted-foreground">{characterName}</p>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Ações */}
          {history.length > 0 && <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearHistory} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Histórico
              </Button>
            </div>}

          <ScrollArea className="h-[calc(100vh-200px)]">
            {loading ?
          // Loading skeleton
          <div className="space-y-4">
                {[...Array(5)].map((_, i) => <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-16 w-full" />
                  </div>)}
              </div> : history.length === 0 ?
          // Empty state
          <div className="text-center py-12">
                <History className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma alteração registrada ainda.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  As alterações feitas no personagem aparecerão aqui.
                </p>
              </div> :
          // Lista de histórico agrupado por data
          <div className="space-y-6 pr-4">
                <AnimatePresence>
                  {Object.entries(groupedHistory).map(([date, entries]) => <motion.div key={date} initial={{
                opacity: 0,
                y: 10
              }} animate={{
                opacity: 1,
                y: 0
              }} className="space-y-3">
                      {/* Data */}
                      <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-1 z-10">
                        <Badge variant="outline" className="text-xs">
                          {date}
                        </Badge>
                      </div>

                      {/* Entradas do dia */}
                      {entries.map(entry => {
                  const config = changeTypeConfig[entry.change_type] || {
                    icon: FileText,
                    color: 'text-muted-foreground',
                    label: entry.change_type
                  };
                  const Icon = config.icon;
                  const fieldLabel = fieldNameMap[entry.field_name] || entry.field_name;
                  const time = format(new Date(entry.created_at), 'HH:mm', {
                    locale: ptBR
                  });
                  return <motion.div key={entry.id} initial={{
                    opacity: 0,
                    x: -10
                  }} animate={{
                    opacity: 1,
                    x: 0
                  }} className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className={`w-4 h-4 ${config.color}`} />
                                <span className="text-sm font-medium">{fieldLabel}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">{time}</span>
                            </div>

                            {/* Valores */}
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground line-through truncate max-w-[120px]">
                                {entry.old_value || '(vazio)'}
                              </span>
                              <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="text-foreground font-medium truncate max-w-[120px]">
                                {entry.new_value || '(vazio)'}
                              </span>
                            </div>

                            {/* Descrição opcional */}
                            {entry.description && <p className="text-xs text-muted-foreground italic">
                                {entry.description}
                              </p>}
                          </motion.div>;
                })}
                    </motion.div>)}
                </AnimatePresence>
              </div>}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>;
}

// Função utilitária para registrar alterações no histórico
export async function logCharacterChange(characterId: string, userId: string, changeType: string, fieldName: string, oldValue: string | null, newValue: string | null, description?: string) {
  try {
    const {
      error
    } = await supabase.from('character_change_history').insert({
      character_id: characterId,
      user_id: userId,
      change_type: changeType,
      field_name: fieldName,
      old_value: oldValue,
      new_value: newValue,
      description: description || null
    });
    if (error) {
      console.error('Erro ao registrar alteração:', error);
    }
  } catch (error) {
    console.error('Erro ao registrar alteração:', error);
  }
}

// Função para registrar múltiplas alterações de uma vez
export async function logCharacterChanges(characterId: string, userId: string, changes: Array<{
  changeType: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  description?: string;
}>) {
  if (changes.length === 0) return;
  try {
    const entries = changes.map(change => ({
      character_id: characterId,
      user_id: userId,
      change_type: change.changeType,
      field_name: change.fieldName,
      old_value: change.oldValue,
      new_value: change.newValue,
      description: change.description || null
    }));
    const {
      error
    } = await supabase.from('character_change_history').insert(entries);
    if (error) {
      console.error('Erro ao registrar alterações:', error);
    }
  } catch (error) {
    console.error('Erro ao registrar alterações:', error);
  }
}