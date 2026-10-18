import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, Organization, MemberRole } from '../types';
import { api } from '../services/api';
import { FALLBACK_ORGANIZATIONS } from '../services/demoData';

interface AuthContextType {
  user: UserProfile | null;
  activeOrg: Organization | null;
  organizations: Organization[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName?: string, orgName?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setActiveOrg: (org: Organization) => void;
  refreshUser: () => Promise<void>;
}

const DEFAULT_DEMO_USER: UserProfile = {
  id: 'usr_demo_agency_lead',
  email: 'lead@metapilot-demo.internal',
  full_name: 'Alex Vance',
  tenant_id: 'org_apex_growth',
  role: 'owner',
  is_demo: true
};

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_DEMO_USER,
  activeOrg: FALLBACK_ORGANIZATIONS[0],
  organizations: FALLBACK_ORGANIZATIONS,
  isAuthenticated: true,
  isLoading: false,
  isDemoMode: true,
  setDemoMode: () => {},
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  setActiveOrg: () => {},
  refreshUser: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('metapilot_logged_out') === 'true') {
      return null;
    }
    const savedUser = typeof localStorage !== 'undefined' ? localStorage.getItem('metapilot_user_profile') : null;
    return savedUser ? JSON.parse(savedUser) : DEFAULT_DEMO_USER;
  });
  const [organizations, setOrganizations] = useState<Organization[]>(FALLBACK_ORGANIZATIONS);
  const [activeOrg, setActiveOrgState] = useState<Organization | null>(() => {
    const savedOrgId = typeof localStorage !== 'undefined' ? localStorage.getItem('metapilot_active_org_id') : null;
    return FALLBACK_ORGANIZATIONS.find(o => o.id === savedOrgId) || FALLBACK_ORGANIZATIONS[0];
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('metapilot_logged_out') === 'true') {
      return false;
    }
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('metapilot_token') : null;
    return Boolean(token) || true; // Default to authenticated in demo mode on initial load
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setDemoModeState] = useState<boolean>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('metapilot_mode') : null;
    return saved !== null ? saved === 'demo' : true;
  });

  const setActiveOrg = useCallback((org: Organization) => {
    setActiveOrgState(org);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('metapilot_active_org_id', org.id);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('metapilot_logged_out') === 'true') {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const res = await api.getMe();
      if (res && res.user) {
        setUser(res.user);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('metapilot_user_profile', JSON.stringify(res.user));
        }
        if (res.organizations && res.organizations.length > 0) {
          setOrganizations(res.organizations);
          const savedOrgId = typeof localStorage !== 'undefined' ? localStorage.getItem('metapilot_active_org_id') : null;
          const matched = res.organizations.find(o => o.id === savedOrgId) || res.organizations[0];
          setActiveOrg(matched);
        }
      }
    } catch (err) {
      console.warn("Failed to refresh user info from API, using cached/demo profile:", err);
    } finally {
      setIsLoading(false);
    }
  }, [setActiveOrg]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      setUser(res.user);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('metapilot_logged_out');
        localStorage.setItem('metapilot_user_profile', JSON.stringify(res.user));
      }
      setIsAuthenticated(true);
      setDemoModeState(Boolean(res.user.is_demo));
      await refreshUser();
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, fullName?: string, orgName?: string) => {
    setIsLoading(true);
    try {
      const res = await api.signup({
        email,
        password,
        full_name: fullName,
        organization_name: orgName
      });
      setUser(res.user);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('metapilot_logged_out');
        localStorage.setItem('metapilot_user_profile', JSON.stringify(res.user));
      }
      if (res.organization) {
        setOrganizations([res.organization]);
        setActiveOrg(res.organization);
      }
      setIsAuthenticated(true);
      setDemoModeState(false);
      await refreshUser();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('metapilot_token');
        localStorage.removeItem('metapilot_user_profile');
        localStorage.setItem('metapilot_logged_out', 'true');
      }
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const resetPassword = async (email: string) => {
    await api.resetPassword({ email });
  };

  const setDemoMode = (enabled: boolean) => {
    setDemoModeState(enabled);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('metapilot_mode', enabled ? 'demo' : 'connected');
    }
    if (enabled && !user) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('metapilot_logged_out');
      }
      setUser(DEFAULT_DEMO_USER);
      setIsAuthenticated(true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || (isAuthenticated ? DEFAULT_DEMO_USER : null),
        activeOrg: activeOrg || FALLBACK_ORGANIZATIONS[0],
        organizations,
        isAuthenticated,
        isLoading,
        isDemoMode,
        setDemoMode,
        login,
        signup,
        logout,
        resetPassword,
        setActiveOrg,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
