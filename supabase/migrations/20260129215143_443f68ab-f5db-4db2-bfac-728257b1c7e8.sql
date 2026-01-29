-- ====================================================================
-- MIGRAÇÃO DE DADOS: Campanhas v1 → v2
-- Copia todos os dados existentes para o novo schema
-- ====================================================================

-- 1. Migrar campanhas
INSERT INTO public.campaigns_v2 (id, master_id, name, description, cover_image_url, status, current_session, settings, created_at, updated_at)
SELECT 
  id, 
  master_id, 
  name, 
  description, 
  cover_image_url, 
  COALESCE(status, 'active')::text,
  COALESCE(current_session, 0),
  COALESCE(settings, '{}'::jsonb),
  created_at, 
  updated_at
FROM public.campaigns
ON CONFLICT (id) DO NOTHING;

-- 2. Migrar membros (sem duplicar o mestre que já foi criado pelo trigger)
INSERT INTO public.campaign_members_v2 (id, campaign_id, user_id, character_id, role, active_bonuses, bonuses_updated_at, joined_at)
SELECT 
  id,
  campaign_id,
  user_id,
  character_id,
  COALESCE(role, 'player')::text,
  active_bonuses,
  bonuses_updated_at,
  COALESCE(joined_at, now())
FROM public.campaign_members cm
WHERE NOT EXISTS (
  SELECT 1 FROM public.campaign_members_v2 cmv2 
  WHERE cmv2.campaign_id = cm.campaign_id AND cmv2.user_id = cm.user_id
)
ON CONFLICT (campaign_id, user_id) DO NOTHING;

-- 3. Migrar mensagens
INSERT INTO public.campaign_messages_v2 (id, campaign_id, user_id, character_id, recipient_id, message_type, content, metadata, created_at)
SELECT 
  id,
  campaign_id,
  user_id,
  character_id,
  recipient_id,
  COALESCE(message_type, 'chat')::text,
  content,
  COALESCE(metadata, '{}'::jsonb),
  created_at
FROM public.campaign_messages
ON CONFLICT (id) DO NOTHING;

-- 4. Migrar sessões
INSERT INTO public.campaign_sessions_v2 (id, campaign_id, session_number, title, summary, status, scheduled_at, started_at, ended_at, notes, created_at)
SELECT 
  id,
  campaign_id,
  session_number,
  title,
  summary,
  COALESCE(status, 'scheduled')::text,
  scheduled_at,
  started_at,
  ended_at,
  notes,
  created_at
FROM public.campaign_sessions
ON CONFLICT (id) DO NOTHING;

-- 5. Migrar mapas
INSERT INTO public.campaign_maps_v2 (id, campaign_id, created_by, name, image_url, grid_size, grid_type, grid_color, grid_visible, width_cells, height_cells, fog_of_war, is_active, created_at, updated_at)
SELECT 
  id,
  campaign_id,
  created_by,
  name,
  COALESCE(image_url, ''),
  COALESCE(grid_size, 40),
  COALESCE(grid_type, 'square')::text,
  grid_color,
  COALESCE(grid_visible, true),
  width_cells,
  height_cells,
  COALESCE(fog_of_war, '[]'::jsonb),
  COALESCE(is_active, false),
  created_at,
  updated_at
FROM public.campaign_maps
ON CONFLICT (id) DO NOTHING;

-- 6. Migrar tokens
INSERT INTO public.map_tokens_v2 (id, map_id, character_id, created_by, name, token_type, image_url, x, y, size, rotation, layer, conditions, light_radius, light_color, visible_to, locked, notes, created_at, updated_at)
SELECT 
  mt.id,
  mt.map_id,
  mt.character_id,
  mt.created_by,
  mt.name,
  COALESCE(mt.token_type, 'pc')::text,
  mt.image_url,
  COALESCE(mt.x, 0)::numeric,
  COALESCE(mt.y, 0)::numeric,
  COALESCE(mt.size, 1),
  COALESCE(mt.rotation, 0)::numeric,
  COALESCE(mt.layer, 'token')::text,
  COALESCE(mt.conditions, '[]'::jsonb),
  COALESCE(mt.light_radius, 0)::numeric,
  COALESCE(mt.light_color, '#ffffff'),
  mt.visible_to,
  COALESCE(mt.locked, false),
  mt.notes,
  mt.created_at,
  mt.updated_at
FROM public.map_tokens mt
WHERE EXISTS (SELECT 1 FROM public.campaign_maps_v2 cmv2 WHERE cmv2.id = mt.map_id)
ON CONFLICT (id) DO NOTHING;