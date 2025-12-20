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
 * Usa função SECURITY DEFINER para acessar subscrições sem expor dados.
 * 
 * Parâmetros esperados no body:
 * - type: 'session_scheduled' | 'session_reminder' | 'session_started'
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

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    // Cliente Supabase com service role para operações administrativas
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse e validação do body
    const { type, campaignId, sessionId, title, body, userIds } = await req.json();

    // Validação de campos obrigatórios
    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: 'campaignId is required for security validation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!type || !['session_scheduled', 'session_reminder', 'session_started'].includes(type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid notification type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[push-notification] type=${type}, campaignId=${campaignId}`);

    // Usar função SECURITY DEFINER para buscar subscrições de forma segura
    // Isso garante que apenas membros da campanha recebam notificações
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
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
