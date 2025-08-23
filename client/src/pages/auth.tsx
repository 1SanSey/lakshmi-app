/**
 * Упрощенная страница аутентификации LakshmiApp
 * 
 * Содержит только формы логин/пароль без OAuth провайдеров.
 * Поддерживает вход и регистрацию новых пользователей.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff } from "lucide-react";

/**
 * Компонент простой страницы аутентификации
 * 
 * Отображает форму входа/регистрации с логотипом Лакшми.
 * Отправляет данные на новые API endpoints простой аутентификации.
 */
export default function AuthPage() {
  /** Состояние видимости пароля в форме */
  const [showPassword, setShowPassword] = useState(false);
  
  /** Состояние загрузки для блокировки кнопок во время запроса */
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Обработчик отправки формы входа/регистрации
   * 
   * Отправляет данные формы на соответствующий API endpoint
   * в зависимости от выбранной вкладки (вход или регистрация).
   * 
   * @param formData - Данные формы с полями логин/пароль
   * @param isSignUp - Флаг определяющий регистрацию (true) или вход (false)
   */
  const handleFormSubmit = async (formData: FormData, isSignUp: boolean) => {
    setIsLoading(true);
    
    try {
      const username = formData.get('username') as string;
      const password = formData.get('password') as string;
      const firstName = formData.get('firstName') as string;
      const lastName = formData.get('lastName') as string;

      const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
      const body = isSignUp 
        ? { username, password, firstName, lastName }
        : { username, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        // Перезагружаем страницу для обновления состояния аутентификации
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Ошибка при входе в систему');
      }
    } catch (error) {
      alert('Ошибка подключения к серверу');
      console.error('Ошибка аутентификации:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-blue-600 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <img 
              src="/lakshmi-logo.png" 
              alt="Lakshmi" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            LakshmiApp
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Войдите или зарегистрируйтесь для управления финансами
          </p>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Вход</TabsTrigger>
              <TabsTrigger value="signup">Регистрация</TabsTrigger>
            </TabsList>

            {/* Форма входа */}
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                handleFormSubmit(formData, false);
              }} className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="signin-username">Логин</Label>
                    <Input
                      id="signin-username"
                      name="username"
                      type="text"
                      placeholder="Введите логин"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Пароль</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Введите пароль"
                        className="pr-10"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-3 bg-primary hover:bg-blue-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Вход..." : "Войти"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Форма регистрации */}
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                handleFormSubmit(formData, true);
              }} className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-firstName">Имя</Label>
                      <Input
                        id="signup-firstName"
                        name="firstName"
                        type="text"
                        placeholder="Иван"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-lastName">Фамилия</Label>
                      <Input
                        id="signup-lastName"
                        name="lastName"
                        type="text"
                        placeholder="Иванов"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Логин</Label>
                    <Input
                      id="signup-username"
                      name="username"
                      type="text"
                      placeholder="Введите логин"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Пароль</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Минимум 6 символов"
                        className="pr-10"
                        required
                        minLength={6}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-3 bg-primary hover:bg-blue-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Регистрация..." : "Зарегистрироваться"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}