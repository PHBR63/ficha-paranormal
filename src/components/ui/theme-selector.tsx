/**
 * ThemeSelector - Seletor de tema com suporte a MobileActionSheet
 * 
 * Usa MobileActionSheet no mobile para melhor UX nativa
 * Mantém DropdownMenu no desktop para comportamento padrão
 */

import { Palette, HelpCircle, Bug, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MobileActionSheet, useActionSheet } from '@/components/ui/mobile-action-sheet';
import { useColorTheme, ColorTheme } from '@/contexts/ColorThemeContext';
import { cn } from '@/lib/utils';
import { restoreHelpButton, isHelpButtonDismissed } from '@/components/character/CharacterSheetHelp';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks';

const THEMES: { id: ColorTheme; name: string; color: string }[] = [
  { id: 'purple', name: 'Pulso Entrópico', color: '#7B3FE4' },
  { id: 'red', name: 'Carnificina Viva', color: '#8B1E1E' },
  { id: 'green', name: 'Sigilo Dourado', color: '#D4AF37' },
  { id: 'blue', name: 'Abismo Observador', color: '#0F3D2E' },
  { id: 'amber', name: 'Cinza Terminal', color: '#5A5E5A' },
];

export function ThemeSelector() {
  const { colorTheme, setColorTheme } = useColorTheme();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const actionSheet = useActionSheet();
  const currentTheme = THEMES.find(t => t.id === colorTheme);
  const [helpDismissed, setHelpDismissed] = useState(false);
  const [developerMode, setDeveloperMode] = useState(false);
  const [isTogglingDev, setIsTogglingDev] = useState(false);

  // Carrega preferência de modo desenvolvedor
  useEffect(() => {
    if (!user) return;
    
    const loadDeveloperMode = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('developer_mode')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setDeveloperMode(data.developer_mode ?? false);
      }
    };
    
    loadDeveloperMode();
  }, [user]);

  // Verifica se o botão de ajuda está dispensado
  useEffect(() => {
    setHelpDismissed(isHelpButtonDismissed());
    
    // Listener para atualizar quando o botão for restaurado
    const handleRestore = () => setHelpDismissed(false);
    window.addEventListener('help-button-restored', handleRestore);
    return () => window.removeEventListener('help-button-restored', handleRestore);
  }, []);

  // Handler para restaurar o botão de ajuda
  const handleRestoreHelp = useCallback(() => {
    restoreHelpButton();
    setHelpDismissed(false);
    toast.success('Botão de ajuda restaurado!');
  }, []);

  // Handler para toggle do modo desenvolvedor
  const handleToggleDeveloperMode = useCallback(async () => {
    if (!user || isTogglingDev) return;
    
    setIsTogglingDev(true);
    const newValue = !developerMode;
    
    const { error } = await supabase
      .from('profiles')
      .update({ developer_mode: newValue })
      .eq('user_id', user.id);
    
    if (error) {
      toast.error('Erro ao atualizar preferência');
      console.error('[ThemeSelector] Erro ao atualizar developer_mode:', error);
    } else {
      setDeveloperMode(newValue);
      toast.success(newValue ? 'Modo desenvolvedor ativado' : 'Modo desenvolvedor desativado');
      
      // Dispara evento para componentes que precisam reagir à mudança
      window.dispatchEvent(new CustomEvent('developer-mode-changed', { detail: { enabled: newValue } }));
    }
    
    setIsTogglingDev(false);
  }, [user, developerMode, isTogglingDev]);

  // Ações para o MobileActionSheet agrupadas
  const actionSheetGroups = useMemo(() => {
    const themeActions = THEMES.map(theme => ({
      id: theme.id as string,
      label: theme.name,
      description: colorTheme === theme.id ? '✓ Selecionado' : undefined,
      onPress: () => setColorTheme(theme.id),
    }));

    const configActions: Array<{
      id: string;
      label: string;
      icon?: typeof Bug;
      description?: string;
      disabled?: boolean;
      onPress: () => void;
    }> = [
      {
        id: 'dev-mode',
        label: 'Modo Desenvolvedor',
        icon: Bug,
        description: developerMode ? 'Ativado' : 'Desativado',
        disabled: isTogglingDev,
        onPress: handleToggleDeveloperMode,
      },
    ];

    // Adiciona opção de restaurar ajuda se estiver dispensado
    if (helpDismissed) {
      configActions.push({
        id: 'restore-help',
        label: 'Restaurar botão de ajuda',
        icon: HelpCircle,
        onPress: handleRestoreHelp,
      });
    }

    return [
      { title: 'Temas', actions: themeActions },
      { title: 'Configurações', actions: configActions },
    ];
  }, [colorTheme, setColorTheme, developerMode, isTogglingDev, handleToggleDeveloperMode, helpDismissed, handleRestoreHelp]);

  const triggerButton = (
    <Button 
      variant="ghost" 
      size="icon"
      className="text-muted-foreground hover:text-foreground"
      onClick={isMobile ? actionSheet.open : undefined}
    >
      <div 
        className="w-5 h-5 rounded-full border-2 border-current"
        style={{ backgroundColor: currentTheme?.color }}
      />
      <span className="sr-only">Selecionar tema</span>
    </Button>
  );

  // Mobile: usa MobileActionSheet
  if (isMobile) {
    return (
      <>
        {triggerButton}
        <MobileActionSheet
          open={actionSheet.isOpen}
          onOpenChange={actionSheet.setIsOpen}
          title="Configurações"
          groups={actionSheetGroups}
        />
      </>
    );
  }

  // Desktop: usa DropdownMenu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {triggerButton}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
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
        
        <DropdownMenuSeparator />
        
        {/* Modo Desenvolvedor */}
        <DropdownMenuItem
          onClick={handleToggleDeveloperMode}
          disabled={isTogglingDev}
          className="flex items-center gap-3 cursor-pointer"
        >
          <Bug className={cn("w-4 h-4", developerMode && "text-green-500")} />
          <span className="flex-1">Modo Desenvolvedor</span>
          {developerMode && (
            <Check className="w-4 h-4 text-green-500" />
          )}
        </DropdownMenuItem>
        
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

/**
 * Hook para verificar se o modo desenvolvedor está ativado
 * Usado por componentes que precisam condicionar funcionalidades
 */
export function useDeveloperMode() {
  const { user } = useAuth();
  const [developerMode, setDeveloperMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDeveloperMode(false);
      setIsLoading(false);
      return;
    }
    
    const loadDeveloperMode = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('developer_mode')
        .eq('user_id', user.id)
        .single();
      
      setDeveloperMode(data?.developer_mode ?? false);
      setIsLoading(false);
    };
    
    loadDeveloperMode();
    
    // Listener para mudanças via ThemeSelector
    const handleChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      setDeveloperMode(customEvent.detail.enabled);
    };
    
    window.addEventListener('developer-mode-changed', handleChange);
    return () => window.removeEventListener('developer-mode-changed', handleChange);
  }, [user]);

  return { developerMode, isLoading };
}
