import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { useVoiceTask } from '../../hooks/useVoiceTask';
import { VoiceTaskResult } from '../../services/voice-task-service';

interface VoiceRecordingButtonProps {
  onTaskCreated?: (result: VoiceTaskResult) => void;
  className?: string;
  variant?: 'default' | 'floating' | 'mini';
  showExamples?: boolean;
}

export function VoiceRecordingButton({
  onTaskCreated,
  className = '',
  variant = 'default',
  showExamples = false
}: VoiceRecordingButtonProps) {
  const [showExampleDialog, setShowExampleDialog] = useState(false);
  
  const {
    isListening,
    isProcessing,
    isSupported,
    error,
    transcript,
    lastResult,
    isActive,
    canStart,
    startListening,
    stopListening,
    clearError,
    getExampleCommands
  } = useVoiceTask({
    onTaskCreated,
    minConfidence: 0.6,
    autoSpeak: true
  });

  if (!isSupported) {
    return (
      <div className="text-center p-4">
        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Voice recognition not supported in this browser
        </p>
      </div>
    );
  }

  const handleMainAction = () => {
    if (isListening) {
      stopListening();
    } else if (canStart) {
      startListening();
    }
  };

  const getButtonContent = () => {
    if (isProcessing) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Processing...</span>
        </>
      );
    }
    
    if (isListening) {
      return (
        <>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <Mic className="w-4 h-4 text-red-500" />
          </motion.div>
          <span>Listening...</span>
        </>
      );
    }
    
    return (
      <>
        <MicOff className="w-4 h-4" />
        <span>Voice Task</span>
      </>
    );
  };

  const getButtonSize = () => {
    switch (variant) {
      case 'floating':
        return 'w-16 h-16 rounded-full';
      case 'mini':
        return 'w-10 h-10 rounded-full p-0';
      default:
        return 'px-4 py-2';
    }
  };

  const getMiniButtonContent = () => {
    if (isProcessing) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (isListening) {
      return (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <Mic className="w-4 h-4 text-red-500" />
        </motion.div>
      );
    }
    return <MicOff className="w-4 h-4" />;
  };

  const renderButton = () => (
    <Button
      onClick={handleMainAction}
      disabled={!canStart && !isListening}
      className={`${getButtonSize()} ${className} transition-all duration-200 ${
        isListening ? 'bg-red-500 hover:bg-red-600' : ''
      } ${isActive ? 'scale-105' : ''}`}
      variant={isListening ? 'destructive' : 'default'}
    >
      {variant === 'mini' ? getMiniButtonContent() : getButtonContent()}
    </Button>
  );

  return (
    <div className="relative">
      {/* Main voice button */}
      {renderButton()}

      {/* Voice recording feedback card */}
      <AnimatePresence>
        {isActive && variant !== 'mini' && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 z-50"
          >
            <Card className="w-80 shadow-lg border">
              <CardContent className="p-4">
                <div className="text-center space-y-3">
                  {/* Recording indicator */}
                  {isListening && (
                    <>
                      <motion.div
                        className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <Mic className="w-8 h-8 text-red-500" />
                      </motion.div>
                      <p className="text-sm font-medium">Listening for your task...</p>
                      <p className="text-xs text-muted-foreground">
                        Speak naturally: "Remind me to call mom tomorrow at 3pm"
                      </p>
                    </>
                  )}

                  {/* Processing indicator */}
                  {isProcessing && (
                    <>
                      <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                      </div>
                      <p className="text-sm font-medium">Creating your task...</p>
                      {transcript && (
                        <div className="bg-muted p-2 rounded text-xs">
                          "{transcript}"
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success/Error feedback */}
      <AnimatePresence>
        {lastResult && !isActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 z-50"
          >
            <Card className="w-80 shadow-lg border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">
                      Task Created!
                    </p>
                    <p className="text-xs text-green-600">
                      {lastResult.task.title}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {Math.round(lastResult.confidence * 100)}% confidence
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error feedback */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 z-50"
          >
            <Card className="w-80 shadow-lg border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">
                      Voice Recognition Error
                    </p>
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={clearError}
                    className="text-xs"
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Examples button */}
      {showExamples && variant !== 'mini' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowExampleDialog(true)}
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs"
        >
          <Volume2 className="w-3 h-3 mr-1" />
          Examples
        </Button>
      )}

      {/* Examples dialog */}
      <AnimatePresence>
        {showExampleDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowExampleDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="w-full max-w-md">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Voice Command Examples</h3>
                  <div className="space-y-3">
                    {getExampleCommands().map((command, index) => (
                      <div
                        key={index}
                        className="p-3 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors cursor-pointer"
                        onClick={() => {
                          // Could implement click-to-use functionality
                          setShowExampleDialog(false);
                        }}
                      >
                        <Volume2 className="w-3 h-3 inline mr-2 text-muted-foreground" />
                        "{command}"
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full mt-4"
                    onClick={() => setShowExampleDialog(false)}
                  >
                    Got it!
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}