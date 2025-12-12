import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

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

// Parse the module from URL hash (e.g., "#/dashboard/reports" -> "reports")
const getModuleFromHash = (): string => {
  const hash = window.location.hash;
  // Hash format: #/dashboard or #/dashboard/module
  const parts = hash.replace('#/', '').split('/');
  // If we have a second part (e.g., "reports"), use it; otherwise default to "dashboard"
  if (parts.length > 1 && parts[1]) {
    return parts[1];
  }
  return 'dashboard';
};

// Update the URL hash when navigating
const updateHash = (module: string) => {
  const newHash = module === 'dashboard' ? '#/dashboard' : `#/dashboard/${module}`;
  if (window.location.hash !== newHash) {
    window.location.hash = newHash;
  }
};

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from URL hash
  const [activeModule, setActiveModule] = useState(() => getModuleFromHash());
  const [navigationParams, setNavigationParams] = useState<NavigationParams>({});

  // Listen for hash changes (browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const module = getModuleFromHash();
      setActiveModule(module);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = useCallback((module: string, params?: NavigationParams) => {
    setActiveModule(module);
    setNavigationParams(params || {});
    updateHash(module);
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
