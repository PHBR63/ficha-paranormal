import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ColorTheme = 'purple' | 'red' | 'green' | 'blue' | 'amber';

interface ColorThemeContextType {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  isLoading: boolean;
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'color-theme';
const VALID_THEMES: ColorTheme[] = ['purple', 'red', 'green', 'blue', 'amber'];

function isValidTheme(theme: string | null): theme is ColorTheme {
  return theme !== null && VALID_THEMES.includes(theme as ColorTheme);
}

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isValidTheme(stored)) {
        return stored;
      }
    }
    return 'purple';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetchedFromDb, setHasFetchedFromDb] = useState(false);

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-color-theme', colorTheme);
    localStorage.setItem(STORAGE_KEY, colorTheme);
  }, [colorTheme]);

  // Fetch theme from database when user logs in
  useEffect(() => {
    async function fetchThemeFromDb() {
      if (!user || hasFetchedFromDb) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('theme_preference')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data?.theme_preference && isValidTheme(data.theme_preference)) {
          setColorThemeState(data.theme_preference);
        }
        setHasFetchedFromDb(true);
      } catch (err) {
        console.error('Error fetching theme preference:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchThemeFromDb();
  }, [user, hasFetchedFromDb]);

  // Reset fetch flag when user logs out
  useEffect(() => {
    if (!user) {
      setHasFetchedFromDb(false);
    }
  }, [user]);

  const setColorTheme = useCallback((theme: ColorTheme) => {
    // Update state immediately for instant visual feedback
    setColorThemeState(theme);
    
    // Save to database in background if user is logged in
    if (user) {
      (async () => {
        try {
          await supabase
            .from('profiles')
            .update({ theme_preference: theme })
            .eq('user_id', user.id);
        } catch (err) {
          console.error('Error saving theme preference:', err);
        }
      })();
    }
  }, [user]);

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme, isLoading }}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const context = useContext(ColorThemeContext);
  if (context === undefined) {
    throw new Error('useColorTheme must be used within a ColorThemeProvider');
  }
  return context;
}
