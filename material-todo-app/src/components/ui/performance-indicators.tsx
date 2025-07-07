import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { Zap, Gauge, Shield, Eye, Sparkles, Rocket, Target } from 'lucide-react';

interface PerformanceModeIndicatorProps {
  isEnhanced: boolean;
  taskCount: number;
  isVirtual: boolean;
  renderTime: number;
  onToggleMode?: () => void;
}

export const PerformanceModeIndicator: React.FC<PerformanceModeIndicatorProps> = ({
  isEnhanced,
  taskCount,
  isVirtual,
  renderTime,
  onToggleMode
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Animated values
  const springConfig = { tension: 300, friction: 30 };
  const scale = useSpring(isEnhanced ? 1.1 : 1, springConfig);
  const opacity = useSpring(isEnhanced ? 1 : 0.7, springConfig);
  
  // Performance metrics animations
  const performanceScore = Math.max(0, Math.min(100, 100 - (renderTime * 2)));
  const animatedScore = useSpring(performanceScore, { tension: 120, friction: 14 });
  
  // Celebration effect when virtual scrolling activates
  useEffect(() => {
    if (isVirtual && taskCount > 50) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isVirtual, taskCount]);

  const modeVariants = {
    standard: {
      background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
      boxShadow: '0 4px 12px rgba(100, 116, 139, 0.3)',
    },
    enhanced: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #7c3aed 100%)',
      boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4), 0 0 20px rgba(124, 58, 237, 0.2)',
    }
  };

  const iconVariants = {
    standard: { rotate: 0, scale: 1 },
    enhanced: { rotate: [0, 360], scale: [1, 1.2, 1] }
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      {/* Main mode indicator */}
      <motion.div
        style={{ scale, opacity }}
        animate={isEnhanced ? "enhanced" : "standard"}
        variants={modeVariants}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="relative rounded-xl p-4 text-white cursor-pointer overflow-hidden"
        onClick={() => setShowDetails(!showDetails)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Background pulse effect for enhanced mode */}
        {isEnhanced && (
          <motion.div
            className="absolute inset-0 rounded-xl opacity-30"
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, rgba(124, 58, 237, 0.3) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)'
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        )}

        <div className="relative flex items-center gap-3">
          {/* Mode icon */}
          <motion.div
            variants={iconVariants}
            animate={isEnhanced ? "enhanced" : "standard"}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            {isEnhanced ? (
              <Rocket className="h-6 w-6" />
            ) : (
              <Gauge className="h-6 w-6" />
            )}
          </motion.div>

          <div>
            <div className="font-semibold text-sm">
              {isEnhanced ? 'Enhanced' : 'Standard'}
            </div>
            <div className="text-xs opacity-90">
              {taskCount} tasks • {renderTime.toFixed(1)}ms
            </div>
          </div>

          {/* Performance badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs font-medium"
          >
            {Math.round(performanceScore)}
          </motion.div>
        </div>

        {/* Virtual scrolling indicator */}
        <AnimatePresence>
          {isVirtual && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-2 right-2"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="p-1 bg-white/20 rounded-full"
              >
                <Zap className="h-3 w-3" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Detailed metrics panel */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", damping: 20 }}
            className="mt-2 p-4 bg-background/95 backdrop-blur-lg border border-border rounded-xl shadow-xl"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Performance Score</span>
                <motion.span
                  className="text-sm font-bold"
                  style={{ 
                    color: performanceScore > 80 ? '#10b981' : 
                           performanceScore > 60 ? '#f59e0b' : '#ef4444'
                  }}
                >
                  {Math.round(performanceScore)}/100
                </motion.span>
              </div>

              {/* Animated progress bar */}
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${performanceScore}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{
                    background: performanceScore > 80 ? 
                      'linear-gradient(90deg, #10b981, #34d399)' :
                      performanceScore > 60 ?
                      'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                      'linear-gradient(90deg, #ef4444, #f87171)'
                  }}
                />
              </div>

              {/* Feature indicators */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <motion.div
                  className="flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                >
                  <Shield className={`h-3 w-3 ${isEnhanced ? 'text-green-500' : 'text-gray-400'}`} />
                  <span>Error Boundaries</span>
                </motion.div>
                
                <motion.div
                  className="flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                >
                  <Eye className={`h-3 w-3 ${isVirtual ? 'text-blue-500' : 'text-gray-400'}`} />
                  <span>Virtual Scrolling</span>
                </motion.div>
              </div>

              {/* Toggle button */}
              {onToggleMode && (
                <motion.button
                  onClick={onToggleMode}
                  className="w-full mt-3 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Switch to {isEnhanced ? 'Standard' : 'Enhanced'} Mode
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute -top-8 -right-8 pointer-events-none"
          >
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.5, 1]
              }}
              transition={{
                duration: 2,
                repeat: 2,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="h-8 w-8 text-yellow-400" />
            </motion.div>
            
            {/* Particle effects */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 1,
                  scale: 1
                }}
                animate={{
                  x: Math.cos(i * 60) * 30,
                  y: Math.sin(i * 60) * 30,
                  opacity: 0,
                  scale: 0
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Performance metrics with smooth animations
export const AnimatedMetrics: React.FC<{
  renderTime: number;
  taskCount: number;
  memoryUsage?: number;
  fps: number;
}> = ({ renderTime, taskCount, memoryUsage, fps }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const metrics = [
    {
      label: 'Render Time',
      value: renderTime,
      unit: 'ms',
      color: renderTime < 50 ? '#10b981' : renderTime < 100 ? '#f59e0b' : '#ef4444',
      icon: Target
    },
    {
      label: 'Tasks',
      value: taskCount,
      unit: '',
      color: '#3b82f6',
      icon: Eye
    },
    {
      label: 'FPS',
      value: fps,
      unit: '',
      color: fps > 55 ? '#10b981' : fps > 30 ? '#f59e0b' : '#ef4444',
      icon: Zap
    }
  ];

  if (memoryUsage) {
    metrics.push({
      label: 'Memory',
      value: memoryUsage,
      unit: 'MB',
      color: memoryUsage < 50 ? '#10b981' : memoryUsage < 100 ? '#f59e0b' : '#ef4444',
      icon: Gauge
    });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ 
            delay: index * 0.1,
            type: "spring",
            stiffness: 200,
            damping: 20
          }}
          whileHover={{ scale: 1.05, y: -2 }}
          className="p-3 bg-card border border-border rounded-lg text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
            className="flex justify-center mb-2"
          >
            <metric.icon className="h-4 w-4" style={{ color: metric.color }} />
          </motion.div>
          
          <motion.div
            className="text-lg font-bold"
            style={{ color: metric.color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.5 }}
          >
            {typeof metric.value === 'number' ? metric.value.toFixed(1) : metric.value}
            {metric.unit}
          </motion.div>
          
          <div className="text-xs text-muted-foreground">
            {metric.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
};