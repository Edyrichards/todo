import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { animated } from 'react-spring';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isMobileDevice, triggerHaptic, useTouchFeedback } from '../lib/gestureUtils';

interface MobileFormFieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

function MobileFormField({ label, children, required, className }: MobileFormFieldProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('space-y-2', className)}
    >
      <Label className={cn('text-base font-medium', required && 'after:content-["*"] after:text-red-500 after:ml-1')}>
        {label}
      </Label>
      {children}
    </motion.div>
  );
}

interface MobileSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string; color?: string }[];
  placeholder?: string;
  className?: string;
}

function MobileSelect({ value, onValueChange, options, placeholder, className }: MobileSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { bind, style } = useTouchFeedback();

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
    triggerHaptic('light');
  };

  return (
    <div className="relative">
      <animated.button
        {...bind()}
        style={style}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full min-h-[44px] px-3 py-2 border border-input bg-background rounded-md',
          'flex items-center justify-between text-left',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          className
        )}
      >
        <span className={cn(
          selectedOption ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} />
        </motion.div>
      </animated.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 z-50"
            />

            {/* Options */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
            >
              {options.map((option) => (
                <motion.button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'w-full min-h-[44px] px-3 py-2 text-left hover:bg-muted/50',
                    'flex items-center justify-between transition-colors',
                    value === option.value && 'bg-primary/10 text-primary'
                  )}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2">
                    {option.color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    <span>{option.label}</span>
                  </div>
                  {value === option.value && (
                    <Check size={16} className="text-primary" />
                  )}
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MobileTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
}

function MobileTextArea({ value, onChange, placeholder, className, maxLength }: MobileTextAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(88, textarea.scrollHeight)}px`;
    }
  }, [value]);

  const handleFocus = () => {
    setIsFocused(true);
    if (isMobileDevice()) {
      // Scroll into view on mobile to prevent keyboard overlap
      setTimeout(() => {
        textareaRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300);
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={cn(
          'min-h-[88px] resize-none transition-all duration-200',
          'focus:ring-2 focus:ring-ring focus:ring-offset-2',
          isFocused && isMobileDevice() && 'ring-2 ring-primary',
          className
        )}
        maxLength={maxLength}
      />
      
      {maxLength && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isFocused ? 1 : 0 }}
          className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-1"
        >
          {value.length}/{maxLength}
        </motion.div>
      )}
    </div>
  );
}

interface MobileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function MobileDialog({ isOpen, onClose, title, children, className }: MobileDialogProps) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!isMobileDevice()) return;

    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const heightDiff = windowHeight - viewportHeight;
      
      setKeyboardHeight(heightDiff > 150 ? heightDiff : 0);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    }
  }, []);

  if (!isMobileDevice()) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={className}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Mobile Dialog */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { 
                type: 'spring', 
                stiffness: 300, 
                damping: 30 
              }
            }}
            exit={{ 
              opacity: 0, 
              y: '100%',
              transition: { duration: 0.2 }
            }}
            style={{
              paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : '0px',
            }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50 bg-background',
              'rounded-t-2xl border-t border-border shadow-2xl',
              'max-h-[90vh] overflow-hidden',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">{title}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X size={16} />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Export the mobile-optimized components
export { MobileFormField, MobileSelect, MobileTextArea };