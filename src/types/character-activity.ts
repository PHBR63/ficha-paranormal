import type { Json } from '@/integrations/supabase/types';

export type ActivityCategory = 'roll' | 'ritual' | 'application';
export interface CharacterActivityEvent {
  id: string;
  operation_id: string;
  character_id: string;
  author_id: string;
  category: ActivityCategory;
  payload: Json;
  status: 'pending' | 'confirmed';
  created_at: string;
  campaign_id: string | null;
  campaign_version: 'v1' | 'v2' | null;
}
export interface ActivityCursor { createdAt: string; id: string }
export type ActivityPeriod = 'all' | '7d' | '30d';
export interface ActivitySession {
  id: string;
  campaign_id: string;
  campaign_version: 'v1' | 'v2';
  session_number: number;
  title: string | null;
  campaign_name: string;
  session_date: string;
}
export interface ActivityContext { campaignId?: string; campaignVersion?: 'v1' | 'v2' }
export type ActivityPayload = Record<string, Json | undefined>;
export interface PendingRoll { operationId: string; payload: ActivityPayload; queuedAt: string }
export type EffectKind = 'heal' | 'damage' | 'temporary_hp' | 'conditions' | 'weapon_buff' | 'sustain';
export interface ApplyCharacterEffectInput extends ActivityContext {
  operationId: string;
  characterId: string;
  kind: EffectKind;
  value: Json;
  expected: ActivityPayload;
  castEventId?: string;
}

