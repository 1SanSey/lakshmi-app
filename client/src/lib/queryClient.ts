/**
 * Конфигурация React Query клиента для LakshmiApp
 * 
 * Этот модуль настраивает глобальный клиент React Query для:
 * - Кэширования данных от API
 * - Автоматических HTTP запросов
 * - Обработки ошибок аутентификации
 * - Стандартизации API взаимодействий
 * 
 * Все запросы автоматически включают credentials для работы с сессиями.
 */

import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Утилита для проверки успешности HTTP ответа
 * 
 * Выбрасывает ошибку если статус код указывает на ошибку.
 * Включает текст ошибки от сервера в сообщение исключения.
 * 
 * @param res - Response объект от fetch API
 * @throws Error если статус код >= 400
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Универсальная функция для API запросов с данными
 * 
 * Используется для POST, PUT, PATCH, DELETE запросов в мутациях React Query.
 * Автоматически сериализует данные в JSON и включает необходимые заголовки.
 * 
 * @param url - URL endpoint для запроса
 * @param method - HTTP метод (POST, PUT, PATCH, DELETE)
 * @param data - Данные для отправки в теле запроса (опционально)
 * @returns Promise с Response объектом
 * @throws Error если запрос завершился с ошибкой
 */
export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",  // Включаем cookies для аутентификации
  });

  await throwIfResNotOk(res);
  return res;
}

/** Тип поведения при получении 401 ответа от сервера */
type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Фабрика для создания query функций с настраиваемым поведением при 401 ошибках
 * 
 * Создает функцию, которая выполняет GET запросы для React Query.
 * Query key автоматически преобразуется в URL для запроса.
 * 
 * @param options - Настройки поведения при ошибках аутентификации
 * @returns Query функция для использования в useQuery
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Собираем URL из частей query key (например, ["/api", "users"] -> "/api/users")
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",  // Включаем cookies для аутентификации
    });

    // Специальная обработка 401 ошибок для аутентификации
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;  // Возвращаем null вместо выброса ошибки
    }

    await throwIfResNotOk(res);
    return await res.json();  // Парсим JSON ответ
  };

/**
 * Глобальный React Query клиент с оптимизированными настройками
 * 
 * Конфигурация оптимизирована для SPA приложения с сессионной аутентификацией:
 * - Данные не устаревают автоматически (staleTime: Infinity)
 * - Нет автоматического refetch при фокусе окна
 * - Нет повторных попыток при ошибках
 * - 401 ошибки выбрасывают исключения для перенаправления на страницу входа
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),  // 401 -> исключение для переадресации
      refetchInterval: false,                   // Нет автоматического обновления
      refetchOnWindowFocus: false,              // Нет обновления при фокусе окна
      staleTime: Infinity,                      // Данные никогда не устаревают
      retry: false,                             // Нет повторных попыток при ошибках
    },
    mutations: {
      retry: false,                             // Нет повторных попыток для мутаций
    },
  },
});
