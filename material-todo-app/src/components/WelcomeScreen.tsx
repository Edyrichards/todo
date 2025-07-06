import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  CheckCircle2, 
  Calendar, 
  Star,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

interface WelcomeScreenProps {
  onCreateTask: () => void;
}

const features = [
  {
    icon: CheckCircle2,
    title: 'Task Management',
    description: 'Create, organize, and complete tasks with ease'
  },
  {
    icon: Calendar,
    title: 'Due Dates',
    description: 'Never miss a deadline with smart reminders'
  },
  {
    icon: Star,
    title: 'Priorities',
    description: 'Focus on what matters most with priority levels'
  }
];

export function WelcomeScreen({ onCreateTask }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full text-center space-y-8"
      >
        {/* Hero Section */}
        <div className="space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
          >
            <Sparkles size={16} />
            Material Design Todo App
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold tracking-tight"
          >
            Welcome to{' '}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Material Todo
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-lg text-muted-foreground max-w-lg mx-auto"
          >
            A beautiful, intuitive task management app built with Material Design principles. 
            Get organized and boost your productivity today.
          </motion.p>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="grid md:grid-cols-3 gap-4 my-12"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Card className="border-border/50 hover:border-primary/50 transition-colors duration-200">
                  <CardContent className="p-6 text-center space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon size={24} className="text-primary" />
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="space-y-4"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={onCreateTask}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 group"
            >
              <Plus size={20} className="mr-2" />
              Create Your First Task
              <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
          
          <p className="text-sm text-muted-foreground">
            Start organizing your life with beautiful, intuitive task management
          </p>
        </motion.div>

        {/* Quick Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-12 p-6 rounded-lg bg-muted/50 border border-border/50"
        >
          <h3 className="font-medium mb-3">Quick Tips</h3>
          <div className="text-sm text-muted-foreground space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              <span>Press <kbd className="px-1.5 py-0.5 text-xs bg-background border rounded">Ctrl+N</kbd> to quickly create a new task</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              <span>Use categories to organize your tasks by context</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              <span>Set priorities to focus on what matters most</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}