import React from 'react';
import { motion, AnimatePresence, MotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  fadeInUp, 
  slideLeft, 
  slideRight, 
  pageTransition,
  spring,
  staggerContainer,
  staggerItem 
} from '../lib/animations';

type TransitionType = 'fade' | 'slide' | 'scale' | 'flip' | 'zoom' | 'blur';
type Direction = 'left' | 'right' | 'up' | 'down';

interface PageTransitionProps {
  children: React.ReactNode;
  type?: TransitionType;
  direction?: Direction;
  duration?: number;
  className?: string;
  motionKey?: string | number;
}

export function PageTransition({
  children,
  type = 'fade',
  direction = 'right',
  duration = 0.3,
  className,
  motionKey,
}: PageTransitionProps) {
  const getTransitionVariants = () => {
    switch (type) {
      case 'slide':
        return {
          initial: { 
            x: direction === 'left' ? '-100%' : direction === 'right' ? '100%' : 0,
            y: direction === 'up' ? '-100%' : direction === 'down' ? '100%' : 0,
            opacity: 0,
          },
          animate: { x: 0, y: 0, opacity: 1 },
          exit: { 
            x: direction === 'left' ? '100%' : direction === 'right' ? '-100%' : 0,
            y: direction === 'up' ? '100%' : direction === 'down' ? '-100%' : 0,
            opacity: 0,
          },
        };
      
      case 'scale':
        return {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.8, opacity: 0 },
        };
      
      case 'flip':
        return {
          initial: { rotateY: 90, opacity: 0 },
          animate: { rotateY: 0, opacity: 1 },
          exit: { rotateY: -90, opacity: 0 },
        };
      
      case 'zoom':
        return {
          initial: { scale: 1.2, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.8, opacity: 0 },
        };
      
      case 'blur':
        return {
          initial: { filter: 'blur(10px)', opacity: 0 },
          animate: { filter: 'blur(0px)', opacity: 1 },
          exit: { filter: 'blur(10px)', opacity: 0 },
        };
      
      default: // fade
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
    }
  };

  return (
    <motion.div
      key={motionKey}
      className={cn("w-full h-full", className)}
      variants={getTransitionVariants()}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        duration,
        ease: "easeInOut",
        ...(type === 'flip' && { type: "spring", damping: 20, stiffness: 300 }),
      }}
    >
      {children}
    </motion.div>
  );
}

interface ViewSwitcherProps {
  children: React.ReactNode;
  currentView: string | number;
  transitionType?: TransitionType;
  direction?: Direction;
  className?: string;
}

export function ViewSwitcher({
  children,
  currentView,
  transitionType = 'slide',
  direction = 'right',
  className,
}: ViewSwitcherProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <AnimatePresence mode="wait">
        <PageTransition
          key={currentView}
          type={transitionType}
          direction={direction}
          motionKey={currentView}
        >
          {children}
        </PageTransition>
      </AnimatePresence>
    </div>
  );
}

interface StaggeredListProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
  direction?: 'normal' | 'reverse';
}

export function StaggeredList({
  children,
  staggerDelay = 0.1,
  className,
  direction = 'normal',
}: StaggeredListProps) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        ['--stagger-delay' as any]: `${staggerDelay}s`,
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={staggerItem}
          custom={direction === 'reverse' ? React.Children.count(children) - index : index}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

interface ParallaxScrollProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export function ParallaxScroll({
  children,
  speed = 0.5,
  className,
}: ParallaxScrollProps) {
  const [offsetY, setOffsetY] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.pageYOffset);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      className={className}
      style={{
        y: offsetY * speed,
      }}
    >
      {children}
    </motion.div>
  );
}

interface MagneticButtonProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
  disabled?: boolean;
}

export function MagneticButton({
  children,
  strength = 0.3,
  className,
  disabled = false,
}: MagneticButtonProps) {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const ref = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (disabled || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const x = (e.clientX - centerX) * strength;
    const y = (e.clientY - centerY) * strength;
    
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setPosition({ x: 0, y: 0 });
    }
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}

interface RevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
}

export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  threshold = 0.1,
  className,
}: RevealProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, isVisible]);

  const getInitialState = () => {
    switch (direction) {
      case 'up':
        return { y: 50, opacity: 0 };
      case 'down':
        return { y: -50, opacity: 0 };
      case 'left':
        return { x: 50, opacity: 0 };
      case 'right':
        return { x: -50, opacity: 0 };
      default:
        return { y: 50, opacity: 0 };
    }
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={getInitialState()}
      animate={
        isVisible
          ? { x: 0, y: 0, opacity: 1 }
          : getInitialState()
      }
      transition={{
        duration,
        delay,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}

interface CounterProps {
  to: number;
  from?: number;
  duration?: number;
  className?: string;
  formatter?: (value: number) => string;
}

export function AnimatedCounter({
  to,
  from = 0,
  duration = 1,
  className,
  formatter = (value) => value.toString(),
}: CounterProps) {
  const [count, setCount] = React.useState(from);

  React.useEffect(() => {
    const startTime = Date.now();
    const difference = to - from;

    const updateCount = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentCount = from + (difference * easeOut);
      
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    updateCount();
  }, [to, from, duration]);

  return (
    <motion.span
      className={className}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {formatter(Math.floor(count))}
    </motion.span>
  );
}

interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
  className?: string;
  onComplete?: () => void;
}

export function Typewriter({
  text,
  speed = 50,
  delay = 0,
  cursor = true,
  className,
  onComplete,
}: TypewriterProps) {
  const [displayText, setDisplayText] = React.useState('');
  const [showCursor, setShowCursor] = React.useState(cursor);

  React.useEffect(() => {
    const startDelay = setTimeout(() => {
      let index = 0;
      const timer = setInterval(() => {
        if (index < text.length) {
          setDisplayText(text.slice(0, index + 1));
          index++;
        } else {
          clearInterval(timer);
          setShowCursor(false);
          onComplete?.();
        }
      }, speed);

      return () => clearInterval(timer);
    }, delay);

    return () => clearTimeout(startDelay);
  }, [text, speed, delay, onComplete]);

  return (
    <span className={className}>
      {displayText}
      {showCursor && (
        <motion.span
          className="text-primary"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          |
        </motion.span>
      )}
    </span>
  );
}

interface ProgressCircleProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

export function AnimatedProgressCircle({
  progress,
  size = 120,
  strokeWidth = 8,
  className,
  children,
}: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted-foreground/20"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          className="text-primary"
          style={{
            strokeDasharray: circumference,
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      </svg>
      
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}