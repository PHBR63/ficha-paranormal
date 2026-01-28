/**
 * Rate Limiting Utility para Edge Functions
 * 
 * Implementa rate limiting em memória para prevenir ataques de força bruta.
 * Para produção de larga escala, considere usar Redis ou Supabase como state store.
 * 
 * SEGURANÇA: Esta implementação protege contra:
 * - Ataques de força bruta em endpoints de autenticação
 * - Abuso de APIs sensíveis (push notifications, etc.)
 * - DDoS de camada de aplicação
 */

// Cache em memória (limites por instância de Edge Function)
// Nota: Edge Functions podem ter múltiplas instâncias, então o limite é por instância
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  /** Número máximo de requisições permitidas na janela */
  maxRequests: number;
  /** Janela de tempo em segundos */
  windowSeconds: number;
  /** Prefixo para diferenciar endpoints (ex: 'push', 'vapid') */
  prefix?: string;
}

export interface RateLimitResult {
  /** Se a requisição foi permitida */
  allowed: boolean;
  /** Requisições restantes na janela atual */
  remaining: number;
  /** Timestamp Unix (ms) de quando o limite será resetado */
  resetAt: number;
  /** Segundos até o reset */
  retryAfter: number;
}

/**
 * Verifica se uma requisição está dentro do rate limit
 * 
 * @param identifier - Identificador único (userId, IP, etc.)
 * @param config - Configuração do rate limit
 * @returns Resultado com status e informações do limite
 * 
 * @example
 * ```ts
 * const result = checkRateLimit(userId, { maxRequests: 10, windowSeconds: 60 });
 * if (!result.allowed) {
 *   return new Response(JSON.stringify({ error: 'Too many requests' }), { 
 *     status: 429,
 *     headers: { 'Retry-After': result.retryAfter.toString() }
 *   });
 * }
 * ```
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const { maxRequests, windowSeconds, prefix = '' } = config;
  const now = Date.now();
  const key = `${prefix}:${identifier}`;
  const windowMs = windowSeconds * 1000;
  
  // Busca ou cria entrada no cache
  let entry = rateLimitCache.get(key);
  
  // Se não existe ou expirou, cria nova janela
  if (!entry || now >= entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
  }
  
  // Incrementa contador
  entry.count++;
  rateLimitCache.set(key, entry);
  
  // Calcula valores de retorno
  const remaining = Math.max(0, maxRequests - entry.count);
  const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
  const allowed = entry.count <= maxRequests;
  
  // Limpeza periódica de entradas expiradas (1% de chance por chamada)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }
  
  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
    retryAfter: allowed ? 0 : retryAfter,
  };
}

/**
 * Remove entradas expiradas do cache para evitar memory leaks
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitCache.entries()) {
    if (now >= entry.resetAt) {
      rateLimitCache.delete(key);
    }
  }
}

/**
 * Gera headers de rate limit para incluir na resposta
 * 
 * @param result - Resultado do checkRateLimit
 * @param maxRequests - Limite máximo configurado
 * @returns Headers para adicionar à resposta
 */
export function getRateLimitHeaders(
  result: RateLimitResult,
  maxRequests: number
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
  };
  
  if (!result.allowed) {
    headers['Retry-After'] = result.retryAfter.toString();
  }
  
  return headers;
}

/**
 * Cria resposta 429 Too Many Requests padronizada
 * 
 * @param result - Resultado do checkRateLimit
 * @param maxRequests - Limite máximo configurado
 * @param corsHeaders - Headers CORS para incluir
 * @returns Response com status 429
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  maxRequests: number,
  corsHeaders: Record<string, string> = {}
): Response {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        ...getRateLimitHeaders(result, maxRequests),
      },
    }
  );
}

// Configurações padrão recomendadas para diferentes tipos de endpoints
export const RATE_LIMIT_PRESETS = {
  // Para endpoints de push notifications (10 req/min por usuário)
  push: { maxRequests: 10, windowSeconds: 60, prefix: 'push' },
  
  // Para endpoints de autenticação/VAPID (5 req/min por usuário)
  auth: { maxRequests: 5, windowSeconds: 60, prefix: 'auth' },
  
  // Para endpoints gerais de leitura (100 req/min por usuário)
  read: { maxRequests: 100, windowSeconds: 60, prefix: 'read' },
  
  // Para endpoints de escrita (30 req/min por usuário)
  write: { maxRequests: 30, windowSeconds: 60, prefix: 'write' },
} as const;
