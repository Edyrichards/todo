import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  Rocket, Eye, Shield, Zap, Gauge, Target, Sparkles, 
  ArrowRight, Play, Pause, RotateCcw, Monitor, Smartphone 
} from 'lucide-react';

interface PerformanceShowcaseProps {
  isVisible: boolean;
  onClose: () => void;
}

export const PerformanceShowcase: React.FC<PerformanceShowcaseProps> = ({
  isVisible,
  onClose
}) => {
  const [currentDemo, setCurrentDemo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [metrics, setMetrics] = useState({
    renderTime: 300,
    domNodes: 3000,
    memoryUsage: 50,
    isVirtual: false
  });

  const controls = useAnimation();

  const demos = [
    {
      title: 'Virtual Scrolling Activation',
      description: 'Watch performance transform as virtual scrolling kicks in',
      icon: Eye,
      color: 'from-blue-500 to-purple-600',
      demo: 'virtual-scrolling'
    },
    {
      title: 'Error Boundary Protection',
      description: 'See how error boundaries catch and recover from failures',
      icon: Shield,
      color: 'from-green-500 to-blue-500',
      demo: 'error-boundary'
    },
    {
      title: 'Performance Metrics',
      description: 'Real-time performance monitoring in action',
      icon: Gauge,
      color: 'from-purple-500 to-pink-500',
      demo: 'metrics'
    },
    {
      title: 'Task Interactions',
      description: 'Buttery smooth micro-interactions and animations',
      icon: Sparkles,
      color: 'from-yellow-500 to-orange-500',
      demo: 'interactions'
    }
  ];

  const currentDemoData = demos[currentDemo];

  // Auto-advance demo
  useEffect(() => {
    if (isPlaying) {
      const timer = setInterval(() => {
        setCurrentDemo(prev => (prev + 1) % demos.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [isPlaying, demos.length]);

  // Performance improvement animation
  const animatePerformanceImprovement = async () => {
    setIsPlaying(true);
    
    // Start with poor performance
    setMetrics({
      renderTime: 300,
      domNodes: 3000,
      memoryUsage: 50,
      isVirtual: false
    });

    await controls.start({
      scale: [1, 1.1, 1],
      transition: { duration: 1 }
    });

    // Simulate virtual scrolling activation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setMetrics({
      renderTime: 16,
      domNodes: 60,
      memoryUsage: 15,
      isVirtual: true
    });

    await controls.start({
      rotateY: [0, 360],
      transition: { duration: 1.5, ease: "easeInOut" }
    });
  };

  const renderDemo = () => {
    switch (currentDemoData.demo) {
      case 'virtual-scrolling':
        return (
          <div className="space-y-4">
            <div className="relative h-40 bg-muted rounded-lg overflow-hidden">
              {/* Before: Many DOM nodes */}
              <motion.div
                className="absolute inset-0 grid grid-cols-8 gap-1 p-2"
                animate={metrics.isVirtual ? { opacity: 0 } : { opacity: 1 }}
              >
                {[...Array(48)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="bg-red-400/50 rounded"
                    animate={{ 
                      scale: [1, 0.95, 1],
                      backgroundColor: ['rgba(248, 113, 113, 0.5)', 'rgba(248, 113, 113, 0.7)', 'rgba(248, 113, 113, 0.5)']
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                  />
                ))}
              </motion.div>

              {/* After: Virtual scrolling */}
              <motion.div
                className="absolute inset-0 grid grid-cols-8 gap-1 p-2"
                animate={metrics.isVirtual ? { opacity: 1 } : { opacity: 0 }}
              >
                {[...Array(16)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="bg-green-400/70 rounded"
                    animate={{ 
                      scale: [1, 1.05, 1],
                      backgroundColor: ['rgba(74, 222, 128, 0.7)', 'rgba(74, 222, 128, 0.9)', 'rgba(74, 222, 128, 0.7)']
                    }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.05 }}
                  />
                ))}
                
                {/* Virtual scrolling indicator */}
                <motion.div
                  className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Eye className="h-3 w-3" />
                  Virtual
                </motion.div>
              </motion.div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <motion.div
                  className="text-2xl font-bold"
                  animate={{ color: metrics.isVirtual ? '#10b981' : '#ef4444' }}
                >
                  {metrics.renderTime}ms
                </motion.div>
                <div className="text-xs text-muted-foreground">Render Time</div>
              </div>
              <div className="space-y-1">
                <motion.div
                  className="text-2xl font-bold"
                  animate={{ color: metrics.isVirtual ? '#10b981' : '#ef4444' }}
                >
                  {metrics.domNodes}
                </motion.div>
                <div className="text-xs text-muted-foreground">DOM Nodes</div>
              </div>
              <div className="space-y-1">
                <motion.div
                  className="text-2xl font-bold"
                  animate={{ color: metrics.isVirtual ? '#10b981' : '#ef4444' }}
                >
                  {metrics.memoryUsage}MB
                </motion.div>
                <div className="text-xs text-muted-foreground">Memory</div>
              </div>
            </div>
          </div>
        );

      case 'error-boundary':
        return (
          <div className="space-y-4">
            <div className="relative h-40 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              <motion.div
                animate={controls}
                className="relative"
              >
                {/* Shield animation */}
                <motion.div
                  className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(59, 130, 246, 0.3)',
                      '0 0 40px rgba(59, 130, 246, 0.6)',
                      '0 0 20px rgba(59, 130, 246, 0.3)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Shield className="h-8 w-8 text-white" />
                </motion.div>

                {/* Protection rings */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border-2 border-blue-400/50"
                    animate={{
                      scale: [1, 1.5 + i * 0.3, 1],
                      opacity: [0.8, 0, 0.8]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3
                    }}
                  />
                ))}
              </motion.div>
            </div>

            <div className="text-center space-y-2">
              <div className="text-sm font-medium text-green-600">
                ✓ Error Boundaries Active
              </div>
              <div className="text-xs text-muted-foreground">
                Page • Feature • Component level protection
              </div>
            </div>
          </div>
        );

      case 'metrics':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'FPS', value: 60, icon: Target, color: 'text-green-500' },
                { label: 'Tasks', value: 1250, icon: Eye, color: 'text-blue-500' },
                { label: 'Memory', value: 15, icon: Gauge, color: 'text-purple-500' },
                { label: 'Render', value: 16, icon: Zap, color: 'text-yellow-500' }
              ].map((metric, index) => (
                <motion.div
                  key={metric.label}
                  className="p-3 bg-card border border-border rounded-lg text-center"
                  whileHover={{ scale: 1.05 }}
                  animate={{
                    borderColor: [
                      'rgba(226, 232, 240, 1)',
                      'rgba(59, 130, 246, 0.5)',
                      'rgba(226, 232, 240, 1)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                >
                  <metric.icon className={`h-4 w-4 mx-auto mb-1 ${metric.color}`} />
                  <div className={`text-lg font-bold ${metric.color}`}>
                    {metric.value}{metric.label === 'Memory' ? 'MB' : metric.label === 'Render' ? 'ms' : ''}
                  </div>
                  <div className="text-xs text-muted-foreground">{metric.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'interactions':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="p-3 bg-card border border-border rounded-lg flex items-center gap-3"
                  whileHover={{ scale: 1.02, x: 5 }}
                  animate={{
                    x: [0, 5, 0],
                    boxShadow: [
                      '0 1px 3px rgba(0, 0, 0, 0.1)',
                      '0 4px 20px rgba(59, 130, 246, 0.2)',
                      '0 1px 3px rgba(0, 0, 0, 0.1)'
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                >
                  <motion.div
                    className="w-4 h-4 border-2 border-primary rounded flex items-center justify-center"
                    whileHover={{ scale: 1.2, rotate: 360 }}
                  >
                    <motion.div
                      className="w-2 h-2 bg-primary rounded-full"
                      animate={{ scale: [0, 1, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    />
                  </motion.div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">Sample Task {i + 1}</div>
                    <div className="text-xs text-muted-foreground">Smooth interactions</div>
                  </div>
                  <motion.div
                    className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
                    animate={{ scale: [1, 1.5, 1], rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            className="bg-background border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
                  >
                    <Rocket className="h-5 w-5 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-bold">Performance Showcase</h2>
                    <p className="text-sm text-muted-foreground">
                      Experience the enhanced capabilities in action
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Demo navigation */}
              <div className="flex gap-2">
                {demos.map((demo, index) => (
                  <motion.button
                    key={demo.title}
                    onClick={() => setCurrentDemo(index)}
                    className={`
                      flex-1 p-2 rounded-lg text-xs font-medium transition-all
                      ${currentDemo === index 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted hover:bg-accent'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <demo.icon className="h-3 w-3 mx-auto mb-1" />
                    {demo.title.split(' ')[0]}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Demo content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <motion.div
                  className={`mx-auto w-12 h-12 rounded-full bg-gradient-to-r ${currentDemoData.color} flex items-center justify-center mb-3`}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <currentDemoData.icon className="h-6 w-6 text-white" />
                </motion.div>
                <h3 className="text-lg font-semibold mb-1">{currentDemoData.title}</h3>
                <p className="text-sm text-muted-foreground">{currentDemoData.description}</p>
              </div>

              {/* Demo visualization */}
              <motion.div
                key={currentDemo}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderDemo()}
              </motion.div>
            </div>

            {/* Controls */}
            <div className="p-6 border-t border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </motion.button>
                  
                  <motion.button
                    onClick={animatePerformanceImprovement}
                    className="p-2 border border-border rounded-lg hover:bg-accent transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </motion.button>

                  <div className="text-xs text-muted-foreground ml-2">
                    {currentDemo + 1} / {demos.length}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Monitor className="h-3 w-3" />
                    <span>Desktop</span>
                  </div>
                  <div className="w-px h-4 bg-border" />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Smartphone className="h-3 w-3" />
                    <span>Mobile</span>
                  </div>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="mt-4 flex gap-1">
                {demos.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`h-1 rounded-full flex-1 ${
                      index === currentDemo ? 'bg-primary' : 'bg-muted'
                    }`}
                    animate={index === currentDemo ? { opacity: [0.5, 1, 0.5] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};