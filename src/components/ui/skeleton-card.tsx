/**
 * SkeletonCard - Cards skeleton para loading states mobile
 * Versões otimizadas para diferentes contextos
 */

import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

interface SkeletonCardProps {
  className?: string;
}

/** Skeleton para card de status (HP/PE/SAN) */
export function SkeletonStatusCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("ordo-panel p-3 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-12" />
      </div>
      {/* Barras de recursos */}
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton para card de atributos */
export function SkeletonAttributesCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("ordo-panel p-3", className)}>
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </div>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-2 bg-muted/30 rounded text-center space-y-1">
            <Skeleton className="h-3 w-8 mx-auto" />
            <Skeleton className="h-6 w-6 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton para item de perícia */
export function SkeletonSkillItem({ className }: SkeletonCardProps) {
  return (
    <div className={cn("flex items-center justify-between p-2.5 rounded-lg bg-muted/20", className)}>
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-8" />
        <Skeleton className="h-4 w-4" />
      </div>
    </div>
  );
}

/** Skeleton para card de poder/ritual */
export function SkeletonPowerCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("p-3 rounded-lg border border-border bg-card/50", className)}>
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-4 w-4" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4 mt-1" />
    </div>
  );
}

/** Skeleton para card de arma */
export function SkeletonWeaponCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("p-3 rounded-lg border border-border bg-card/50", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-10 rounded-full" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-10" />
      </div>
    </div>
  );
}

/** Skeleton para item de inventário */
export function SkeletonInventoryItem({ className }: SkeletonCardProps) {
  return (
    <div className={cn("p-3 rounded-lg border border-border bg-card/50", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-4 w-28 mb-1" />
          <div className="flex gap-2">
            <Skeleton className="h-4 w-14 rounded-full" />
            <Skeleton className="h-4 w-10 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Lista de skeletons de perícia */
export function SkeletonSkillsList({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonSkillItem key={i} />
      ))}
    </div>
  );
}

/** Lista de skeletons de poderes */
export function SkeletonPowersList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPowerCard key={i} />
      ))}
    </div>
  );
}

export default SkeletonStatusCard;
