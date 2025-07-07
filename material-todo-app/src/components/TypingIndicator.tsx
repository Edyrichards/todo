/**
 * Typing Indicator Component
 * 
 * Shows when other users are typing in real-time.
 */

import { useTypingIndicators } from '../store/websocketStore';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface TypingIndicatorProps {
  taskId?: string;
  className?: string;
}

export function TypingIndicator({ taskId, className }: TypingIndicatorProps) {
  const { typingUsers } = useTypingIndicators(taskId);
  
  if (typingUsers.length === 0) {
    return null;
  }

  const getUserDisplayName = (userId: string) => {
    // For demo purposes, create a display name from user ID
    // In a real app, this would come from user data
    return `User ${userId.slice(-4)}`;
  };

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      const user = typingUsers[0];
      return `${user.userName || getUserDisplayName(user.userId)} is typing...`;
    } else if (typingUsers.length === 2) {
      const names = typingUsers.map(u => u.userName || getUserDisplayName(u.userId));
      return `${names[0]} and ${names[1]} are typing...`;
    } else {
      const firstName = typingUsers[0].userName || getUserDisplayName(typingUsers[0].userId);
      const remainingCount = typingUsers.length - 1;
      return `${firstName} and ${remainingCount} others are typing...`;
    }
  };

  return (
    <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <div className="flex gap-1">
        <div className="flex space-x-1">
          <div 
            className="h-1.5 w-1.5 bg-current rounded-full animate-bounce" 
            style={{ animationDelay: '0ms' }}
          />
          <div 
            className="h-1.5 w-1.5 bg-current rounded-full animate-bounce" 
            style={{ animationDelay: '150ms' }}
          />
          <div 
            className="h-1.5 w-1.5 bg-current rounded-full animate-bounce" 
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
      <span className="text-xs">{getTypingText()}</span>
    </div>
  );
}

export default TypingIndicator;