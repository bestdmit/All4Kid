import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, type AuthResponse, type LoginData, type RegisterData } from "../src/api/auth";

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuthToken: () => Promise<void>;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearError: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // Начальное состояние
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Действия
      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) => 
        set({ 
          accessToken, 
          refreshToken,
          isAuthenticated: !!accessToken 
        }),

      clearError: () => set({ error: null }),

      initializeAuth: () => {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const userStr = localStorage.getItem('user');
        
        if (accessToken && refreshToken && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({ 
              user, 
              accessToken, 
              refreshToken, 
              isAuthenticated: true 
            });
          } catch (error) {
            console.error('Error parsing user from localStorage:', error);
            // Очищаем невалидные данные
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
          }
        }
      },

      login: async (data: LoginData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.login(data);
          
          if (response.success) {
            const { user, accessToken, refreshToken } = response.data as AuthResponse;
            
            // Сохраняем в localStorage
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));
            
            // Обновляем состояние
            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            set({ 
              isLoading: false, 
              error: response.message || 'Ошибка при входе' 
            });
          }
        } catch (error: any) {
          console.error('Login error:', error);
          set({ 
            isLoading: false, 
            error: error.message || 'Ошибка соединения с сервером' 
          });
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.register(data);
          
          if (response.success) {
            const { user, accessToken, refreshToken } = response.data as AuthResponse;
            
            // Сохраняем в localStorage
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));
            
            // Обновляем состояние
            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            set({ 
              isLoading: false, 
              error: response.message || 'Ошибка при регистрации' 
            });
          }
        } catch (error: any) {
          console.error('Register error:', error);
          set({ 
            isLoading: false, 
            error: error.message || 'Ошибка соединения с сервером' 
          });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          const { refreshToken } = get();
          
          if (refreshToken) {
            await authApi.logout(refreshToken);
          }
          
          // Очищаем localStorage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          
          // Сбрасываем состояние
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('Logout error:', error);
          // Даже если API вызов не удался, очищаем локально
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      refreshAuthToken: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          console.error('No refresh token available');
          return;
        }
        
        try {
          const response = await authApi.refreshToken(refreshToken);
          
          if (response.success) {
            const newAccessToken = response.data.accessToken;
            
            // Обновляем в localStorage
            localStorage.setItem('accessToken', newAccessToken);
            
            // Обновляем состояние
            set({ 
              accessToken: newAccessToken,
              isAuthenticated: true 
            });
          } else {
            // Если refresh токен невалиден, выходим
            get().logout();
          }
        } catch (error) {
          console.error('Token refresh error:', error);
          get().logout();
        }
      },
    }),
    {
      name: 'auth-storage', // Имя ключа в localStorage
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);