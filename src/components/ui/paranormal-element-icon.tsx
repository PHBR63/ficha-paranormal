/** Exibe os símbolos oficiais sem modificar IDs, regras ou seleções de elementos. */
import { cn } from '@/lib/utils';
import { ELEMENT_SYMBOLS, type ElementSymbolId } from '@/components/icons/element-symbols';
import { ELEMENT_CONFIG } from '@/lib/element-config';

export type ParanormalElementType = ElementSymbolId;
interface ParanormalElementIconProps {
  element: ParanormalElementType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'simple' | 'glow' | 'animated';
  className?: string;
}
const sizeMap = { sm: 24, md: 32, lg: 48, xl: 64 };

export const elementLabels: Record<ParanormalElementType, string> = {
  sangue: 'Sangue', morte: 'Morte', conhecimento: 'Conhecimento', energia: 'Energia', medo: 'Medo',
};

/** Mantém a API anterior e respeita a preferência por movimento reduzido. */
export function ParanormalElementIcon({ element, size = 'md', variant = 'simple', className }: ParanormalElementIconProps) {
  const Symbol = ELEMENT_SYMBOLS[element];
  const config = ELEMENT_CONFIG[element];
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center',
        variant === 'animated' && 'motion-safe:animate-pulse-slow', className)}
      style={variant === 'simple' ? undefined : { filter: `drop-shadow(0 0 3px ${config.hexLight}66)` }}
    >
      <Symbol size={sizeMap[size]} role="img" aria-label={config.label} />
    </span>
  );
}

export function ParanormalElementsRow({ size = 'md', variant = 'glow', className }: Omit<ParanormalElementIconProps, 'element'>) {
  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-4', className)}>
      {(Object.keys(ELEMENT_SYMBOLS) as ParanormalElementType[]).map(element => (
        <ParanormalElementIcon key={element} element={element} size={size} variant={variant} />
      ))}
    </div>
  );
}
export default ParanormalElementIcon;
