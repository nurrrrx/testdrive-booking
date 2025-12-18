import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  hasRole: (...roles: UserRole[]) => boolean;
  isStaff: () => boolean;
  isCustomer: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (user, accessToken) => {
        localStorage.setItem('accessToken', accessToken);
        set({ user, accessToken, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      hasRole: (...roles) => {
        const { user } = get();
        return user ? roles.includes(user.role) : false;
      },

      isStaff: () => {
        const { user } = get();
        return user ? ['ADMIN', 'SHOWROOM_MANAGER', 'SALES_EXECUTIVE', 'CALL_CENTER_AGENT'].includes(user.role) : false;
      },

      isCustomer: () => {
        const { user } = get();
        return user?.role === 'CUSTOMER';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Once rehydration is complete, set loading to false
        state?.setLoading(false);
      },
    }
  )
);