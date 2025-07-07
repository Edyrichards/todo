import { useState, useCallback, useRef } from 'react';
import { VoiceTaskService, VoiceTaskResult, VoiceRecognitionState } from '../services/voice-task-service';
import { useHapticFeedback } from '../lib/hapticFeedback';
import { toast } from 'sonner';

export interface UseVoiceTaskOptions {
  autoSpeak?: boolean;
  minConfidence?: number;
  onTaskCreated?: (task: VoiceTaskResult) => void;
  onError?: (error: string) => void;
}

export function useVoiceTask(options: UseVoiceTaskOptions = {}) {
  const {
    autoSpeak = true,
    minConfidence = 0.6,
    onTaskCreated,
    onError
  } = options;

  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    isProcessing: false,
    error: null,
    transcript: ''
  });

  const [lastResult, setLastResult] = useState<VoiceTaskResult | null>(null);
  
  const voiceService = useRef(new VoiceTaskService());
  const { triggerHaptic } = useHapticFeedback();

  const isSupported = voiceService.current.isVoiceSupported();

  const startListening = useCallback(async () => {
    if (!isSupported) {
      const error = 'Voice recognition not supported in this browser';
      setState(prev => ({ ...prev, error }));
      onError?.(error);
      return;
    }

    try {
      setState({
        isListening: true,
        isProcessing: false,
        error: null,
        transcript: ''
      });

      // Haptic feedback for start
      await triggerHaptic('medium');
      
      // Start listening
      const transcript = await voiceService.current.startListening();
      
      setState(prev => ({
        ...prev,
        isListening: false,
        isProcessing: true,
        transcript
      }));

      // Haptic feedback for processing
      await triggerHaptic('light');

      // Process the transcript
      const result = voiceService.current.parseNaturalLanguage(transcript);
      setLastResult(result);

      if (result.confidence >= minConfidence) {
        // Success haptic pattern
        await triggerHaptic('success');
        
        // Provide voice feedback
        if (autoSpeak) {
          const confirmationText = voiceService.current.generateConfirmationText(result.task);
          await voiceService.current.speak(confirmationText);
        }

        // Show success toast
        toast.success('Task created from voice!', {
          description: result.task.title
        });

        onTaskCreated?.(result);
      } else {
        // Low confidence - ask for clarification
        await triggerHaptic('error');
        
        const lowConfidenceMessage = `I heard "${transcript}" but I'm not sure what task to create. Please try again with more details.`;
        
        if (autoSpeak) {
          await voiceService.current.speak("I didn't quite understand that. Please try again.");
        }

        toast.warning('Voice unclear', {
          description: 'Please try speaking more clearly'
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Voice recognition failed';
      
      setState(prev => ({
        ...prev,
        isListening: false,
        isProcessing: false,
        error: errorMessage
      }));

      // Error haptic feedback
      await triggerHaptic('error');
      
      // Show error toast
      toast.error('Voice recognition failed', {
        description: errorMessage
      });

      onError?.(errorMessage);
    } finally {
      setState(prev => ({
        ...prev,
        isListening: false,
        isProcessing: false
      }));
    }
  }, [isSupported, minConfidence, autoSpeak, onTaskCreated, onError, triggerHaptic]);

  const stopListening = useCallback(() => {
    voiceService.current.stopListening();
    setState(prev => ({
      ...prev,
      isListening: false,
      isProcessing: false
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const getExampleCommands = useCallback(() => {
    return voiceService.current.getExampleCommands();
  }, []);

  const speakText = useCallback(async (text: string) => {
    if (autoSpeak) {
      await voiceService.current.speak(text);
    }
  }, [autoSpeak]);

  return {
    // State
    ...state,
    lastResult,
    isSupported,
    
    // Actions
    startListening,
    stopListening,
    clearError,
    getExampleCommands,
    speakText,
    
    // Computed
    isActive: state.isListening || state.isProcessing,
    canStart: isSupported && !state.isListening && !state.isProcessing
  };
}