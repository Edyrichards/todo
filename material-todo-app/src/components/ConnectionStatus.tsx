/**
 * WebSocket Connection Status Component
 * 
 * Displays the current connection status and provides manual reconnection controls.
 */

import { useWebSocketConnection } from '../store/websocketStore';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  AlertCircle, 
  RefreshCw 
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ConnectionStatusProps {
  className?: string;
  showText?: boolean;
  compact?: boolean;
}

export function ConnectionStatus({ className, showText = false, compact = false }: ConnectionStatusProps) {
  const { 
    connectionState, 
    isConnected, 
    isAuthenticated, 
    reconnect 
  } = useWebSocketConnection();

  const getStatusConfig = () => {
    switch (connectionState.status) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Connected',
          variant: 'default' as const,
          color: 'text-green-600',
          description: 'Real-time updates are active',
        };
      case 'authenticated':
        return {
          icon: Wifi,
          text: 'Online',
          variant: 'default' as const,
          color: 'text-green-600',
          description: 'Authenticated and receiving real-time updates',
        };
      case 'connecting':
        return {
          icon: Loader2,
          text: 'Connecting',
          variant: 'secondary' as const,
          color: 'text-blue-600',
          description: 'Establishing connection...',
        };
      case 'authenticating':
        return {
          icon: Loader2,
          text: 'Authenticating',
          variant: 'secondary' as const,
          color: 'text-blue-600',
          description: 'Verifying credentials...',
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Error',
          variant: 'destructive' as const,
          color: 'text-red-600',
          description: connectionState.error || 'Connection failed',
        };
      case 'disconnected':
      default:
        return {
          icon: WifiOff,
          text: 'Offline',
          variant: 'outline' as const,
          color: 'text-gray-500',
          description: 'Real-time updates are disabled',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const isSpinning = connectionState.status === 'connecting' || connectionState.status === 'authenticating';

  const handleReconnect = () => {
    if (connectionState.status === 'error' || connectionState.status === 'disconnected') {
      reconnect();
    }
  };

  const statusElement = (
    <div className={cn('flex items-center gap-2', className)}>
      <Icon 
        className={cn(
          compact ? 'h-3 w-3' : 'h-4 w-4', 
          config.color,
          isSpinning && 'animate-spin'
        )} 
      />
      {showText && (
        <Badge variant={config.variant} className={compact ? 'text-xs px-1' : 'text-xs'}>
          {config.text}
        </Badge>
      )}
      {(connectionState.status === 'error' || connectionState.status === 'disconnected') && (
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={handleReconnect}
          className={compact ? 'h-5 px-1 text-xs' : 'h-6 px-2 text-xs'}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {statusElement}
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{config.text}</p>
            <p className="text-sm text-muted-foreground">{config.description}</p>
            {connectionState.reconnectAttempts > 0 && (
              <p className="text-xs text-muted-foreground">
                Reconnect attempts: {connectionState.reconnectAttempts}
              </p>
            )}
            {connectionState.lastConnected && (
              <p className="text-xs text-muted-foreground">
                Last connected: {connectionState.lastConnected.toLocaleTimeString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ConnectionStatus;