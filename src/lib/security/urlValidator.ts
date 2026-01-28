/**
 * Validação de URLs para segurança
 * 
 * SEGURANÇA: Previne ataques de pixel tracking e data exfiltration
 * através de URLs de imagem maliciosas em mapas táticos.
 * 
 * Domínios permitidos:
 * - Supabase Storage do projeto
 * - Domínio local da aplicação
 * - Serviços populares de hosting de imagem (opcional)
 */

// ID do projeto Supabase
const SUPABASE_PROJECT_ID = 'rctbxgpjtgkinwzdymbt';

// Domínios explicitamente permitidos para imagens de mapa
const ALLOWED_IMAGE_DOMAINS = [
  // Supabase Storage
  `${SUPABASE_PROJECT_ID}.supabase.co`,
  
  // Domínio local (produção)
  'ficha-paranormal.lovable.app',
  
  // Serviços populares de hosting de imagem (opcionais, mas comuns para mapas de RPG)
  'imgur.com',
  'i.imgur.com',
  'i.redd.it',
  'preview.redd.it',
  'drive.google.com',
  'lh3.googleusercontent.com',
  'raw.githubusercontent.com',
  'user-images.githubusercontent.com',
  
  // Serviços de mapas de RPG populares
  'dungeonfog.com',
  'inkarnate.com',
  'dungeondraft.net',
  '2minutetabletop.com',
  'cdn.discordapp.com',
  'media.discordapp.net',
];

// Padrões de URL que sempre são bloqueados (suspeitas)
const BLOCKED_PATTERNS = [
  // Tracking pixels conhecidos
  /pixel\./i,
  /tracking\./i,
  /analytics\./i,
  /beacon\./i,
  /collect\./i,
  
  // IPs diretos (potencial exfiltração)
  /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
  
  // Localhost e IPs privados
  /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/i,
  /^https?:\/\/(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/,
];

export interface UrlValidationResult {
  /** Se a URL é válida e segura */
  isValid: boolean;
  /** Mensagem de erro (se inválida) */
  error?: string;
  /** URL normalizada (se válida) */
  normalizedUrl?: string;
}

/**
 * Valida se uma URL de imagem é segura para uso em mapas táticos
 * 
 * @param url - URL da imagem a validar
 * @param options - Opções de validação
 * @returns Resultado da validação
 * 
 * @example
 * ```ts
 * const result = validateImageUrl('https://imgur.com/abc123.png');
 * if (!result.isValid) {
 *   toast.error(result.error);
 *   return;
 * }
 * ```
 */
export function validateImageUrl(
  url: string,
  options: { allowAnyHttps?: boolean } = {}
): UrlValidationResult {
  // Trim e verificação básica
  const trimmedUrl = url.trim();
  
  if (!trimmedUrl) {
    return { isValid: false, error: 'URL não pode estar vazia' };
  }
  
  // Deve começar com HTTPS (segurança de transporte)
  if (!trimmedUrl.startsWith('https://')) {
    return { 
      isValid: false, 
      error: 'URL deve usar HTTPS para segurança' 
    };
  }
  
  // Parse da URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    return { isValid: false, error: 'URL inválida' };
  }
  
  // Verifica padrões bloqueados
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmedUrl)) {
      return { 
        isValid: false, 
        error: 'URL bloqueada por razões de segurança' 
      };
    }
  }
  
  // Se permitir qualquer HTTPS, apenas verifica extensão de imagem
  if (options.allowAnyHttps) {
    // Verifica se parece ser uma imagem (extensão comum)
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i;
    const hasImageExtension = imageExtensions.test(parsedUrl.pathname);
    
    // Alguns serviços não usam extensão, então permitimos se não tiver extensão óbvia
    const hasNoExtension = !parsedUrl.pathname.includes('.');
    
    if (!hasImageExtension && !hasNoExtension) {
      // Tem extensão, mas não é de imagem
      const ext = parsedUrl.pathname.split('.').pop()?.toLowerCase();
      if (ext && !['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
        return {
          isValid: false,
          error: `Extensão .${ext} não é uma imagem válida`
        };
      }
    }
    
    return { isValid: true, normalizedUrl: trimmedUrl };
  }
  
  // Verifica se o domínio está na lista permitida
  const hostname = parsedUrl.hostname.toLowerCase();
  const isAllowed = ALLOWED_IMAGE_DOMAINS.some(domain => 
    hostname === domain || hostname.endsWith(`.${domain}`)
  );
  
  if (!isAllowed) {
    return {
      isValid: false,
      error: `Domínio "${hostname}" não está na lista de fontes permitidas. ` +
             `Use imagens do Supabase Storage ou de serviços como Imgur, Google Drive.`
    };
  }
  
  return { isValid: true, normalizedUrl: trimmedUrl };
}

/**
 * Lista de domínios permitidos (para exibição ao usuário)
 */
export function getAllowedDomainsList(): string[] {
  return [...ALLOWED_IMAGE_DOMAINS];
}

/**
 * Verifica rapidamente se uma URL é do Supabase Storage do projeto
 */
export function isSupabaseStorageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === `${SUPABASE_PROJECT_ID}.supabase.co`;
  } catch {
    return false;
  }
}
