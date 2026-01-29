import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
// ScrollArea removido - usando overflow nativo para evitar bug #185 com React 19
import { Input } from '@/components/ui/input';
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
  Crosshair,
  Heart,
  Zap,
  Brain,
  Check,
  Plus,
  AlertTriangle,
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { useCharacterClone } from '@/hooks/useCharacterClone';

// Interface base do personagem
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

// Personagem com info de uso em outras campanhas
interface CharacterWithUsage extends Character {
  usedInCampaign: {
    id: string;
    name: string;
  } | null;
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
  const navigate = useNavigate();
  const { cloneCharacter, isCloning } = useCharacterClone();
  
  const [characters, setCharacters] = useState<CharacterWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(currentCharacterId);
  const [saving, setSaving] = useState(false);
  
  // Estado para clonagem
  const [cloningCharacter, setCloningCharacter] = useState<CharacterWithUsage | null>(null);
  const [cloneName, setCloneName] = useState('');

  useEffect(() => {
    if (open && user) {
      fetchCharacters();
      setSelectedId(currentCharacterId);
      setCloningCharacter(null);
      setCloneName('');
    }
  }, [open, user, currentCharacterId]);

  // Busca personagens e verifica quais estão em uso em outras campanhas
  const fetchCharacters = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Buscar personagens do usuário
      const { data: chars, error: charsError } = await supabase
        .from('characters')
        .select('id, name, class, origin, nex, patent, hp_current, hp_max, pe_current, pe_max, san_current, san_max')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (charsError) throw charsError;
      if (!chars || chars.length === 0) {
        setCharacters([]);
        return;
      }

      // Buscar quais personagens estão em outras campanhas (excluindo a atual)
      const characterIds = chars.map(c => c.id);
      const { data: usedChars, error: usedError } = await supabase
        .from('campaign_members')
        .select(`
          character_id,
          campaigns:campaign_id(id, name)
        `)
        .in('character_id', characterIds)
        .neq('campaign_id', campaignId);

      if (usedError) {
        console.error('Error fetching used characters:', usedError);
      }

      // Mapear personagens com info de uso
      const charactersWithUsage: CharacterWithUsage[] = chars.map(char => {
        const usage = usedChars?.find(u => u.character_id === char.id);
        // Extrair info da campanha (campaigns pode ser objeto ou null)
        const campaignInfo = usage?.campaigns as { id: string; name: string } | null;
        
        return {
          ...char,
          usedInCampaign: campaignInfo || null
        };
      });
      
      setCharacters(charactersWithUsage);
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

  // Handler para seleção - impede selecionar personagens em uso
  const handleCharacterClick = (char: CharacterWithUsage) => {
    // Se está em uso em outra campanha, não permite selecionar
    if (char.usedInCampaign) return;
    
    const isSelected = selectedId === char.id;
    setSelectedId(isSelected ? null : char.id);
  };

  // Inicia o processo de clonagem
  const handleStartClone = (char: CharacterWithUsage, e: React.MouseEvent) => {
    e.stopPropagation(); // Não seleciona o personagem
    setCloningCharacter(char);
    setCloneName(`${char.name} (Cópia)`);
  };

  // Executa a clonagem
  const handleConfirmClone = async () => {
    if (!cloningCharacter) return;
    
    const result = await cloneCharacter(
      cloningCharacter.id,
      cloneName,
      campaignId
    );

    if (result.success && result.characterId) {
      // Atualiza a lista e seleciona o novo personagem
      await fetchCharacters();
      setSelectedId(result.characterId);
      setCloningCharacter(null);
      setCloneName('');
    }
  };

  // Cancela a clonagem
  const handleCancelClone = () => {
    setCloningCharacter(null);
    setCloneName('');
  };

