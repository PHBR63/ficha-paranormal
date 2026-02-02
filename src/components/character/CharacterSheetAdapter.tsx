/**
 * CharacterSheetAdapter - Componente Adaptativo Desktop/Mobile
 * 
 * Ponto de entrada unificado para a ficha de personagem.
 * Renderiza automaticamente a versão desktop ou mobile baseado no dispositivo,
 * compartilhando o mesmo Provider e lógica de negócios.
 * 
 * @module components/character/CharacterSheetAdapter
 */

import { Suspense, lazy, memo } from 'react';
import { useIsMobile } from '@/hooks';
import { CharacterSheetProvider } from '@/contexts/CharacterSheetContext';
import { Loader2 } from 'lucide-react';

// Lazy loading dos layouts para reduzir bundle inicial
const DesktopSheetLayout = lazy(() => 
  import('@/pages/CharacterSheet').then(m => ({ default: m.default }))
);

const MobileSheetLayout = lazy(() => 
  import('./MobileCharacterSheet').then(m => ({ default: m.MobileCharacterSheet }))
);

interface CharacterSheetAdapterProps {
  /** ID do personagem a ser carregado */
  characterId: string;
  /** Callback para exclusão do personagem */
  onDelete?: () => void;
  /** Callback para retorno à lista */
  onBack?: () => void;
}

/**
 * Componente de loading enquanto os layouts são carregados
 */
const SheetLoadingFallback = memo(() => (
  <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse">
        Carregando ficha...
      </p>
    </div>
  </div>
));
SheetLoadingFallback.displayName = 'SheetLoadingFallback';

/**
 * Adapter que renderiza automaticamente Desktop ou Mobile
 * baseado no tamanho da tela, compartilhando o mesmo Provider
 */
export const CharacterSheetAdapter = memo<CharacterSheetAdapterProps>(({
  characterId,
  onDelete,
  onBack,
}) => {
  const isMobile = useIsMobile();

  return (
    <CharacterSheetProvider characterId={characterId}>
      <Suspense fallback={<SheetLoadingFallback />}>
        {/* 
          NOTA: Este adapter é preparação para migração futura.
          Atualmente ambos os layouts (Desktop e Mobile) carregam
          dados internamente via useParams/props.
          
          Quando a migração estiver completa, ambos consumirão
          do CharacterSheetProvider via useCharacterSheetContext().
        */}
        <DesktopSheetLayout />
      </Suspense>
    </CharacterSheetProvider>
  );
});

CharacterSheetAdapter.displayName = 'CharacterSheetAdapter';

export default CharacterSheetAdapter;
