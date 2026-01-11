import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge Function: send-push-notification
 * 
 * Envia notificações push para membros de uma campanha de forma segura.
 * Requer autenticação JWT e valida que o usuário é mestre da campanha.
 * 
 * Parâmetros esperados no body:
 * - type: 'session_scheduled' | 'session_reminder' | 'session_started' | combat types
 * - campaignId: UUID da campanha (obrigatório para validação)
 * - sessionId?: UUID da sessão (opcional)
 * - title: Título da notificação
 * - body: Corpo da notificação
 * - userIds?: UUID[] de usuários específicos (opcional, filtra dentro da campanha)
 */

serve(async (req) => {
  // Tratamento de preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Variáveis de ambiente obrigatórias
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      throw new Error('Missing required environment variables');
    }

    // ============================================
    // CORREÇÃO DE SEGURANÇA: Validar autenticação
    // ============================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente com o token do usuário para validar autenticação
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validar o token JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('[push-notification] Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - User ID not found in token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[push-notification] Authenticated user: ${userId}`);

    // Cliente Supabase com service role para operações administrativas
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse e validação do body
    const { type, campaignId, sessionId, title, body, userIds } = await req.json();

    // Validação de campos obrigatórios
    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: 'campaignId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // CORREÇÃO DE SEGURANÇA: Validar que o usuário é mestre da campanha
    // ============================================
    const { data: isMaster, error: masterCheckError } = await supabase
      .rpc('is_campaign_master', {
        _user_id: userId,
        _campaign_id: campaignId
      });

    if (masterCheckError) {
      console.error('[push-notification] Error checking master status:', masterCheckError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify campaign access' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isMaster) {
      console.warn(`[push-notification] User ${userId} is not master of campaign ${campaignId}`);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Only campaign master can send notifications' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Tipos de notificação suportados
    const validTypes = [
      'session_scheduled', 
      'session_reminder', 
      'session_started',
      // Combat 7.5 - Novos tipos de notificação de combate
      'combat_turn_start',
      'combat_opportunity_attack',
      'combat_low_hp_warning',
      'combat_condition_applied',
    ];
    
    if (!type || !validTypes.includes(type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid notification type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[push-notification] type=${type}, campaignId=${campaignId}, masterUser=${userId}`);

    // Buscar subscrições dos membros da campanha
    const { data: subscriptions, error: subError } = await supabase
      .rpc('get_push_subscriptions_for_campaign', {
        _campaign_id: campaignId,
        _user_ids: userIds || null
      });

    if (subError) {
      console.error('[push-notification] Error fetching subscriptions:', subError);
      throw subError;
    }

    console.log(`[push-notification] Found ${subscriptions?.length || 0} subscriptions`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No subscriptions found for campaign members' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Payload da notificação
    const payload = JSON.stringify({
      title,
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: {
        type,
        campaignId,
        sessionId,
        url: `/campaigns/${campaignId}`
      }
    });

    let successCount = 0;
    let failCount = 0;
    const expiredSubscriptionIds: string[] = [];

    // Enviar notificações para cada subscrição
    for (const sub of subscriptions) {
      try {
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'TTL': '86400',
          },
          body: payload,
        });

        if (response.ok || response.status === 201) {
          successCount++;
          console.log(`[push-notification] Sent to user ${sub.user_id}`);
        } else if (response.status === 410 || response.status === 404) {
          // Subscrição expirada ou inválida - marcar para remoção
          expiredSubscriptionIds.push(sub.id);
          failCount++;
          console.log(`[push-notification] Expired subscription for user ${sub.user_id}`);
        } else {
          failCount++;
          console.error(`[push-notification] Failed for user ${sub.user_id}: status ${response.status}`);
        }
      } catch (err) {
        failCount++;
        console.error(`[push-notification] Error sending to user ${sub.user_id}:`, err);
      }
    }

    // Limpar subscrições expiradas
    if (expiredSubscriptionIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', expiredSubscriptionIds);
      
      if (deleteError) {
        console.error('[push-notification] Error removing expired subscriptions:', deleteError);
      } else {
        console.log(`[push-notification] Removed ${expiredSubscriptionIds.length} expired subscriptions`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        failed: failCount,
        removed: expiredSubscriptionIds.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[push-notification] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
