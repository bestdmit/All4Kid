import { useEffect } from 'react';
import { useAuthStore } from "../stores/auth.store";

export const useAuth = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    login, 
    register, 
    logout,
    refreshAuthToken,
    clearError,
    initializeAuth,
    updateProfile,
  } = useAuthStore();

  // Инициализируем аутентификацию при монтировании
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Автоматически обновляем токен перед истечением
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const refreshInterval = setInterval(() => {
      refreshAuthToken();
    }, 15 * 60 * 1000); // Обновляем каждые 15 минут

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, user, refreshAuthToken]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  };
};