  // Se está no modo de clonagem, mostra interface específica
  if (cloningCharacter) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl tracking-wider flex items-center gap-2">
              <Copy className="w-5 h-5 text-primary" />
              CLONAR PERSONAGEM
            </DialogTitle>
            <DialogDescription>
              Criar uma cópia de <strong>{cloningCharacter.name}</strong> para usar nesta campanha.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Info do personagem original */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  {(() => {
                    const ClassIcon = CLASS_ICONS[cloningCharacter.class] || Shield;
                    return <ClassIcon className="w-5 h-5 text-primary" />;
                  })()}
                </div>
                <div>
                  <p className="font-medium">{cloningCharacter.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {cloningCharacter.class} • {cloningCharacter.origin} • NEX {cloningCharacter.nex}%
                  </p>
                </div>
              </div>
            </div>

            {/* Nome do clone */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do novo personagem</label>
              <Input
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                placeholder="Digite o nome..."
                className="bg-background"
              />
            </div>

            {/* Aviso sobre o que é copiado */}
            <div className="text-xs text-muted-foreground p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="font-medium text-amber-500 mb-1">O que será copiado:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Atributos, perícias e poderes</li>
                <li>Classe, origem e trilha</li>
                <li>Rituais e habilidades paranormais</li>
                <li>Aparência e personalidade</li>
              </ul>
              <p className="mt-2 text-amber-500/80">
                <strong>Nota:</strong> PV, PE e SAN começam no máximo. Inventário e condições são resetados.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCancelClone}
              disabled={isCloning}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmClone}
              disabled={isCloning || !cloneName.trim()}
              className="font-display tracking-wider"
            >
              {isCloning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Copy className="w-4 h-4 mr-2" />
              CLONAR E USAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

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
              <Link to={`/character/create?campaign=${campaignId}`} onClick={() => onOpenChange(false)}>
                <Button className="font-display">
                  <Plus className="w-4 h-4 mr-2" />
                  CRIAR PERSONAGEM
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-0 max-h-[50vh] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                <div className="grid gap-3 pr-4">
                  {characters.map((char) => {
                    const isSelected = selectedId === char.id;
                    const isUsedElsewhere = !!char.usedInCampaign;
                    const ClassIcon = CLASS_ICONS[char.class] || Shield;
                    
                    return (
                      <button
                        key={char.id}
                        onClick={() => handleCharacterClick(char)}
                        disabled={isUsedElsewhere}
                        className={cn(
                          'w-full text-left p-4 rounded-lg border-2 transition-all duration-200 relative',
                          isUsedElsewhere 
                            ? 'opacity-60 cursor-not-allowed border-muted bg-muted/20' 
                            : 'hover:border-primary/50',
                          isSelected && !isUsedElsewhere
                            ? 'border-primary bg-primary/10' 
                            : !isUsedElsewhere && 'border-border bg-muted/30'
                        )}
                      >
                        {/* Badge de "Em uso" OU botão de clonar */}
                        {isUsedElsewhere && (
                          <div className="absolute top-2 right-2 flex items-center gap-2">
                            {/* Botão de clonar para personagens em uso */}
                            <button
                              onClick={(e) => handleStartClone(char, e)}
                              className="flex items-center gap-1 px-2 py-1 bg-primary/20 border border-primary/30 rounded text-xs text-primary hover:bg-primary/30 transition-colors"
                              title="Clonar para esta campanha"
                            >
                              <Copy className="w-3 h-3" />
                              Clonar
                            </button>
                            <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded text-xs text-amber-500">
                              <AlertTriangle className="w-3 h-3" />
                              Em uso
                            </div>
                          </div>
                        )}

                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              'w-12 h-12 rounded-lg flex items-center justify-center',
                              isUsedElsewhere ? 'bg-muted/50' :
                              isSelected ? 'bg-primary/20' : 'bg-muted'
                            )}>
                              <ClassIcon className={cn(
                                'w-6 h-6',
                                isUsedElsewhere ? 'text-muted-foreground/50' :
                                isSelected ? 'text-primary' : 'text-muted-foreground'
                              )} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className={cn(
                                  'font-display text-lg tracking-wider',
                                  isUsedElsewhere && 'text-muted-foreground',
                                  isSelected && !isUsedElsewhere && 'text-primary'
                                )}>
                                  {char.name}
                                </h3>
                                {isSelected && !isUsedElsewhere && (
                                  <Check className="w-4 h-4 text-primary" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {char.class} • {char.origin} • NEX {char.nex}%
                              </p>
                              <p className="text-xs text-muted-foreground/70 mt-1">
                                {char.patent}
                              </p>
                              
                              {/* Aviso de campanha em uso */}
                              {isUsedElsewhere && (
                                <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Já está em "{char.usedInCampaign!.name}" - use "Clonar" para criar cópia
                                </p>
                              )}
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
              </div>

              {/* Separador e botão criar novo */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-3 text-muted-foreground text-xs uppercase tracking-wider">ou</span>
                  </div>
                </div>
                
                <Link 
                  to={`/character/create?campaign=${campaignId}`} 
                  onClick={() => onOpenChange(false)}
                  className="block"
                >
                  <Button variant="outline" className="w-full font-display tracking-wider gap-2">
                    <Plus className="w-4 h-4" />
                    CRIAR NOVO PERSONAGEM
                  </Button>
                </Link>
              </div>
            </>
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
