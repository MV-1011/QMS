import React, { createContext, useContext, useState, useCallback } from 'react';

export interface NavigationParams {
  assignmentId?: string;
  trainingId?: string;
  certificateId?: string;
  documentId?: string;
  [key: string]: string | undefined;
}

interface NavigationContextType {
  activeModule: string;
  navigationParams: NavigationParams;
  navigateTo: (module: string, params?: NavigationParams) => void;
  clearParams: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [navigationParams, setNavigationParams] = useState<NavigationParams>({});

  const navigateTo = useCallback((module: string, params?: NavigationParams) => {
    setActiveModule(module);
    setNavigationParams(params || {});
  }, []);

  const clearParams = useCallback(() => {
    setNavigationParams({});
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        activeModule,
        navigationParams,
        navigateTo,
        clearParams,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
