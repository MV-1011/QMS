import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback } from 'react';
const NavigationContext = createContext(undefined);
export const NavigationProvider = ({ children }) => {
    const [activeModule, setActiveModule] = useState('dashboard');
    const [navigationParams, setNavigationParams] = useState({});
    const navigateTo = useCallback((module, params) => {
        setActiveModule(module);
        setNavigationParams(params || {});
    }, []);
    const clearParams = useCallback(() => {
        setNavigationParams({});
    }, []);
    return (_jsx(NavigationContext.Provider, { value: {
            activeModule,
            navigationParams,
            navigateTo,
            clearParams,
        }, children: children }));
};
export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};
