/** Origem acrescentada pelo servidor; nunca enviada como autorização pelo cliente. */
export interface EffectOrigin {
  applicationId: string;
  castEventId: string;
  ritualId: string;
  ritualName: string;
  campaignId: string;
  campaignVersion: 'v2';
  sceneNumber: number;
  expiresAtSceneEnd?: boolean;
}
export type EffectDuration = 'cena' | 'rodadas' | 'sustentado' | 'permanente' | 'manual';
export interface EffectDurationMetadata {
  duration?: EffectDuration;
  effectOrigin?: EffectOrigin;
}
