import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Web Push utilities
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function sendWebPush(subscription: any, payload: string, vapidKeys: { publicKey: string; privateKey: string }) {
  const endpoint = subscription.endpoint;
  const p256dh = subscription.p256dh;
  const auth = subscription.auth;

  // Import web-push compatible library for Deno
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(payload);

  // For Deno, we'll use a simple fetch-based approach with VAPID
  // This is a simplified version - in production you'd want a proper web-push library
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
      'Urgency': 'normal',
    },
    body: payloadBytes,
  });

  return response;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, campaignId, sessionId, title, body, userIds } = await req.json();

    console.log(`Sending push notification: type=${type}, campaignId=${campaignId}`);

    // Get subscriptions for target users
    let query = supabase.from('push_subscriptions').select('*');
    
    if (userIds && userIds.length > 0) {
      query = query.in('user_id', userIds);
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: {
        type,
        campaignId,
        sessionId,
        url: campaignId ? `/campaigns/${campaignId}` : '/campaigns'
      }
    });

    let successCount = 0;
    let failCount = 0;
    const failedSubscriptions: string[] = [];

    for (const sub of subscriptions) {
      try {
        // Use web-push approach with fetch
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
          console.log(`Push sent successfully to ${sub.user_id}`);
        } else if (response.status === 410 || response.status === 404) {
          // Subscription expired or invalid - remove it
          failedSubscriptions.push(sub.id);
          failCount++;
          console.log(`Subscription expired for ${sub.user_id}, marking for removal`);
        } else {
          failCount++;
          console.error(`Push failed for ${sub.user_id}: ${response.status}`);
        }
      } catch (err) {
        failCount++;
        console.error(`Error sending push to ${sub.user_id}:`, err);
      }
    }

    // Clean up expired subscriptions
    if (failedSubscriptions.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', failedSubscriptions);
      console.log(`Removed ${failedSubscriptions.length} expired subscriptions`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        failed: failCount,
        removed: failedSubscriptions.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Push notification error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
