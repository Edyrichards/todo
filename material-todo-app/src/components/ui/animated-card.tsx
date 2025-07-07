import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Card as BaseCard, CardProps } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  fadeInUp, 
  scaleIn, 
  elasticHover,
  spring,
  useInViewAnimation 
} from '../lib/animations';

interface AnimatedCardProps extends CardProps {
  animationType?: 'fadeInUp' | 'scaleIn' | 'slideIn' | 'hover' | 'none';
  hoverEffect?: 'lift' | 'glow' | 'scale' | 'tilt' | 'none';
  delay?: number;
  motionProps?: MotionProps;
  className?: string;
  children?: React.ReactNode;
  inViewAnimation?: boolean;
  clickable?: boolean;
  onCardClick?: () => void;
}

export function AnimatedCard({
  animationType = 'fadeInUp',
  hoverEffect = 'lift',
  delay = 0,
  motionProps = {},
  className,
  children,
  inViewAnimation = false,
  clickable = false,
  onCardClick,
  ...props
}: AnimatedCardProps) {
  const { ref, isInView } = useInViewAnimation(0.1);

  // Animation variants based on type
  const getInitialAnimation = () => {
    switch (animationType) {
      case 'fadeInUp':
        return fadeInUp;
      case 'scaleIn':
        return scaleIn;
      case 'slideIn':
        return {
          initial: { opacity: 0, x: -50 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: 50 },
        };
      case 'hover':
        return elasticHover;
      default:
        return {};
    }
  };

  // Hover effect variants
  const getHoverEffect = () => {
    switch (hoverEffect) {
      case 'lift':
        return {
          whileHover: { 
            y: -5,
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            transition: spring.gentle,
          },
        };
      case 'glow':
        return {
          whileHover: { 
            boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
            transition: spring.gentle,
          },
        };
      case 'scale':
        return {
          whileHover: { 
            scale: 1.02,
            transition: spring.gentle,
          },
        };
      case 'tilt':
        return {
          whileHover: { 
            rotateY: 5,
            rotateX: 5,
            scale: 1.02,
            transition: spring.gentle,
          },
          style: {
            transformStyle: "preserve-3d" as const,
          },
        };
      default:
        return {};
    }
  };

  const shouldAnimate = inViewAnimation ? isInView : true;

  return (
    <motion.div
      ref={inViewAnimation ? ref : undefined}
      variants={getInitialAnimation()}
      initial={animationType !== 'none' ? "initial" : false}
      animate={shouldAnimate && animationType !== 'none' ? "animate" : false}
      exit={animationType !== 'none' ? "exit" : false}
      transition={{ 
        ...spring.gentle, 
        delay: delay,
      }}
      {...getHoverEffect()}
      whileTap={clickable ? { scale: 0.98 } : undefined}
      className={cn(
        "transition-all duration-200",
        clickable && "cursor-pointer",
        className
      )}
      onClick={clickable ? onCardClick : undefined}
      {...motionProps}
    >
      <BaseCard className="h-full" {...props}>
        {children}
      </BaseCard>
    </motion.div>
  );
}

interface InteractiveCardProps extends AnimatedCardProps {
  expandable?: boolean;
  expandedContent?: React.ReactNode;
  initialHeight?: number;
  expandedHeight?: number;
}

export function InteractiveCard({
  expandable = false,
  expandedContent,
  initialHeight,
  expandedHeight,
  children,
  ...props
}: InteractiveCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const toggleExpanded = () => {
    if (expandable) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <AnimatedCard
      {...props}
      clickable={expandable}
      onCardClick={toggleExpanded}
      motionProps={{
        animate: {
          height: expandable && initialHeight && expandedHeight
            ? isExpanded ? expandedHeight : initialHeight
            : undefined,
        },
        transition: { ...spring.smooth },
      }}
    >
      <motion.div
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
      
      {expandable && expandedContent && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: isExpanded ? 1 : 0,
            height: isExpanded ? "auto" : 0,
          }}
          transition={{ ...spring.smooth }}
          style={{ overflow: "hidden" }}
        >
          <div className="pt-4 border-t">
            {expandedContent}
          </div>
        </motion.div>
      )}
    </AnimatedCard>
  );
}

interface FlipCardProps extends AnimatedCardProps {
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  flipTrigger?: 'hover' | 'click';
  flipDirection?: 'horizontal' | 'vertical';
}

