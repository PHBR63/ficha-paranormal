import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

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

// Cache para a VAPID key
let cachedVapidKey: string | null = null;

async function getVapidPublicKey(): Promise<string | null> {
  if (cachedVapidKey) return cachedVapidKey;

  try {
    const { data, error } = await supabase.functions.invoke('get-vapid-key');
    if (error || !data?.publicKey) {
      console.error('Error fetching VAPID key:', error);
      return null;
    }
    cachedVapidKey = data.publicKey;
    return cachedVapidKey;
  } catch (error) {
    console.error('Error fetching VAPID key:', error);
    return null;
  }
}

export function usePushNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const vapidKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkExistingSubscription();
      // Pre-fetch VAPID key
      getVapidPublicKey().then(key => {
        vapidKeyRef.current = key;
      });
    }
  }, [user]);

  const checkExistingSubscription = useCallback(async () => {
    if (!user) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();
      
      if (subscription) {
        // Check if this subscription exists in our database
        // IMPORTANTE: .single() quebra com 406 quando não existe registro.
        // Padrão do projeto: usar .maybeSingle() quando pode retornar 0 linhas.
        const { data } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint)
          .maybeSingle();

        setIsSubscribed(!!data);
      } else {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }, [user]);

  const subscribe = useCallback(async () => {
    if (!user || !isSupported) return false;

    setLoading(true);
    try {
      // Request permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        toast({
          title: 'Permissão negada',
          description: 'Você precisa permitir notificações para receber avisos de sessões.',
          variant: 'destructive'
        });
        return false;
      }

      // Get VAPID key
      const vapidKey = vapidKeyRef.current || await getVapidPublicKey();
      if (!vapidKey) {
        throw new Error('VAPID key not available');
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscreve ao push
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      });

      const subscriptionJson = subscription.toJSON();

      // Save subscription to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionJson.endpoint!,
          p256dh: subscriptionJson.keys!.p256dh,
          auth: subscriptionJson.keys!.auth,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'endpoint'
        });

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: 'Notificações ativadas',
        description: 'Você receberá avisos sobre sessões agendadas.'
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível ativar as notificações.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, isSupported, toast]);

  const unsubscribe = useCallback(async () => {
    if (!user) return false;

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);
      }

      setIsSubscribed(false);
      toast({
        title: 'Notificações desativadas',
        description: 'Você não receberá mais avisos de sessões.'
      });

      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível desativar as notificações.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe
  };
}

// Tipos de notificação suportados
export type PushNotificationType = 
  | 'session_scheduled' 
  | 'session_reminder' 
  | 'session_started'
  // Combat 7.5 - Tipos de combate
  | 'combat_turn_start'
  | 'combat_opportunity_attack'
  | 'combat_low_hp_warning'
  | 'combat_condition_applied';

// Helper function to send push notification via edge function
export async function sendPushNotification(params: {
  type: PushNotificationType;
  campaignId: string;
  sessionId?: string;
  title: string;
  body: string;
  userIds?: string[];
}) {
  try {
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: params
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

// =====================================================
// Combat 7.5 - Helpers específicos para notificações de combate
// =====================================================

/**
 * Notifica um jogador que é seu turno
 */
export async function notifyTurnStart(params: {
  campaignId: string;
  playerId: string;
  characterName: string;
  round: number;
}) {
  return sendPushNotification({
    type: 'combat_turn_start',
    campaignId: params.campaignId,
    title: '⚔️ Seu Turno!',
    body: `${params.characterName}, é sua vez de agir! (Rodada ${params.round})`,
    userIds: [params.playerId],
  });
}

/**
 * Notifica jogador sobre ataque de oportunidade disponível
 */
export async function notifyOpportunityAttack(params: {
  campaignId: string;
  attackerId: string;
  attackerName: string;
  targetName: string;
}) {
  return sendPushNotification({
    type: 'combat_opportunity_attack',
    campaignId: params.campaignId,
    title: '🎯 Ataque de Oportunidade!',
    body: `${params.attackerName} pode atacar ${params.targetName}!`,
    userIds: [params.attackerId],
  });
}

/**
 * Avisa jogador que seu HP está baixo
 */
export async function notifyLowHP(params: {
  campaignId: string;
  playerId: string;
  characterName: string;
  currentHP: number;
  maxHP: number;
}) {
  const percentage = Math.round((params.currentHP / params.maxHP) * 100);
  return sendPushNotification({
    type: 'combat_low_hp_warning',
    campaignId: params.campaignId,
    title: '❤️ HP Crítico!',
    body: `${params.characterName} está com ${params.currentHP} PV (${percentage}%)!`,
    userIds: [params.playerId],
  });
}

/**
 * Notifica jogador sobre condição aplicada
 */
export async function notifyConditionApplied(params: {
  campaignId: string;
  playerId: string;
  characterName: string;
  conditionName: string;
  duration?: number;
}) {
  const durationText = params.duration ? ` por ${params.duration} rodada(s)` : '';
  return sendPushNotification({
    type: 'combat_condition_applied',
    campaignId: params.campaignId,
    title: '⚡ Nova Condição!',
    body: `${params.characterName} recebeu ${params.conditionName}${durationText}`,
    userIds: [params.playerId],
  });
}
