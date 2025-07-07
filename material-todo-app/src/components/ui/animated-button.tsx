import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Button as BaseButton, ButtonProps as BaseButtonProps } from '@/components/ui/button';
import { LoadingSpinner } from './loading';
import { cn } from '@/lib/utils';
import { 
  elasticHover, 
  bounceIn, 
  spring,
  useSuccessAnimation,
  useShakeAnimation 
} from '../lib/animations';

interface AnimatedButtonProps extends Omit<BaseButtonProps, 'asChild'> {
  isLoading?: boolean;
  loadingText?: string;
  successText?: string;
  successDuration?: number;
  animationType?: 'hover' | 'tap' | 'bounce' | 'elastic' | 'none';
  motionProps?: MotionProps;
  onSuccess?: () => void;
  onError?: () => void;
}

export function AnimatedButton({
  children,
  isLoading = false,
  loadingText,
  successText,
  successDuration = 2000,
  animationType = 'elastic',
  motionProps = {},
  onSuccess,
  onError,
  disabled,
  className,
  onClick,
  ...props
}: AnimatedButtonProps) {
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const { animate: successAnimate, triggerSuccess } = useSuccessAnimation();
  const { animate: errorAnimate, triggerShake } = useShakeAnimation();

  // Animation variants based on type
  const getAnimationVariants = () => {
    switch (animationType) {
      case 'elastic':
        return elasticHover;
      case 'bounce':
        return bounceIn;
      case 'hover':
        return {
          rest: { scale: 1 },
          hover: { scale: 1.02 },
          tap: { scale: 0.98 },
        };
      case 'tap':
        return {
          rest: { scale: 1 },
          tap: { scale: 0.95 },
        };
      default:
        return {};
    }
  };

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading || disabled) return;

    try {
      if (onClick) {
        const result = onClick(event);
        
        // Handle async operations
        if (result instanceof Promise) {
          const promiseResult = await result;
          setIsSuccess(true);
          triggerSuccess();
          onSuccess?.();
          
          // Reset success state after duration
          setTimeout(() => setIsSuccess(false), successDuration);
        } else {
          setIsSuccess(true);
          triggerSuccess();
          onSuccess?.();
          setTimeout(() => setIsSuccess(false), successDuration);
        }
      }
    } catch (error) {
      setIsError(true);
      triggerShake();
      onError?.();
      
      // Reset error state
      setTimeout(() => setIsError(false), 1000);
    }
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <LoadingSpinner size="sm" />
          {loadingText || children}
        </div>
      );
    }

    if (isSuccess && successText) {
      return successText;
    }

    return children;
  };

  const getButtonClass = () => {
    return cn(
      "transition-all duration-200",
      isSuccess && "bg-green-600 hover:bg-green-700 border-green-600",
      isError && "bg-red-600 hover:bg-red-700 border-red-600",
      className
    );
  };

  return (
    <motion.div
      variants={getAnimationVariants()}
      initial="rest"
      whileHover={animationType !== 'none' ? "hover" : undefined}
      whileTap={animationType !== 'none' ? "tap" : undefined}
      animate={isSuccess ? successAnimate : isError ? errorAnimate : undefined}
      {...motionProps}
    >
      <BaseButton
        {...props}
        disabled={disabled || isLoading}
        className={getButtonClass()}
        onClick={handleClick}
      >
        {getButtonContent()}
      </BaseButton>
    </motion.div>
  );
}

interface FloatingActionButtonProps extends AnimatedButtonProps {
  icon: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
}

export function FloatingActionButton({
  icon,
  position = 'bottom-right',
  size = 'md',
  className,
  ...props
}: FloatingActionButtonProps) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-14 w-14',
    lg: 'h-16 w-16',
  };

  return (
    <motion.div
      className={cn(
        "fixed z-50",
        positionClasses[position]
      )}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ ...spring.bouncy, delay: 0.2 }}
    >
      <AnimatedButton
        size="icon"
        className={cn(
          "rounded-full shadow-lg hover:shadow-xl",
          sizeClasses[size],
          className
        )}
        animationType="elastic"
        {...props}
      >
        {icon}
      </AnimatedButton>
    </motion.div>
  );
}

interface PulseButtonProps extends AnimatedButtonProps {
  pulseColor?: string;
  pulseIntensity?: 'low' | 'medium' | 'high';
}

export function PulseButton({
  pulseColor = 'rgb(59, 130, 246)',
  pulseIntensity = 'medium',
  className,
  ...props
}: PulseButtonProps) {
  const intensityValues = {
    low: { scale: 1.05, opacity: 0.3 },
    medium: { scale: 1.1, opacity: 0.5 },
    high: { scale: 1.2, opacity: 0.7 },
  };

  return (
    <motion.div className="relative">
      {/* Pulse ring */}
      <motion.div
        className="absolute inset-0 rounded-inherit pointer-events-none"
        style={{ backgroundColor: pulseColor }}
        animate={{
          scale: [1, intensityValues[pulseIntensity].scale, 1],
          opacity: [0, intensityValues[pulseIntensity].opacity, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <AnimatedButton
        className={cn("relative", className)}
        {...props}
      />
    </motion.div>
  );
}

interface GlowButtonProps extends AnimatedButtonProps {
  glowColor?: string;
  glowIntensity?: 'low' | 'medium' | 'high';
}

export function GlowButton({
  glowColor = 'rgb(59, 130, 246)',
  glowIntensity = 'medium',
  className,
  ...props
}: GlowButtonProps) {
  const intensityValues = {
    low: '0 0 10px',
    medium: '0 0 20px',
    high: '0 0 30px',
  };

  return (
    <motion.div
      className="relative"
      whileHover={{
        filter: `drop-shadow(${intensityValues[glowIntensity]} ${glowColor})`,
      }}
      transition={{ duration: 0.2 }}
    >
      <AnimatedButton
        className={cn("transition-all duration-200", className)}
        {...props}
      />
    </motion.div>
  );
}

interface MorphButtonProps extends AnimatedButtonProps {
  morphTo?: React.ReactNode;
  morphDuration?: number;
  triggerMorph?: boolean;
}

export function MorphButton({
  children,
  morphTo,
  morphDuration = 0.3,
  triggerMorph = false,
  ...props
}: MorphButtonProps) {
  return (
    <AnimatedButton {...props}>
      <motion.div
        initial={false}
        animate={{ opacity: triggerMorph ? 0 : 1 }}
        transition={{ duration: morphDuration / 2 }}
      >
        {children}
      </motion.div>
      
      {morphTo && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: triggerMorph ? 1 : 0 }}
          transition={{ duration: morphDuration / 2, delay: morphDuration / 2 }}
        >
          {morphTo}
        </motion.div>
      )}
    </AnimatedButton>
  );
}

interface ButtonGroupProps {
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  spacing?: 'sm' | 'md' | 'lg';
  staggerDelay?: number;
  className?: string;
}

export function AnimatedButtonGroup({
  children,
  direction = 'horizontal',
  spacing = 'md',
  staggerDelay = 0.1,
  className,
}: ButtonGroupProps) {
  const spacingClasses = {
    sm: direction === 'horizontal' ? 'gap-2' : 'gap-2',
    md: direction === 'horizontal' ? 'gap-4' : 'gap-3',
    lg: direction === 'horizontal' ? 'gap-6' : 'gap-4',
  };

  const directionClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col',
  };

  return (
    <motion.div
      className={cn(
        "flex",
        directionClasses[direction],
        spacingClasses[spacing],
        className
      )}
      initial="initial"
      animate="animate"
      variants={{
        initial: {},
        animate: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
          }}
          transition={{ ...spring.gentle }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}