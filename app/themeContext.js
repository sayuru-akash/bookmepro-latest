import React, { createContext, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProviderComponent = ({ children }) => {
  return (
    <ThemeContext.Provider value={{}}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeMode = () => {
  return useContext(ThemeContext);
};