import { useEffect, useState } from 'react';
import { useTodoStore } from '../store/todoStore';

export function useTheme() {
  const { settings, updateSettings } = useTodoStore();
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const updateResolvedTheme = () => {
      if (settings.theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(isDark ? 'dark' : 'light');
      } else {
        setResolvedTheme(settings.theme as 'light' | 'dark');
      }
    };

    updateResolvedTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateResolvedTheme);

    return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
  }, [settings.theme]);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedTheme]);

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme });
  };

  const toggleTheme = () => {
    if (settings.theme === 'system') {
      setTheme('light');
    } else if (settings.theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('system');
    }
  };

  return {
    theme: settings.theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
}