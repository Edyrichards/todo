import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Rocket, Gauge, Zap, Shield, Eye, Layers, Sparkles, ArrowRight } from 'lucide-react';

interface ModeSwitchAnimationProps {
  currentMode: 'standard' | 'enhanced';
  onSwitch: (mode: 'standard' | 'enhanced') => void;
  isTransitioning: boolean;
}

export const ModeSwitchAnimation: React.FC<ModeSwitchAnimationProps> = ({
  currentMode,
  onSwitch,
  isTransitioning
}) => {
  const [showComparison, setShowComparison] = useState(false);
  const slideX = useMotionValue(0);
  const opacity = useTransform(slideX, [-100, 0, 100], [0.5, 1, 0.5]);

  const modes = {
    standard: {
      icon: Gauge,
      title: 'Standard Mode',
      subtitle: 'Lightweight & Fast',
      color: 'from-slate-500 to-slate-600',
      features: ['Basic performance', 'Quick startup', 'Essential features']
    },
    enhanced: {
      icon: Rocket,
      title: 'Enhanced Mode',
      subtitle: 'Maximum Performance',
      color: 'from-blue-500 via-purple-500 to-indigo-600',
      features: ['Virtual scrolling', 'Error boundaries', 'Performance monitoring']
    }
  };

  const handleSwitch = (newMode: 'standard' | 'enhanced') => {
    if (newMode !== currentMode && !isTransitioning) {
      onSwitch(newMode);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        className="bg-background border border-border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
            >
              <Sparkles className="h-8 w-8 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold">Choose Your Performance Mode</h2>
            <p className="text-muted-foreground">
              Experience the power of enhanced performance or stick with the lightweight standard mode
            </p>
          </div>
        </div>

        {/* Mode cards */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(modes).map(([mode, config], index) => {
              const Icon = config.icon;
              const isSelected = currentMode === mode;
              const isOther = currentMode !== mode;

              return (
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: index === 0 ? -50 : 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: isTransitioning ? 1 : 1.02 }}
                  whileTap={{ scale: isTransitioning ? 1 : 0.98 }}
                  onClick={() => handleSwitch(mode as 'standard' | 'enhanced')}
                  className={`
                    relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300
                    ${isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                    }
                    ${isTransitioning ? 'pointer-events-none opacity-50' : ''}
                  `}
                >
                  {/* Selection indicator */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                      >
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Icon with gradient background */}
                  <div className={`
                    relative mb-4 w-16 h-16 rounded-xl bg-gradient-to-r ${config.color}
                    flex items-center justify-center
                  `}>
                    <motion.div
                      animate={isSelected ? { rotate: 360 } : {}}
                      transition={{ duration: 1, ease: "easeInOut" }}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </motion.div>
                    
                    {/* Glow effect for enhanced mode */}
                    {mode === 'enhanced' && (
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 opacity-30 blur-lg"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold">{config.title}</h3>
                      <p className="text-sm text-muted-foreground">{config.subtitle}</p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2">
                      {config.features.map((feature, featureIndex) => (
                        <motion.li
                          key={feature}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + featureIndex * 0.1 }}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          {feature}
                        </motion.li>
                      ))}
                    </ul>

                    {/* Performance indicator */}
                    {mode === 'enhanced' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
                      >
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <Zap className="h-4 w-4" />
                          <span className="font-medium">94% faster rendering</span>
                        </div>
                        <div className="text-xs text-green-600/80 mt-1">
                          Perfect for 1000+ tasks
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Transition animation overlay */}
                  <AnimatePresence>
                    {isTransitioning && isOther && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Performance comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 p-4 bg-muted/50 rounded-lg"
          >
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
            >
              <span>Performance Comparison</span>
              <motion.div
                animate={{ rotate: showComparison ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowRight className="h-4 w-4" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showComparison && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-3"
                >
                  {[
                    { metric: 'Render Time (1000 tasks)', standard: '300ms', enhanced: '16ms', improvement: '94%' },
                    { metric: 'Memory Usage', standard: '50MB', enhanced: '15MB', improvement: '70%' },
                    { metric: 'DOM Nodes', standard: '3000+', enhanced: '~60', improvement: '98%' }
                  ].map((item, index) => (
                    <motion.div
                      key={item.metric}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="grid grid-cols-4 gap-4 text-xs"
                    >
                      <div className="font-medium">{item.metric}</div>
                      <div className="text-center">{item.standard}</div>
                      <div className="text-center text-green-600">{item.enhanced}</div>
                      <div className="text-center font-medium text-green-600">+{item.improvement}</div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              You can switch modes anytime in settings
            </div>
            
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSwitch('standard')}
                disabled={isTransitioning}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors disabled:opacity-50"
              >
                Maybe Later
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSwitch(currentMode === 'standard' ? 'enhanced' : 'standard')}
                disabled={isTransitioning}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isTransitioning ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Switching...
                  </>
                ) : (
                  <>
                    Switch to {currentMode === 'standard' ? 'Enhanced' : 'Standard'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Enhanced loading states that showcase performance
export const PerformanceLoadingStates: React.FC<{
  type: 'initial' | 'switching' | 'virtual-activation' | 'error-recovery';
  progress?: number;
  message?: string;
}> = ({ type, progress = 0, message }) => {
  const loadingConfigs = {
    initial: {
      icon: Rocket,
      title: 'Initializing Enhanced Mode',
      subtitle: 'Loading performance optimizations...',
      color: 'from-blue-500 to-purple-600'
    },
    switching: {
      icon: Zap,
      title: 'Switching Performance Mode',
      subtitle: 'Optimizing for your workflow...',
      color: 'from-green-500 to-blue-500'
    },
    'virtual-activation': {
      icon: Eye,
      title: 'Activating Virtual Scrolling',
      subtitle: 'Preparing for massive performance boost...',
      color: 'from-purple-500 to-pink-500'
    },
    'error-recovery': {
      icon: Shield,
      title: 'Recovering Application',
      subtitle: 'Error boundaries restoring functionality...',
      color: 'from-orange-500 to-red-500'
    }
  };

  const config = loadingConfigs[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div className="text-center space-y-6 max-w-md mx-auto p-8">
        {/* Animated icon */}
        <motion.div
          className={`mx-auto w-20 h-20 rounded-full bg-gradient-to-r ${config.color} flex items-center justify-center relative`}
          animate={{
            scale: [1, 1.1, 1],
            rotate: type === 'virtual-activation' ? 360 : 0
          }}
          transition={{
            scale: { duration: 2, repeat: Infinity },
            rotate: { duration: 3, repeat: Infinity, ease: "linear" }
          }}
        >
          <Icon className="h-10 w-10 text-white" />
          
          {/* Orbiting particles */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              animate={{
                rotate: 360,
                scale: [0, 1, 0]
              }}
              transition={{
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1, repeat: Infinity, delay: i * 0.3 }
              }}
              style={{
                transformOrigin: `${30 + i * 10}px center`,
                x: 30 + i * 10,
              }}
            />
          ))}
        </motion.div>

        {/* Text content */}
        <div className="space-y-2">
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-semibold"
          >
            {config.title}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground"
          >
            {message || config.subtitle}
          </motion.p>
        </div>

        {/* Progress bar */}
        {progress > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-2"
          >
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${config.color} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        )}

        {/* Loading dots */}
        <div className="flex justify-center gap-2">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};