/**
 * Страница аутентификации LakshmiApp
 * 
 * Предоставляет пользователю интерфейс для входа в систему через:
 * - Социальные провайдеры (Google, GitHub) через Replit OIDC
 * - Email/пароль форму (перенаправляет на Replit OIDC)
 * - Вкладки для входа и регистрации (обе ведут к Replit)
 * 
 * Компонент отображается когда пользователь не аутентифицирован
 * и автоматически скрывается после успешного входа.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartLine, Mail, Eye, EyeOff } from "lucide-react";
import { FaGoogle, FaGithub } from "react-icons/fa";

/**
 * Компонент страницы аутентификации
 * 
 * Отображает форму входа с логотипом Лакшми и различными вариантами аутентификации.
 * Все методы входа в итоге перенаправляют на Replit OIDC систему.
 */
export default function AuthPage() {
  /** Состояние видимости пароля в форме */
  const [showPassword, setShowPassword] = useState(false);
  
  /** Состояние загрузки для блокировки кнопок во время перенаправления */
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Обработчик входа через социальные сети
   * 
   * Перенаправляет пользователя на Replit OIDC с указанием провайдера.
   * Устанавливает состояние загрузки для предотвращения множественных кликов.
   * 
   * @param provider - Название провайдера (google, github)
   */
  const handleSocialLogin = (provider: string) => {
    setIsLoading(true);
    // Для Replit OIDC все провайдеры идут через /api/login
    window.location.href = `/api/login?provider=${provider}`;
  };

  /**
   * Обработчик входа через email/пароль
   * 
   * В текущей реализации перенаправляет на стандартную страницу Replit OIDC,
   * поскольку приложение использует исключительно Replit аутентификацию.
   * 
   * @param isSignUp - Флаг регистрации (в текущей версии не используется)
   */
  const handleEmailAuth = (isSignUp: boolean) => {
    setIsLoading(true);
    // Направляем на основную страницу входа Replit
    window.location.href = "/api/login";
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

            <TabsContent value="signin" className="space-y-4">
              <div className="space-y-4">
                {/* Social Login Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={() => handleSocialLogin("google")}
                    variant="outline"
                    className="w-full py-3 flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    <FaGoogle className="w-4 h-4 text-red-500" />
                    Войти через Google
                  </Button>

                  <Button
                    onClick={() => handleSocialLogin("github")}
                    variant="outline"
                    className="w-full py-3 flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    <FaGithub className="w-4 h-4" />
                    Войти через GitHub
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      или
                    </span>
                  </div>
                </div>

                {/* Email Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Пароль</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Введите пароль"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleEmailAuth(false)}
                    className="w-full bg-primary hover:bg-blue-700 text-white py-3"
                    disabled={isLoading}
                  >
                    {isLoading ? "Загрузка..." : "Войти"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-4">
                {/* Social Registration */}
                <div className="space-y-3">
                  <Button
                    onClick={() => handleSocialLogin("google")}
                    variant="outline"
                    className="w-full py-3 flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    <FaGoogle className="w-4 h-4 text-red-500" />
                    Зарегистрироваться через Google
                  </Button>

                  <Button
                    onClick={() => handleSocialLogin("github")}
                    variant="outline"
                    className="w-full py-3 flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    <FaGithub className="w-4 h-4" />
                    Зарегистрироваться через GitHub
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      или
                    </span>
                  </div>
                </div>

                {/* Registration Form */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Имя</Label>
                      <Input
                        id="firstName"
                        placeholder="Иван"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Фамилия</Label>
                      <Input
                        id="lastName"
                        placeholder="Иванов"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupEmail">Email</Label>
                    <Input
                      id="signupEmail"
                      type="email"
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupPassword">Пароль</Label>
                    <div className="relative">
                      <Input
                        id="signupPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Создайте пароль"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleEmailAuth(true)}
                    className="w-full bg-primary hover:bg-blue-700 text-white py-3"
                    disabled={isLoading}
                  >
                    {isLoading ? "Загрузка..." : "Создать аккаунт"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Безопасная аутентификация от Replit
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}