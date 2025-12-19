import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface PushNotificationToggleProps {
  variant?: 'button' | 'switch';
  showLabel?: boolean;
  className?: string;
}

export function PushNotificationToggle({ 
  variant = 'switch', 
  showLabel = true,
  className = ''
}: PushNotificationToggleProps) {
  const { isSupported, isSubscribed, permission, loading, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  if (variant === 'button') {
    return (
      <Button
        variant={isSubscribed ? 'secondary' : 'outline'}
        size="sm"
        onClick={handleToggle}
        disabled={loading || permission === 'denied'}
        className={className}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isSubscribed ? (
          <>
            <Bell className="w-4 h-4 mr-2" />
            Notificações ativas
          </>
        ) : (
          <>
            <BellOff className="w-4 h-4 mr-2" />
            Ativar notificações
          </>
        )}
      </Button>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Switch
        id="push-notifications"
        checked={isSubscribed}
        onCheckedChange={handleToggle}
        disabled={loading || permission === 'denied'}
      />
      {showLabel && (
        <Label 
          htmlFor="push-notifications" 
          className="text-sm text-muted-foreground cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Processando...
            </span>
          ) : isSubscribed ? (
            <span className="flex items-center gap-2">
              <Bell className="w-3 h-3" />
              Notificações ativadas
            </span>
          ) : permission === 'denied' ? (
            <span className="text-destructive">Notificações bloqueadas</span>
          ) : (
            <span className="flex items-center gap-2">
              <BellOff className="w-3 h-3" />
              Ativar notificações de sessão
            </span>
          )}
        </Label>
      )}
    </div>
  );
}
