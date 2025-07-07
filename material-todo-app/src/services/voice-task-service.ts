import { Task } from '../../shared/types';
import { parseDate } from 'chrono-node';
import nlp from 'compromise';

export interface VoiceTaskResult {
  task: Partial<Task>;
  confidence: number;
  originalText: string;
}

export interface VoiceRecognitionState {
  isListening: boolean;
  isProcessing: boolean;
  error: string | null;
  transcript: string;
}

export class VoiceTaskService {
  private recognition: SpeechRecognition | null = null;
  private isSupported: boolean = false;

  constructor() {
    // Check for speech recognition support
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    if (this.isSupported) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition(): void {
    if (!this.recognition) return;

    // Configure recognition settings
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = 'en-US';
  }

  isVoiceSupported(): boolean {
    return this.isSupported;
  }

  async startListening(): Promise<string> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported');
    }

    return new Promise((resolve, reject) => {
      let finalTranscript = '';

      this.recognition!.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      this.recognition!.onend = () => {
        resolve(finalTranscript.trim());
      };

      this.recognition!.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition!.start();
    });
  }

  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  parseNaturalLanguage(text: string): VoiceTaskResult {
    const doc = nlp(text);
    const originalText = text;
    
    // Extract potential task components
    const result: Partial<Task> = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      completed: false,
      priority: 'medium',
      category: 'general',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Parse different command patterns
    const patterns = this.analyzeTextPatterns(text, doc);
    
    // Extract title (main task)
    result.title = this.extractTitle(text, patterns);
    
    // Extract due date
    const dateResult = this.extractDueDate(text);
    if (dateResult) {
      result.dueDate = dateResult;
    }
    
    // Extract priority
    result.priority = this.extractPriority(text);
    
    // Extract category
    result.category = this.extractCategory(text, doc);
    
    // Calculate confidence score
    const confidence = this.calculateConfidence(result, patterns);

    return {
      task: result,
      confidence,
      originalText
    };
  }

  private analyzeTextPatterns(text: string, doc: any) {
    const lowerText = text.toLowerCase();
    
    return {
      hasReminder: /remind|remember|don't forget/i.test(text),
      hasTime: doc.match('#Time').found,
      hasDate: doc.match('#Date').found,
      hasPriority: /urgent|important|high|low|asap|priority/i.test(text),
      hasAction: doc.match('#Verb').found,
      isQuestion: text.includes('?'),
      isCommand: /^(add|create|make|set)/i.test(text),
    };
  }

  private extractTitle(text: string, patterns: any): string {
    let title = text;
    
    // Remove common prefixes
    title = title.replace(/^(remind me to|remember to|don't forget to|add task|create task|new task)/i, '');
    title = title.replace(/^(to\s+)/i, '');
    
    // Remove time/date references from the end
    title = title.replace(/\s+(today|tomorrow|next week|this weekend|at \d|by \d|due \d).*$/i, '');
    
    // Remove priority indicators
    title = title.replace(/\s+(urgent|important|high priority|low priority|asap).*$/i, '');
    
    return title.trim() || 'New Task';
  }

  private extractDueDate(text: string): Date | undefined {
    try {
      // Use chrono-node for natural date parsing
      const parsed = parseDate(text);
      
      if (parsed) {
        // Ensure it's not in the past (unless explicitly stated)
        const now = new Date();
        if (parsed < now && !text.includes('yesterday')) {
          // If parsed date is in the past, assume it's for tomorrow/next occurrence
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(parsed.getHours(), parsed.getMinutes());
          return tomorrow;
        }
        return parsed;
      }
    } catch (error) {
      console.warn('Date parsing error:', error);
    }
    
    return undefined;
  }

  private extractPriority(text: string): 'low' | 'medium' | 'high' {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('urgent') || lowerText.includes('asap') || lowerText.includes('high priority')) {
      return 'high';
    }
    
    if (lowerText.includes('important') || lowerText.includes('priority')) {
      return 'high';
    }
    
    if (lowerText.includes('low priority') || lowerText.includes('whenever')) {
      return 'low';
    }
    
    return 'medium';
  }

  private extractCategory(text: string, doc: any): string {
    const lowerText = text.toLowerCase();
    
    // Work-related keywords
    if (/meeting|call|email|report|project|deadline|work|office|boss|client/i.test(text)) {
      return 'work';
    }
    
    // Personal keywords
    if (/buy|shop|grocery|store|pick up|purchase|get/i.test(text)) {
      return 'shopping';
    }
    
    // Health keywords
    if (/doctor|appointment|gym|exercise|medication|health/i.test(text)) {
      return 'health';
    }
    
    // Family/social keywords
    if (/family|mom|dad|friend|birthday|party|social/i.test(text)) {
      return 'personal';
    }
    
    // Home keywords
    if (/clean|fix|repair|home|house|chore/i.test(text)) {
      return 'home';
    }
    
    return 'general';
  }

  private calculateConfidence(task: Partial<Task>, patterns: any): number {
    let confidence = 0.5; // Base confidence
    
    // Boost confidence for clear patterns
    if (patterns.hasAction) confidence += 0.2;
    if (patterns.hasTime || patterns.hasDate) confidence += 0.2;
    if (task.title && task.title.length > 3) confidence += 0.1;
    if (patterns.hasReminder) confidence += 0.1;
    if (patterns.isCommand) confidence += 0.1;
    
    // Reduce confidence for unclear patterns
    if (patterns.isQuestion) confidence -= 0.2;
    if (!task.title || task.title.length < 3) confidence -= 0.3;
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  // Voice feedback methods
  async speak(text: string): Promise<void> {
    if ('speechSynthesis' in window) {
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        utterance.onend = () => resolve();
        
        speechSynthesis.speak(utterance);
      });
    }
  }

  generateConfirmationText(task: Partial<Task>): string {
    let text = `Creating task: ${task.title}`;
    
    if (task.dueDate) {
      const dateStr = task.dueDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
      text += ` due ${dateStr}`;
    }
    
    if (task.priority === 'high') {
      text += ' with high priority';
    }
    
    return text;
  }

  // Example voice commands for user guidance
  getExampleCommands(): string[] {
    return [
      "Remind me to call mom tomorrow at 3pm",
      "Buy groceries this weekend", 
      "High priority: finish project report by Friday",
      "Schedule dentist appointment next week",
      "Pick up dry cleaning after work",
      "Meeting with team tomorrow at 10am",
      "Pay rent by the first of next month",
      "Exercise at the gym tonight"
    ];
  }
}