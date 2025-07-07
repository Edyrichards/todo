/**
 * User Presence Component
 * 
 * Displays online users and their status in real-time.
 */

import { useUserPresence } from '../store/websocketStore';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { Users, Circle } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface UserPresenceProps {
  className?: string;
  maxVisible?: number;
  showCount?: boolean;
  compact?: boolean;
}

export function UserPresence({ 
  className, 
  maxVisible = 5, 
  showCount = true,
  compact = false
}: UserPresenceProps) {
  const { userPresence } = useUserPresence();
  
  const onlineUsers = userPresence.filter(user => user.status === 'online');
  const totalOnline = onlineUsers.length;
  const visibleUsers = onlineUsers.slice(0, maxVisible);
  const remainingCount = totalOnline - maxVisible;

  if (totalOnline === 0) {
    return null;
  }

  const getStatusColor = (status: 'online' | 'away' | 'offline') => {
    switch (status) {
      case 'online':
        return 'text-green-500';
      case 'away':
        return 'text-yellow-500';
      case 'offline':
      default:
        return 'text-gray-400';
    }
  };

  const getUserDisplayName = (userId: string) => {
    // For demo purposes, create a display name from user ID
    // In a real app, this would come from user data
    return `User ${userId.slice(-4)}`;
  };

  const getUserInitials = (userId: string) => {
    const displayName = getUserDisplayName(userId);
    return displayName.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center gap-1">
          <Users className={compact ? 'h-3 w-3 text-muted-foreground' : 'h-4 w-4 text-muted-foreground'} />
          {showCount && (
            <span className={compact ? 'text-xs text-muted-foreground' : 'text-sm text-muted-foreground'}>
              {totalOnline}
            </span>
          )}
        </div>
        
        <div className="flex items-center -space-x-2">
          {visibleUsers.map((user) => (
            <Tooltip key={user.userId}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className={compact ? 'h-5 w-5 border border-background' : 'h-6 w-6 border-2 border-background'}>
                    <AvatarFallback className="text-xs">
                      {getUserInitials(user.userId)}
                    </AvatarFallback>
                  </Avatar>
                  <Circle 
                    className={cn(
                      'absolute -bottom-0.5 -right-0.5 fill-current',
                      compact ? 'h-2 w-2' : 'h-2.5 w-2.5',
                      getStatusColor(user.status)
                    )}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">{getUserDisplayName(user.userId)}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Circle 
                      className={cn(
                        'h-2 w-2 fill-current',
                        getStatusColor(user.status)
                      )}
                    />
                    <span className="capitalize">{user.status}</span>
                  </div>
                  {user.currentTask && (
                    <p className="text-xs text-muted-foreground">
                      Working on: {user.currentTask}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Last seen: {formatDistanceToNow(user.lastSeen, { addSuffix: true })}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  'flex items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium',
                  compact ? 'h-5 w-5' : 'h-6 w-6'
                )}>
                  +{remainingCount}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{remainingCount} more users online</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

export default UserPresence;