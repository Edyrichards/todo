import { useAnimation, Variants } from 'framer-motion';
import { useEffect, useState } from 'react';

// Common animation variants
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

export const slideUp: Variants = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
};

export const slideDown: Variants = {
  initial: { y: '-100%' },
  animate: { y: 0 },
  exit: { y: '-100%' },
};

export const slideLeft: Variants = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
};

export const slideRight: Variants = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' },
};

// Stagger container for list animations
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

// Stagger item for individual list items
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300,
    },
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.2,
    },
  },
};

// Bounce animation for success states
export const bounceIn: Variants = {
  initial: { scale: 0 },
  animate: { 
    scale: 1,
    transition: {
      type: "spring",
      damping: 10,
      stiffness: 400,
    },
  },
  exit: { scale: 0 },
};

// Gentle pulse for loading states
export const pulse: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Shimmer effect for skeleton loading
export const shimmer: Variants = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// Smooth transitions for page changes
export const pageTransition = {
  type: "spring",
  damping: 20,
  stiffness: 300,
  duration: 0.4,
};

// Smooth transitions for modals/dialogs
export const modalTransition = {
  type: "spring",
  damping: 25,
  stiffness: 300,
};

// Elastic animation for interactive elements
export const elasticHover: Variants = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 400,
    },
  },
  tap: { 
    scale: 0.95,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 500,
    },
  },
};

// Floating animation for CTAs
export const floating: Variants = {
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Rotation animation for refresh/loading
export const rotate: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// Custom hooks for common animation patterns
export function useStaggeredList(items: any[], delay = 0.1) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, [items]);

  return {
    container: {
      animate: animate ? "animate" : "initial",
      variants: {
        initial: {},
        animate: {
          transition: {
            staggerChildren: delay,
          },
        },
      },
    },
    item: {
      variants: staggerItem,
    },
  };
}

export function useSequentialAnimation(count: number, delay = 200) {
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    if (currentIndex < count - 1) {
      const timer = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, count, delay]);

  const startAnimation = () => setCurrentIndex(0);
  const resetAnimation = () => setCurrentIndex(-1);

  return { currentIndex, startAnimation, resetAnimation };
}

export function useHoverScale(scale = 1.05) {
  const controls = useAnimation();

  const handleHoverStart = () => {
    controls.start({
      scale,
      transition: { type: "spring", damping: 20, stiffness: 300 },
    });
  };

  const handleHoverEnd = () => {
    controls.start({
      scale: 1,
      transition: { type: "spring", damping: 20, stiffness: 300 },
    });
  };

  return {
    animate: controls,
    whileHover: { scale },
    onHoverStart: handleHoverStart,
    onHoverEnd: handleHoverEnd,
  };
}

export function useSuccessAnimation() {
  const controls = useAnimation();

  const triggerSuccess = async () => {
    await controls.start({
      scale: [1, 1.2, 1],
      rotate: [0, 10, -10, 0],
      transition: {
        duration: 0.5,
        times: [0, 0.5, 1],
      },
    });
  };

  return { animate: controls, triggerSuccess };
}

export function useShakeAnimation() {
  const controls = useAnimation();

  const triggerShake = async () => {
    await controls.start({
      x: [0, -10, 10, -10, 10, 0],
      transition: {
        duration: 0.5,
      },
    });
  };

  return { animate: controls, triggerShake };
}

// Intersection Observer hook for scroll-triggered animations
export function useInViewAnimation(threshold = 0.1) {
  const [isInView, setIsInView] = useState(false);
  const [ref, setRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold }
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, threshold]);

  return { ref: setRef, isInView };
}

// Common easing functions
export const easing = {
  easeOutCubic: [0.215, 0.61, 0.355, 1],
  easeInOutCubic: [0.645, 0.045, 0.355, 1],
  easeOutBack: [0.175, 0.885, 0.32, 1.275],
  easeInOutBack: [0.68, -0.55, 0.265, 1.55],
  easeOutElastic: [0.25, 0.46, 0.45, 0.94],
  easeInOut: [0.4, 0, 0.2, 1],
};

// Duration constants
export const duration = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8,
};

// Spring configurations
export const spring = {
  gentle: { type: "spring", damping: 20, stiffness: 300 },
  bouncy: { type: "spring", damping: 10, stiffness: 400 },
  smooth: { type: "spring", damping: 25, stiffness: 200 },
  quick: { type: "spring", damping: 30, stiffness: 500 },
};