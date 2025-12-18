import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Loader2, 
  User, 
  Shield, 
  Skull, 
  Brain, 
  Crosshair,
  Heart,
  Zap,
  Check,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface Character {
  id: string;
  name: string;
  class: string;
  origin: string;
  nex: number;
  patent: string;
  hp_current: number;
  hp_max: number;
  pe_current: number;
  pe_max: number;
  san_current: number;
  san_max: number;
}

interface CharacterSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  currentCharacterId: string | null;
  onCharacterSelect: (characterId: string | null) => Promise<void>;
}

const CLASS_ICONS: Record<string, typeof Shield> = {
  'Combatente': Shield,
  'Especialista': Crosshair,
  'Ocultista': Skull,
};

export function CharacterSelectDialog({
  open,
  onOpenChange,
  campaignId,
  currentCharacterId,
  onCharacterSelect,
}: CharacterSelectDialogProps) {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(currentCharacterId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchCharacters();
      setSelectedId(currentCharacterId);
    }
  }, [open, user, currentCharacterId]);

  const fetchCharacters = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('id, name, class, origin, nex, patent, hp_current, hp_max, pe_current, pe_max, san_current, san_max')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setCharacters(data || []);
    } catch (error) {
      console.error('Error fetching characters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onCharacterSelect(selectedId);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCharacter = async () => {
    setSaving(true);
    try {
      await onCharacterSelect(null);
      setSelectedId(null);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-wider">
            SELECIONAR AGENTE
          </DialogTitle>
          <DialogDescription>
            Escolha qual personagem você usará nesta campanha.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : characters.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-muted/50 flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">
                Você ainda não tem personagens criados.
              </p>
              <Link to="/characters/create">
                <Button className="font-display">
                  <Plus className="w-4 h-4 mr-2" />
                  CRIAR PERSONAGEM
                </Button>
              </Link>
            </div>
          ) : (
            <ScrollArea className="flex-1 min-h-0 max-h-[60vh]">
              <div className="grid gap-3 pr-4">
                {characters.map((char) => {
                  const isSelected = selectedId === char.id;
                  const ClassIcon = CLASS_ICONS[char.class] || Shield;
                  
                  return (
                    <button
                      key={char.id}
                      onClick={() => setSelectedId(isSelected ? null : char.id)}
                      className={cn(
                        'w-full text-left p-4 rounded-lg border-2 transition-all duration-200',
                        'hover:border-primary/50',
                        isSelected 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border bg-muted/30'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'w-12 h-12 rounded-lg flex items-center justify-center',
                            isSelected ? 'bg-primary/20' : 'bg-muted'
                          )}>
                            <ClassIcon className={cn(
                              'w-6 h-6',
                              isSelected ? 'text-primary' : 'text-muted-foreground'
                            )} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className={cn(
                                'font-display text-lg tracking-wider',
                                isSelected && 'text-primary'
                              )}>
                                {char.name}
                              </h3>
                              {isSelected && (
                                <Check className="w-4 h-4 text-primary" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {char.class} • {char.origin} • NEX {char.nex}%
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              {char.patent}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats bars */}
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Heart className="w-3 h-3 text-health" />
                            <span>PV</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-health transition-all"
                              style={{ width: `${(char.hp_current / char.hp_max) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-center">
                            {char.hp_current}/{char.hp_max}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Zap className="w-3 h-3 text-energy" />
                            <span>PE</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-energy transition-all"
                              style={{ width: `${(char.pe_current / char.pe_max) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-center">
                            {char.pe_current}/{char.pe_max}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Brain className="w-3 h-3 text-sanity" />
                            <span>SAN</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-sanity transition-all"
                              style={{ width: `${(char.san_current / char.san_max) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-center">
                            {char.san_current}/{char.san_max}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="gap-2">
          {currentCharacterId && (
            <Button
              variant="outline"
              onClick={handleRemoveCharacter}
              disabled={saving}
              className="text-destructive hover:text-destructive"
            >
              Remover Personagem
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            disabled={saving || characters.length === 0}
            className="font-display tracking-wider"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {selectedId ? 'CONFIRMAR' : 'SEM PERSONAGEM'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
