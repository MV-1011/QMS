import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface TenantInfo {
  name: string;
  subdomain: string;
  branding: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

interface AuthContextType {
  user: User | null;
  tenant: TenantInfo | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load auth from storage on mount
    const initAuth = async () => {
      apiService.loadAuthFromStorage();
      const token = localStorage.getItem('token');
      const storedTenant = localStorage.getItem('tenant');

      if (storedTenant) {
        try {
          setTenant(JSON.parse(storedTenant));
        } catch (e) {
          console.error('Failed to parse stored tenant:', e);
        }
      }

      if (token) {
        try {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Failed to load user:', error);
          apiService.clearAuth();
          localStorage.removeItem('tenant');
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      apiService.setAuth(response.token, response.tenantId);
      setUser(response.user);

      // Store tenant info
      if (response.tenant) {
        setTenant(response.tenant);
        localStorage.setItem('tenant', JSON.stringify(response.tenant));

        // Apply branding colors
        if (response.tenant.branding?.primaryColor) {
          document.documentElement.style.setProperty(
            '--primary-color',
            response.tenant.branding.primaryColor
          );
        }
        if (response.tenant.branding?.secondaryColor) {
          document.documentElement.style.setProperty(
            '--secondary-color',
            response.tenant.branding.secondaryColor
          );
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await apiService.logout();
    setUser(null);
    setTenant(null);
    localStorage.removeItem('tenant');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        isAuthenticated: !!user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
