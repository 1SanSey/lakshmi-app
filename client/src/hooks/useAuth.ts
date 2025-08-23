/**
 * Хук для управления аутентификацией пользователя в LakshmiApp
 * 
 * Использует React Query для получения данных о текущем пользователе
 * из защищенного API endpoint. Автоматически определяет статус аутентификации
 * на основе наличия данных пользователя.
 * 
 * Особенности:
 * - Не повторяет запросы при ошибках (retry: false)
 * - Данные кэшируются React Query до перезагрузки страницы
 * - Автоматически обновляется при изменении сессии
 */

import { useQuery } from "@tanstack/react-query";

/**
 * Хук для работы с аутентификацией
 * 
 * @returns Объект с данными пользователя и статусами загрузки/аутентификации
 */
export function useAuth() {
  // Запрос данных пользователя через React Query
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],  // Уникальный ключ для кэширования
    retry: false,                  // Не повторяем при 401/404 ошибках
    queryFn: () => fetch('/api/auth/user', { credentials: 'include' }).then(res => {
      if (res.status === 401) return null;
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    }),
  });

  /**
   * Функция выхода из системы
   */
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST', 
        credentials: 'include' 
      });
      // После выхода перезагружаем страницу для отображения формы входа
      window.location.reload();
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      // В случае ошибки все равно перезагружаем
      window.location.reload();
    }
  };

  return {
    user,                          // Данные пользователя (или null если не аутентифицирован)
    isLoading,                     // Флаг загрузки запроса
    isAuthenticated: !!user,       // true если пользователь аутентифицирован
    logout,                        // Функция выхода из системы
  };
}
