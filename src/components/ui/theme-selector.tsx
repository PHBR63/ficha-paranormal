import { Palette, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useColorTheme, ColorTheme } from '@/contexts/ColorThemeContext';
import { cn } from '@/lib/utils';
import { restoreHelpButton, isHelpButtonDismissed } from '@/components/character/CharacterSheetHelp';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const THEMES: { id: ColorTheme; name: string; color: string }[] = [
  { id: 'purple', name: 'Roxo Abissal', color: '#8B5CF6' },
  { id: 'red', name: 'Sangue Ritual', color: '#DC2626' },
  { id: 'green', name: 'Conhecimento', color: '#22C55E' },
  { id: 'blue', name: 'Ciano Espectral', color: '#0EA5E9' },
  { id: 'amber', name: 'Energia Arcana', color: '#F59E0B' },
];

export function ThemeSelector() {
  const { colorTheme, setColorTheme } = useColorTheme();
  const currentTheme = THEMES.find(t => t.id === colorTheme);
  const [helpDismissed, setHelpDismissed] = useState(false);

  // Verifica se o botão de ajuda está dispensado
  useEffect(() => {
    setHelpDismissed(isHelpButtonDismissed());
    
    // Listener para atualizar quando o botão for restaurado
    const handleRestore = () => setHelpDismissed(false);
    window.addEventListener('help-button-restored', handleRestore);
    return () => window.removeEventListener('help-button-restored', handleRestore);
  }, []);

  // Handler para restaurar o botão de ajuda
  const handleRestoreHelp = () => {
    restoreHelpButton();
    setHelpDismissed(false);
    toast.success('Botão de ajuda restaurado!');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <div 
            className="w-5 h-5 rounded-full border-2 border-current"
            style={{ backgroundColor: currentTheme?.color }}
          />
          <span className="sr-only">Selecionar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {THEMES.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => setColorTheme(theme.id)}
            className={cn(
              "flex items-center gap-3 cursor-pointer",
              colorTheme === theme.id && "bg-accent"
            )}
          >
            <div 
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: theme.color }}
            />
            <span className="flex-1">{theme.name}</span>
            {colorTheme === theme.id && (
              <div className="w-2 h-2 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
        
        {/* Opção para restaurar botão de ajuda se estiver dispensado */}
        {helpDismissed && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleRestoreHelp}
              className="flex items-center gap-3 cursor-pointer text-muted-foreground"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="flex-1">Restaurar botão de ajuda</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
