import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, createRateLimitResponse, RATE_LIMIT_PRESETS } from "../_shared/rateLimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge Function: get-vapid-key
 * 
 * Retorna a chave pública VAPID para configuração de push notifications.
 * Requer autenticação - apenas usuários logados podem obter a chave.
 * 
 * SEGURANÇA:
 * - Implementa rate limiting (5 req/min por usuário)
 * - Valida JWT internamente via getClaims()
 */

serve(async (req) => {
  // Tratamento de preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Variáveis de ambiente obrigatórias
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[get-vapid-key] Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // CORREÇÃO DE SEGURANÇA: Validar autenticação
    // ============================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente com o token do usuário para validar autenticação
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validar o token JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('[get-vapid-key] Auth error:', claimsError);
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

    // SEGURANÇA: Rate limiting por usuário (5 req/min)
    const rateLimitResult = checkRateLimit(userId as string, RATE_LIMIT_PRESETS.auth);
    if (!rateLimitResult.allowed) {
      console.warn(`[get-vapid-key] Rate limit exceeded for user: ${userId}`);
      return createRateLimitResponse(rateLimitResult, RATE_LIMIT_PRESETS.auth.maxRequests, corsHeaders);
    }

    console.log(`[get-vapid-key] Authenticated user: ${userId}`);

    // Verificar se a chave VAPID está configurada
    if (!vapidPublicKey) {
      return new Response(
        JSON.stringify({ error: 'VAPID public key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ publicKey: vapidPublicKey }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[get-vapid-key] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