export function FlipCard({
  frontContent,
  backContent,
  flipTrigger = 'hover',
  flipDirection = 'horizontal',
  className,
  ...props
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = React.useState(false);

  const flipVariants = {
    front: {
      rotateY: flipDirection === 'horizontal' ? 0 : undefined,
      rotateX: flipDirection === 'vertical' ? 0 : undefined,
    },
    back: {
      rotateY: flipDirection === 'horizontal' ? 180 : undefined,
      rotateX: flipDirection === 'vertical' ? 180 : undefined,
    },
  };

  const handleFlip = () => {
    if (flipTrigger === 'click') {
      setIsFlipped(!isFlipped);
    }
  };

  const handleHover = (hovering: boolean) => {
    if (flipTrigger === 'hover') {
      setIsFlipped(hovering);
    }
  };

  return (
    <motion.div
      className={cn("relative", className)}
      style={{ perspective: "1000px" }}
      onClick={handleFlip}
      onHoverStart={() => handleHover(true)}
      onHoverEnd={() => handleHover(false)}
    >
      {/* Front */}
      <motion.div
        className="absolute inset-0"
        variants={flipVariants}
        animate={isFlipped ? "back" : "front"}
        transition={{ ...spring.smooth }}
        style={{
          backfaceVisibility: "hidden",
          transformStyle: "preserve-3d",
        }}
      >
        <AnimatedCard {...props} animationType="none">
          {frontContent}
        </AnimatedCard>
      </motion.div>

      {/* Back */}
      <motion.div
        className="absolute inset-0"
        variants={flipVariants}
        animate={isFlipped ? "front" : "back"}
        initial="back"
        transition={{ ...spring.smooth }}
        style={{
          backfaceVisibility: "hidden",
          transformStyle: "preserve-3d",
        }}
      >
        <AnimatedCard {...props} animationType="none">
          {backContent}
        </AnimatedCard>
      </motion.div>

      {/* Spacer to maintain layout */}
      <div style={{ visibility: "hidden" }}>
        <BaseCard {...props}>
          {frontContent}
        </BaseCard>
      </div>
    </motion.div>
  );
}

interface CardStackProps {
  cards: React.ReactNode[];
  stackOffset?: number;
  maxVisible?: number;
  className?: string;
}

export function CardStack({
  cards,
  stackOffset = 8,
  maxVisible = 3,
  className,
}: CardStackProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);

  const visibleCards = cards.slice(0, maxVisible);

  return (
    <div className={cn("relative", className)}>
      {visibleCards.map((card, index) => {
        const isActive = index === activeIndex;
        const offset = (visibleCards.length - 1 - index) * stackOffset;
        
        return (
          <motion.div
            key={index}
            className="absolute inset-0"
            style={{ zIndex: visibleCards.length - index }}
            animate={{
              y: offset,
              scale: 1 - (visibleCards.length - 1 - index) * 0.02,
              opacity: 1 - (visibleCards.length - 1 - index) * 0.1,
            }}
            whileHover={isActive ? { y: offset - 5 } : undefined}
            transition={{ ...spring.gentle }}
            onClick={() => setActiveIndex(index)}
          >
            {card}
          </motion.div>
        );
      })}
      
      {/* Spacer */}
      <div style={{ visibility: "hidden" }}>
        {cards[0]}
      </div>
    </div>
  );
}

interface CardGridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  staggerDelay?: number;
  className?: string;
}

export function AnimatedCardGrid({
  children,
  columns = 3,
  gap = 24,
  staggerDelay = 0.1,
  className,
}: CardGridProps) {
  return (
    <motion.div
      className={cn("grid", className)}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
      }}
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
            initial: { opacity: 0, y: 50 },
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

interface MasonryCardProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
}

export function AnimatedMasonryCards({
  children,
  columns = 3,
  gap = 16,
  className,
}: MasonryCardProps) {
  const columnArrays: React.ReactNode[][] = Array.from({ length: columns }, () => []);
  
  // Distribute children across columns
  React.Children.forEach(children, (child, index) => {
    const columnIndex = index % columns;
    columnArrays[columnIndex].push(child);
  });

  return (
    <div 
      className={cn("flex", className)}
      style={{ gap: `${gap}px` }}
    >
      {columnArrays.map((columnItems, columnIndex) => (
        <motion.div
          key={columnIndex}
          className="flex-1 flex flex-col"
          style={{ gap: `${gap}px` }}
          initial="initial"
          animate="animate"
          variants={{
            initial: {},
            animate: {
              transition: {
                staggerChildren: 0.1,
                delayChildren: columnIndex * 0.1,
              },
            },
          }}
        >
          {columnItems.map((item, itemIndex) => (
            <motion.div
              key={itemIndex}
              variants={{
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
              }}
              transition={{ ...spring.gentle }}
            >
              {item}
            </motion.div>
          ))}
        </motion.div>
      ))}
    </div>
  );
}