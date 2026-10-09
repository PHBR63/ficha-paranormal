/**
 * Biblioteca visual do Ordem Roll. Mantém a API Lucide dos controles existentes
 * e usa glifos duotone para investigação, combate e recursos de jogo.
 * Não confunde ícones de ações com os símbolos oficiais dos elementos.
 */
import { forwardRef } from 'react';
import type { LucideProps, LucideIcon } from 'lucide-react';
import type { Icon } from '@phosphor-icons/react';
import { Backpack as BackpackGlyph } from '@phosphor-icons/react/dist/csr/Backpack';
import { BookOpenText as BookOpenTextGlyph } from '@phosphor-icons/react/dist/csr/BookOpenText';
import { Brain as BrainGlyph } from '@phosphor-icons/react/dist/csr/Brain';
import { Compass as CompassGlyph } from '@phosphor-icons/react/dist/csr/Compass';
import { Crosshair as CrosshairGlyph } from '@phosphor-icons/react/dist/csr/Crosshair';
import { Crown as CrownGlyph } from '@phosphor-icons/react/dist/csr/Crown';
import { DiceFive as DiceFiveGlyph } from '@phosphor-icons/react/dist/csr/DiceFive';
import { Eye as EyeGlyph } from '@phosphor-icons/react/dist/csr/Eye';
import { Fire as FireGlyph } from '@phosphor-icons/react/dist/csr/Fire';
import { Ghost as GhostGlyph } from '@phosphor-icons/react/dist/csr/Ghost';
import { Heart as HeartGlyph } from '@phosphor-icons/react/dist/csr/Heart';
import { Hourglass as HourglassGlyph } from '@phosphor-icons/react/dist/csr/Hourglass';
import { Lightning as LightningGlyph } from '@phosphor-icons/react/dist/csr/Lightning';
import { MagicWand as MagicWandGlyph } from '@phosphor-icons/react/dist/csr/MagicWand';
import { MapTrifold as MapTrifoldGlyph } from '@phosphor-icons/react/dist/csr/MapTrifold';
import { Scroll as ScrollGlyph } from '@phosphor-icons/react/dist/csr/Scroll';
import { Shield as ShieldGlyph } from '@phosphor-icons/react/dist/csr/Shield';
import { ShieldCheck as ShieldCheckGlyph } from '@phosphor-icons/react/dist/csr/ShieldCheck';
import { Skull as SkullGlyph } from '@phosphor-icons/react/dist/csr/Skull';
import { Sparkle as SparkleGlyph } from '@phosphor-icons/react/dist/csr/Sparkle';
import { Sword as SwordGlyph } from '@phosphor-icons/react/dist/csr/Sword';
import { Timer as TimerGlyph } from '@phosphor-icons/react/dist/csr/Timer';
import { UserCircle as UserCircleGlyph } from '@phosphor-icons/react/dist/csr/UserCircle';
import { UserPlus as UserPlusGlyph } from '@phosphor-icons/react/dist/csr/UserPlus';
import { UsersThree as UsersThreeGlyph } from '@phosphor-icons/react/dist/csr/UsersThree';

export * from 'lucide-react';

/** Preserva tamanho, cor, ref e rótulos acessíveis recebidos pelas telas. */
function gameIcon(Glyph: Icon, name: string): LucideIcon {
  const Component = forwardRef<SVGSVGElement, LucideProps>(
    ({ size = 24, className, absoluteStrokeWidth: _absoluteStrokeWidth, strokeWidth: _strokeWidth, ...props }, ref) => (
      <Glyph
        ref={ref}
        size={size}
        weight="duotone"
        aria-hidden={props['aria-label'] || props['aria-labelledby'] ? undefined : true}
        {...props}
        fill={!props.fill || props.fill === 'none' ? 'currentColor' : props.fill}
        className={`lucide lucide-${name} ordem-game-icon ${className ?? ''}`}
      />
    ),
  );
  Component.displayName = `Ordem${name}`;
  return Component;
}

export const Brain = gameIcon(BrainGlyph, "brain");
export const Heart = gameIcon(HeartGlyph, "heart");
export const Shield = gameIcon(ShieldGlyph, "shield");
export const ShieldCheck = gameIcon(ShieldCheckGlyph, "shield-check");
export const Users = gameIcon(UsersThreeGlyph, "users");
export const User = gameIcon(UserCircleGlyph, "user");
export const UserPlus = gameIcon(UserPlusGlyph, "user-plus");
export const Skull = gameIcon(SkullGlyph, "skull");
export const Ghost = gameIcon(GhostGlyph, "ghost");
export const Sword = gameIcon(SwordGlyph, "sword");
export const Swords = gameIcon(SwordGlyph, "swords");
export const Scroll = gameIcon(ScrollGlyph, "scroll");
export const BookOpen = gameIcon(BookOpenTextGlyph, "book-open");
export const Target = gameIcon(CrosshairGlyph, "target");
export const Crosshair = gameIcon(CrosshairGlyph, "crosshair");
export const Map = gameIcon(MapTrifoldGlyph, "map");
export const Compass = gameIcon(CompassGlyph, "compass");
export const Eye = gameIcon(EyeGlyph, "eye");
export const Backpack = gameIcon(BackpackGlyph, "backpack");
export const Timer = gameIcon(TimerGlyph, "timer");
export const Hourglass = gameIcon(HourglassGlyph, "hourglass");
export const Zap = gameIcon(LightningGlyph, "zap");
export const Flame = gameIcon(FireGlyph, "flame");
export const Sparkles = gameIcon(SparkleGlyph, "sparkles");
export const Wand2 = gameIcon(MagicWandGlyph, "wand2");
export const Crown = gameIcon(CrownGlyph, "crown");
export const Dice5 = gameIcon(DiceFiveGlyph, "dice5");
export const Dices = gameIcon(DiceFiveGlyph, "dices");
