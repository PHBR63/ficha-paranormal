import type { EffectDurationMetadata } from '@/types/effect-duration';

/** Mostra prazo e origem por toque; legado sem origem continua explicitamente manual. */
export function EffectDurationNotice({ effect }: { effect: EffectDurationMetadata }) {
  const origin = effect.effectOrigin;
  const scene = origin?.campaignVersion === 'v2' && Number.isSafeInteger(origin.sceneNumber) && origin.sceneNumber > 0;
  const label = effect.duration === 'cena'
    ? scene && origin.expiresAtSceneEnd === true ? `Até encerrar a cena ${origin.sceneNumber} da campanha de origem.` : 'Até o fim da cena — remoção manual; sem expiração automática confirmada.'
    : effect.duration === 'sustentado' ? 'Sustentado — confira manutenção e encerramento.'
    : effect.duration === 'permanente' ? 'Permanente — confira os requisitos de remoção.'
    : effect.duration === 'rodadas' ? 'Duração em rodadas — confira o contador.' : 'Duração manual — sem prazo automático confirmado.';
  return <p className="text-xs text-muted-foreground mt-1 break-words">{label}{scene && origin.ritualName ? ` Origem: ${origin.ritualName}.` : ''}</p>;
}
