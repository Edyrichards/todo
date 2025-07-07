import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { AlertTriangle, Shield, RefreshCcw, CheckCircle, Zap, Sparkles, Heart } from 'lucide-react';

interface ErrorRecoveryAnimationProps {
  isRecovering: boolean;
  recoveryProgress: number;
  errorType: 'component' | 'feature' | 'data' | 'network';
  onRetry?: () => void;
  onComplete?: () => void;
}

export const ErrorRecoveryAnimation: React.FC<ErrorRecoveryAnimationProps> = ({
  isRecovering,
  recoveryProgress,
  errorType,
  onRetry,
  onComplete
}) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const controls = useAnimation();

  const errorConfigs = {
    component: {
      icon: AlertTriangle,
      title: 'Component Recovery',
      message: 'Restoring component functionality...',
      color: 'from-orange-500 to-red-500'
    },
    feature: {
      icon: Shield,
      title: 'Feature Recovery',
      message: 'Rebuilding feature state...',
      color: 'from-blue-500 to-purple-500'
    },
    data: {
      icon: RefreshCcw,
      title: 'Data Recovery',
      message: 'Synchronizing data state...',
      color: 'from-green-500 to-blue-500'
    },
    network: {
      icon: Zap,
      title: 'Connection Recovery',
      message: 'Reestablishing connection...',
      color: 'from-yellow-500 to-orange-500'
    }
  };

  const config = errorConfigs[errorType];
  const Icon = config.icon;

  // Success animation
  useEffect(() => {
    if (recoveryProgress >= 100 && !showSuccess) {
      setShowSuccess(true);
      controls.start({
        scale: [1, 1.2, 1],
        rotate: [0, 360, 0],
        transition: { duration: 1, ease: "easeInOut" }
      });
      
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [recoveryProgress, showSuccess, controls, onComplete]);

  if (!isRecovering && !showSuccess) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          className="bg-background border border-border rounded-xl p-8 max-w-md w-full shadow-2xl"
        >
          {!showSuccess ? (
            // Recovery in progress
            <div className="text-center space-y-6">
              {/* Animated icon */}
              <motion.div
                animate={controls}
                className={`mx-auto w-16 h-16 rounded-full bg-gradient-to-r ${config.color} flex items-center justify-center relative`}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Icon className="h-8 w-8 text-white" />
                </motion.div>

                {/* Healing particles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    animate={{
                      scale: [0, 1, 0],
                      x: Math.cos((i * Math.PI * 2) / 6) * 30,
                      y: Math.sin((i * Math.PI * 2) / 6) * 30,
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.1
                    }}
                  />
                ))}
              </motion.div>

              {/* Title and message */}
              <div className="space-y-2">
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg font-semibold"
                >
                  {config.title}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-muted-foreground text-sm"
                >
                  {config.message}
                </motion.p>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Recovery Progress</span>
                  <span className="font-mono">{Math.round(recoveryProgress)}%</span>
                </div>
                
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${config.color} rounded-full relative`}
                    initial={{ width: 0 }}
                    animate={{ width: `${recoveryProgress}%` }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Shimmer effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: [-100, 200] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </motion.div>
                </div>
              </div>

              {/* Recovery steps */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-left space-y-2"
              >
                <div className="text-sm font-medium text-muted-foreground mb-2">Recovery Steps:</div>
                {[
                  { step: 'Diagnosing issue', completed: recoveryProgress > 20 },
                  { step: 'Clearing corrupted state', completed: recoveryProgress > 50 },
                  { step: 'Restoring functionality', completed: recoveryProgress > 80 },
                  { step: 'Verifying integrity', completed: recoveryProgress >= 100 }
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <motion.div
                      className={`w-2 h-2 rounded-full ${
                        item.completed ? 'bg-green-500' : 'bg-muted'
                      }`}
                      animate={item.completed ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    />
                    <span className={item.completed ? 'text-foreground' : 'text-muted-foreground'}>
                      {item.step}
                    </span>
                    {item.completed && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </motion.div>

              {/* Manual retry button */}
              {onRetry && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={onRetry}
                  className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Force Retry
                </motion.button>
              )}
            </div>
          ) : (
            // Success state
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              {/* Success icon */}
              <motion.div
                animate={controls}
                className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center relative"
              >
                <CheckCircle className="h-8 w-8 text-white" />
                
                {/* Success particles */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-green-400 rounded-full"
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{
                      scale: [0, 1, 0],
                      x: Math.cos((i * Math.PI * 2) / 8) * 40,
                      y: Math.sin((i * Math.PI * 2) / 8) * 40,
                      opacity: [1, 1, 0]
                    }}
                    transition={{
                      duration: 1,
                      delay: i * 0.1
                    }}
                  />
                ))}
              </motion.div>

              {/* Success message */}
              <div className="space-y-2">
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg font-semibold text-green-600"
                >
                  Recovery Complete!
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-muted-foreground text-sm"
                >
                  All systems restored and functioning normally
                </motion.p>
              </div>

              {/* Recovery stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-3 gap-4 text-center"
              >
                {[
                  { label: 'Recovery Time', value: '2.3s', icon: Zap },
                  { label: 'Data Integrity', value: '100%', icon: Shield },
                  { label: 'User Impact', value: 'Zero', icon: Heart }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="space-y-1"
                  >
                    <stat.icon className="h-4 w-4 mx-auto text-green-500" />
                    <div className="text-sm font-medium">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Error boundary activation animation
export const ErrorBoundaryActivation: React.FC<{
  isVisible: boolean;
  boundaryLevel: 'page' | 'feature' | 'component';
  errorMessage?: string;
}> = ({ isVisible, boundaryLevel, errorMessage }) => {
  const [animationPhase, setAnimationPhase] = useState<'shield' | 'analysis' | 'recovery'>('shield');

  useEffect(() => {
    if (isVisible) {
      const sequence = async () => {
        setAnimationPhase('shield');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAnimationPhase('analysis');
        await new Promise(resolve => setTimeout(resolve, 1500));
        setAnimationPhase('recovery');
      };
      sequence();
    }
  }, [isVisible]);

  const levelConfigs = {
    page: { color: 'from-red-500 to-pink-500', intensity: 'high' },
    feature: { color: 'from-orange-500 to-red-500', intensity: 'medium' },
    component: { color: 'from-yellow-500 to-orange-500', intensity: 'low' }
  };

  const config = levelConfigs[boundaryLevel];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-4 right-4 z-50"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className={`p-4 rounded-xl bg-gradient-to-r ${config.color} text-white shadow-xl`}
          >
            <div className="flex items-center gap-3">
              {/* Animated shield */}
              <motion.div
                className="relative"
                animate={
                  animationPhase === 'shield' 
                    ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }
                    : animationPhase === 'analysis'
                    ? { scale: 1, rotate: 0 }
                    : { scale: [1, 1.1, 1] }
                }
                transition={{ duration: 0.8, repeat: animationPhase === 'recovery' ? Infinity : 0 }}
              >
                <Shield className="h-6 w-6" />
                
                {/* Shield energy */}
                {animationPhase === 'shield' && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-white/50"
                    animate={{ scale: [1, 2, 3], opacity: [1, 0.5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </motion.div>

              <div>
                <div className="font-semibold text-sm">
                  {animationPhase === 'shield' && 'Error Boundary Activated'}
                  {animationPhase === 'analysis' && 'Analyzing Error'}
                  {animationPhase === 'recovery' && 'Initiating Recovery'}
                </div>
                <div className="text-xs opacity-90">
                  {boundaryLevel.charAt(0).toUpperCase() + boundaryLevel.slice(1)} level protection
                </div>
              </div>

              {/* Phase indicator */}
              <motion.div
                className="ml-auto w-2 h-2 rounded-full bg-white"
                animate={
                  animationPhase === 'shield'
                    ? { scale: [1, 1.5, 1] }
                    : animationPhase === 'analysis'
                    ? { opacity: [1, 0.3, 1] }
                    : { scale: [1, 1.2, 1] }
                }
                transition={{ duration: 0.6, repeat: Infinity }}
              />
            </div>

            {/* Error details */}
            <AnimatePresence>
              {errorMessage && animationPhase === 'analysis' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-white/20 text-xs"
                >
                  <div className="truncate opacity-75">
                    {errorMessage}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recovery progress */}
            <AnimatePresence>
              {animationPhase === 'recovery' && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: '100%' }}
                  className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden"
                >
                  <motion.div
                    className="h-full bg-white rounded-full"
                    animate={{ width: ['0%', '100%'] }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};