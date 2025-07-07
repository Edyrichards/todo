import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Clock, Eye, AlertTriangle } from 'lucide-react';

interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage?: number;
  taskCount: number;
  lastUpdate: number;
  fps: number;
  isVirtual: boolean;
}

interface PerformanceMonitorProps {
  taskCount: number;
  isVirtual?: boolean;
  showDetailedMetrics?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  taskCount,
  isVirtual = false,
  showDetailedMetrics = false
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentCount: 0,
    taskCount,
    lastUpdate: Date.now(),
    fps: 60,
    isVirtual
  });
  
  const [showDetails, setShowDetails] = useState(false);
  const [performanceAlerts, setPerformanceAlerts] = useState<string[]>([]);
  const renderStartTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const lastFrameTime = useRef<number>(performance.now());

  // Measure render performance
  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    
    // Calculate approximate component count based on task count and view type
    const baseComponents = 10; // Header, Sidebar, etc.
    const taskComponents = isVirtual ? Math.min(taskCount, 20) : taskCount; // Virtual scrolling limits rendered items
    const componentCount = baseComponents + taskComponents * 3; // Estimate 3 components per task

    // Measure memory usage (if available)
    let memoryUsage: number | undefined;
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }

    // Calculate FPS
    const now = performance.now();
    const deltaTime = now - lastFrameTime.current;
    if (deltaTime > 0) {
      const currentFps = 1000 / deltaTime;
      setMetrics(prev => ({
        ...prev,
        renderTime,
        componentCount,
        memoryUsage,
        taskCount,
        lastUpdate: Date.now(),
        fps: Math.round((prev.fps * 0.9) + (currentFps * 0.1)) // Smoothed FPS
      }));
    }
    lastFrameTime.current = now;

    // Performance alerts
    const alerts: string[] = [];
    if (renderTime > 100) {
      alerts.push(`Slow render: ${renderTime.toFixed(1)}ms`);
    }
    if (taskCount > 1000 && !isVirtual) {
      alerts.push('Consider virtual scrolling for better performance');
    }
    if (memoryUsage && memoryUsage > 100) {
      alerts.push(`High memory usage: ${memoryUsage.toFixed(1)}MB`);
    }
    
    setPerformanceAlerts(alerts);
  }, [taskCount, isVirtual]);

  // Performance observer for paint metrics
  useEffect(() => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'paint') {
            console.log(`${entry.name}: ${entry.startTime.toFixed(2)}ms`);
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['paint', 'measure'] });
        return () => observer.disconnect();
      } catch (e) {
        console.warn('PerformanceObserver not supported for this entry type');
      }
    }
  }, []);

  // Don't show in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && !showDetailedMetrics) {
    return null;
  }

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-500';
    if (value <= thresholds.warning) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background/95 backdrop-blur border border-border rounded-lg shadow-lg"
      >
        {/* Compact view */}
        <div
          className="px-3 py-2 cursor-pointer flex items-center gap-2 text-sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          <Activity className="h-4 w-4 text-primary" />
          <span className={getPerformanceColor(metrics.renderTime, { good: 16, warning: 50 })}>
            {metrics.renderTime.toFixed(1)}ms
          </span>
          {isVirtual && (
            <span className="text-xs bg-primary/10 text-primary px-1 rounded">
              Virtual
            </span>
          )}
          {performanceAlerts.length > 0 && (
            <AlertTriangle className="h-3 w-3 text-yellow-500" />
          )}
        </div>

        {/* Detailed metrics */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border overflow-hidden"
            >
              <div className="p-3 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>Render:</span>
                    <span className={getPerformanceColor(metrics.renderTime, { good: 16, warning: 50 })}>
                      {metrics.renderTime.toFixed(1)}ms
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-muted-foreground" />
                    <span>FPS:</span>
                    <span className={getPerformanceColor(60 - metrics.fps, { good: 5, warning: 15 })}>
                      {metrics.fps}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-muted-foreground" />
                    <span>Tasks:</span>
                    <span>{metrics.taskCount}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span>Components:</span>
                    <span className={getPerformanceColor(metrics.componentCount, { good: 50, warning: 200 })}>
                      {metrics.componentCount}
                    </span>
                  </div>
                </div>

                {metrics.memoryUsage && (
                  <div className="flex items-center gap-1">
                    <span>Memory:</span>
                    <span className={getPerformanceColor(metrics.memoryUsage, { good: 50, warning: 100 })}>
                      {metrics.memoryUsage.toFixed(1)}MB
                    </span>
                  </div>
                )}

                {/* Performance tips */}
                <div className="pt-2 border-t border-border/50">
                  <div className="text-muted-foreground mb-1">Performance:</div>
                  {isVirtual ? (
                    <div className="text-green-600 dark:text-green-400">
                      ✓ Virtual scrolling enabled
                    </div>
                  ) : taskCount > 100 ? (
                    <div className="text-yellow-600 dark:text-yellow-400">
                      ⚠ Consider virtual scrolling
                    </div>
                  ) : (
                    <div className="text-green-600 dark:text-green-400">
                      ✓ Good performance
                    </div>
                  )}
                </div>

                {/* Performance alerts */}
                {performanceAlerts.length > 0 && (
                  <div className="pt-2 border-t border-border/50">
                    <div className="text-muted-foreground mb-1">Alerts:</div>
                    {performanceAlerts.map((alert, index) => (
                      <div key={index} className="text-yellow-600 dark:text-yellow-400 text-xs">
                        ⚠ {alert}
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-xs text-muted-foreground pt-1 border-t border-border/50">
                  Updated: {new Date(metrics.lastUpdate).toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// Hook for performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const renderStart = useRef<number>(0);
  const mountTime = useRef<number>(Date.now());

  useEffect(() => {
    renderStart.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStart.current;
    const mountDuration = Date.now() - mountTime.current;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName}:`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        mountDuration: `${mountDuration}ms`,
        timestamp: new Date().toISOString()
      });

      // Warn about slow renders
      if (renderTime > 50) {
        console.warn(`[Performance Warning] ${componentName} took ${renderTime.toFixed(2)}ms to render`);
      }
    }

    // Mark performance measure
    if ('performance' in window && 'mark' in performance) {
      performance.mark(`${componentName}-render-end`);
      performance.measure(
        `${componentName}-render`,
        `${componentName}-render-start`,
        `${componentName}-render-end`
      );
    }

    return () => {
      if ('performance' in window && 'mark' in performance) {
        performance.mark(`${componentName}-unmount`);
      }
    };
  }, [componentName]);

  // Mark render start
  useEffect(() => {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(`${componentName}-render-start`);
    }
  });

  return {
    measureOperation: (operationName: string, operation: () => void) => {
      const start = performance.now();
      operation();
      const duration = performance.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName}.${operationName}: ${duration.toFixed(2)}ms`);
      }
      
      return duration;
    }
  };
};

// Performance decorator for class components
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const name = componentName || Component.displayName || Component.name;
  
  const WrappedComponent = (props: P) => {
    usePerformanceMonitor(name);
    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withPerformanceMonitoring(${name})`;
  
  return WrappedComponent;
}