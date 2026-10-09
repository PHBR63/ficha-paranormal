/** Símbolos extraídos do Livro Base v1.3; imagens locais, sem redes externas. */
import { forwardRef, useId } from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';

export type ElementSymbolId = 'sangue' | 'morte' | 'conhecimento' | 'energia' | 'medo';

/** Adaptador SVG compatível com os mapas de ícones e refs já usados nas telas. */
function elementSymbol(element: ElementSymbolId): LucideIcon {
  const Component = forwardRef<SVGSVGElement, LucideProps>(
    ({ size = 24, children, absoluteStrokeWidth: _absoluteStrokeWidth, ...props }, ref) => {
      const clipId = useId();
      return (
      <svg
        ref={ref} width={size} height={size} viewBox="0 0 64 64" fill="none"
        aria-hidden={props['aria-label'] || props['aria-labelledby'] ? undefined : true}
        {...props} data-element-symbol={element}
      >
        <defs><clipPath id={clipId}><circle cx="32" cy="32" r="32" /></clipPath></defs>
        <image clipPath={`url(#${clipId})`} href={`/icons/elements/${element}.png`} width="64" height="64" preserveAspectRatio="xMidYMid meet" />
        {children}
      </svg>
      );
    },
  );
  Component.displayName = `ElementSymbol(${element})`;
  return Component;
}

export const SangueSymbol = elementSymbol('sangue');
export const MorteSymbol = elementSymbol('morte');
export const ConhecimentoSymbol = elementSymbol('conhecimento');
export const EnergiaSymbol = elementSymbol('energia');
export const MedoSymbol = elementSymbol('medo');
export const ELEMENT_SYMBOLS = {
  sangue: SangueSymbol, morte: MorteSymbol, conhecimento: ConhecimentoSymbol,
  energia: EnergiaSymbol, medo: MedoSymbol,
} satisfies Record<ElementSymbolId, LucideIcon>;
