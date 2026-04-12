import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const THEMES = ['dark', 'blue', 'pink'];

const THEME_META = {
  dark: { icon: '🌙', label: '深夜紫' },
  blue: { icon: '🫧', label: '晴空蓝' },
  pink: { icon: '🌸', label: '樱花粉' },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('study_theme');
    return THEMES.includes(savedTheme) ? savedTheme : 'pink';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('study_theme', theme);
  }, [theme]);

  const cycleTheme = () => {
    setTheme((currentTheme) => {
      const currentIndex = THEMES.indexOf(currentTheme);
      return THEMES[(currentIndex + 1) % THEMES.length];
    });
  };

  const value = useMemo(() => ({
    theme,
    setTheme,
    cycleTheme,
    themes: THEMES,
    themeMeta: THEME_META,
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
