import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from './api';
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [tenant, setTenant] = useState(null);
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
                }
                catch (e) {
                    console.error('Failed to parse stored tenant:', e);
                }
            }
            if (token) {
                try {
                    const userData = await apiService.getCurrentUser();
                    setUser(userData);
                }
                catch (error) {
                    console.error('Failed to load user:', error);
                    apiService.clearAuth();
                    localStorage.removeItem('tenant');
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);
    const login = async (email, password) => {
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
                    document.documentElement.style.setProperty('--primary-color', response.tenant.branding.primaryColor);
                }
                if (response.tenant.branding?.secondaryColor) {
                    document.documentElement.style.setProperty('--secondary-color', response.tenant.branding.secondaryColor);
                }
            }
        }
        catch (error) {
            throw error;
        }
    };
    const logout = async () => {
        await apiService.logout();
        setUser(null);
        setTenant(null);
        localStorage.removeItem('tenant');
    };
    return (_jsx(AuthContext.Provider, { value: {
            user,
            tenant,
            isAuthenticated: !!user,
            login,
            logout,
            loading,
        }, children: children }));
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
