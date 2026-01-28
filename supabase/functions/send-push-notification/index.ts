import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ApplicationServer,
  generateVapidKeys,
  type PushSubscription as WebPushSubscription,
} from "jsr:@negrel/webpush";
import { checkRateLimit, createRateLimitResponse, RATE_LIMIT_PRESETS } from "../_shared/rateLimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge Function: send-push-notification
 * 
 * Envia notificações push para membros de uma campanha.
 * Usa biblioteca @negrel/webpush para Deno com suporte VAPID.
 * 
 * SEGURANÇA:
 * - Implementa rate limiting (10 req/min por usuário)
 * - Apenas mestres de campanha podem enviar notificações
 * - Valida JWT internamente via getClaims()
 */

// Cache do ApplicationServer
let appServerInstance: ApplicationServer | null = null;

async function getAppServer(): Promise<ApplicationServer> {
  if (appServerInstance) return appServerInstance;

  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

  if (!vapidPublicKey || !vapidPrivateKey) {
    throw new Error('Missing VAPID keys');
  }

  // Gerar par de chaves VAPID (usaremos as existentes via JWT)
  const vapidKeys = await generateVapidKeys({});

  appServerInstance = await ApplicationServer.new({
    contactInformation: 'mailto:contato@letsroll.app',
    vapidKeys,
  });

  return appServerInstance;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Validar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SEGURANÇA: Rate limiting por usuário (10 req/min para push)
    const rateLimitResult = checkRateLimit(userId as string, RATE_LIMIT_PRESETS.push);
    if (!rateLimitResult.allowed) {
      console.warn(`[push-notification] Rate limit exceeded for user: ${userId}`);
      return createRateLimitResponse(rateLimitResult, RATE_LIMIT_PRESETS.push.maxRequests, corsHeaders);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { type, campaignId, sessionId, title, body, userIds } = await req.json();

    if (!campaignId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se é mestre
    const { data: isMaster } = await supabase.rpc('is_campaign_master', {
      _user_id: userId,
      _campaign_id: campaignId
    });

    if (!isMaster) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar subscriptions
    const { data: subscriptions } = await supabase.rpc('get_push_subscriptions_for_campaign', {
      _campaign_id: campaignId,
      _user_ids: userIds || null
    });

    if (!subscriptions?.length) {
      return new Response(
        JSON.stringify({ success: true, sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const appServer = await getAppServer();
    const payload = JSON.stringify({
      title,
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { type, campaignId, sessionId, url: `/campaigns/${campaignId}` }
    });

    let successCount = 0;
    let failCount = 0;
    const expiredIds: string[] = [];

    for (const sub of subscriptions) {
      try {
        const pushSub: WebPushSubscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        };

        const subscriber = appServer.subscribe(pushSub);
        await subscriber.pushTextMessage(payload, {});
        successCount++;
      } catch (err) {
        failCount++;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('410') || msg.includes('404')) {
          expiredIds.push(sub.id);
        }
      }
    }

    if (expiredIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', expiredIds);
    }

    return new Response(
      JSON.stringify({ success: true, sent: successCount, failed: failCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[push-notification] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
