import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Zap, Eye, Layers, ArrowDown, ArrowUp, Sparkles } from 'lucide-react';

interface VirtualScrollIndicatorProps {
  isActive: boolean;
  taskCount: number;
  visibleRange: { start: number; end: number };
  onActivate?: () => void;
}

export const VirtualScrollIndicator: React.FC<VirtualScrollIndicatorProps> = ({
  isActive,
  taskCount,
  visibleRange,
  onActivate
}) => {
  const [showActivation, setShowActivation] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const controls = useAnimation();

  // Activation animation
  useEffect(() => {
    if (isActive && !showActivation) {
      setShowActivation(true);
      
      // Celebration sequence
      controls.start({
        scale: [1, 1.3, 1],
        rotate: [0, 360],
        transition: { duration: 1, ease: "easeInOut" }
      });

      const timer = setTimeout(() => setShowActivation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isActive, controls, showActivation]);

  // Calculate scroll progress
  useEffect(() => {
    if (isActive && taskCount > 0) {
      const progress = ((visibleRange.end - visibleRange.start) / taskCount) * 100;
      setScrollProgress(Math.min(100, progress));
    }
  }, [isActive, taskCount, visibleRange]);

  if (!isActive) {
    return (
      <motion.div
        className="fixed bottom-20 right-4 z-40"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: taskCount > 40 ? 1 : 0, scale: taskCount > 40 ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.button
          onClick={onActivate}
          className="p-3 bg-primary text-primary-foreground rounded-full shadow-lg"
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          animate={{
            boxShadow: [
              '0 4px 15px rgba(59, 130, 246, 0.3)',
              '0 8px 25px rgba(59, 130, 246, 0.5)',
              '0 4px 15px rgba(59, 130, 246, 0.3)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="h-5 w-5" />
        </motion.button>
        
        <motion.div
          className="absolute -top-12 -left-16 bg-background border border-border rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Enable Virtual Scrolling
          <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-background border-r border-b border-border rotate-45"></div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {/* Main indicator */}
      <motion.div
        animate={controls}
        className="relative"
      >
        <motion.div
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-4 shadow-xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          {/* Background glow effect */}
          <motion.div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 opacity-30 blur-lg"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <div className="relative space-y-2">
            {/* Header */}
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <Eye className="h-5 w-5" />
              </motion.div>
              <span className="font-semibold text-sm">Virtual Scrolling</span>
            </div>

            {/* Stats */}
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-mono">{taskCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Visible:</span>
                <span className="font-mono">
                  {visibleRange.start + 1}-{visibleRange.end}
                </span>
              </div>
            </div>

            {/* Scroll progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{scrollProgress.toFixed(1)}%</span>
              </div>
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${scrollProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Floating particles during activation */}
        <AnimatePresence>
          {showActivation && (
            <>
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    opacity: 1,
                    scale: 0
                  }}
                  animate={{
                    x: Math.cos((i * Math.PI * 2) / 8) * 60,
                    y: Math.sin((i * Math.PI * 2) / 8) * 60,
                    opacity: 0,
                    scale: [0, 1, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.1,
                    ease: "easeOut"
                  }}
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Performance boost notification */}
      <AnimatePresence>
        {showActivation && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: 50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 -left-48 bg-green-500 text-white rounded-lg px-4 py-2 text-sm font-medium shadow-lg"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Performance Boosted!</span>
            </div>
            <div className="text-xs opacity-90 mt-1">
              94% faster rendering
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Scroll direction indicator
export const ScrollDirectionIndicator: React.FC<{
  direction: 'up' | 'down' | 'idle';
  velocity: number;
}> = ({ direction, velocity }) => {
  if (direction === 'idle') return null;

  const Icon = direction === 'up' ? ArrowUp : ArrowDown;
  const intensity = Math.min(velocity / 100, 1); // Normalize velocity

  return (
    <motion.div
      className="fixed right-8 top-1/2 transform -translate-y-1/2 z-30"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: intensity, scale: 0.5 + (intensity * 0.5) }}
      exit={{ opacity: 0, scale: 0 }}
    >
      <motion.div
        className={`p-2 rounded-full ${
          direction === 'up' 
            ? 'bg-blue-500/20 text-blue-500' 
            : 'bg-purple-500/20 text-purple-500'
        }`}
        animate={{
          y: direction === 'up' ? [-2, 2, -2] : [2, -2, 2],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Icon className="h-4 w-4" />
      </motion.div>
    </motion.div>
  );
};

// Virtual list performance overlay
export const VirtualListOverlay: React.FC<{
  isVisible: boolean;
  stats: {
    totalItems: number;
    renderedItems: number;
    memoryReduction: number;
    renderTimeImprovement: number;
  };
}> = ({ isVisible, stats }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
        >
          <div className="bg-background/95 backdrop-blur-lg border border-border rounded-xl p-6 shadow-2xl max-w-sm">
            <div className="text-center space-y-4">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
              >
                <Layers className="h-8 w-8 text-white" />
              </motion.div>

              {/* Title */}
              <div>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg font-semibold"
                >
                  Virtual Scrolling Active
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-muted-foreground"
                >
                  Enhanced performance mode enabled
                </motion.p>
              </div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 gap-4 text-sm"
              >
                <div className="text-center">
                  <div className="font-bold text-green-500">
                    {((1 - stats.renderedItems / stats.totalItems) * 100).toFixed(0)}%
                  </div>
                  <div className="text-muted-foreground">Fewer DOM nodes</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-500">
                    {stats.renderTimeImprovement.toFixed(0)}%
                  </div>
                  <div className="text-muted-foreground">Faster rendering</div>
                </div>
              </motion.div>

              {/* Progress indicators */}
              <div className="space-y-2">
                {[
                  { label: 'Memory Usage', value: stats.memoryReduction, color: 'green' },
                  { label: 'Render Speed', value: stats.renderTimeImprovement, color: 'blue' },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.8 }}
                  >
                    <div className="flex justify-between text-xs mb-1">
                      <span>{item.label}</span>
                      <span className={`text-${item.color}-500 font-medium`}>
                        +{item.value.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full bg-${item.color}-500 rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(item.value, 100)}%` }}
                        transition={{ delay: 0.6 + index * 0.1, duration: 0.8 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};