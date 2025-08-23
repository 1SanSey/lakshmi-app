/**
 * Главный компонент приложения LakshmiApp
 * 
 * Отвечает за:
 * - Инициализацию React Query для кэширования данных
 * - Маршрутизацию между страницами приложения
 * - Проверку аутентификации пользователя
 * - Отображение layout с header, sidebar и мобильной навигацией
 * - Управление провайдерами контекста (уведомления, подсказки)
 */

import { Switch, Route } from "wouter";             // Легковесная библиотека роутинга
import { queryClient } from "./lib/queryClient";     // Клиент для управления состоянием сервера
import { QueryClientProvider } from "@tanstack/react-query"; // Провайдер React Query
import { Toaster } from "@/components/ui/toaster";   // Компонент для показа уведомлений
import { TooltipProvider } from "@/components/ui/tooltip"; // Провайдер всплывающих подсказок
import { useAuth } from "@/hooks/useAuth";           // Хук для работы с аутентификацией

// Импорт всех страниц приложения
import AuthPage from "@/pages/auth";                 // Страница входа и регистрации
import Home from "@/pages/home";                     // Главная страница (dashboard)
import Sponsors from "@/pages/sponsors";             // Управление спонсорами
import Receipts from "@/pages/receipts";             // Управление поступлениями
import Costs from "@/pages/costs";                   // Управление расходами
import Funds from "@/pages/funds";                   // Управление фондами
import FundTransfers from "@/pages/fund-transfers";  // Переводы между фондами
import FundDistributions from "@/pages/fund-distributions"; // Распределение по фондам
import IncomeSources from "@/pages/income-sources";  // Источники доходов
import Nomenclature from "@/pages/nomenclature";     // Номенклатура расходов
import ExpenseCategories from "@/pages/expense-categories"; // Категории расходов
import Reports from "@/pages/reports";               // Отчеты и аналитика
import NotFound from "@/pages/not-found";            // Страница 404

// Импорт компонентов layout
import Header from "@/components/layout/header";     // Верхняя панель с логотипом и пользователем
import Sidebar from "@/components/layout/sidebar";   // Боковая навигация для десктопа
import MobileNav from "@/components/layout/mobile-nav"; // Мобильная навигация

/**
 * Компонент роутера - управляет навигацией и аутентификацией
 * 
 * Проверяет статус аутентификации и либо показывает страницу входа,
 * либо основной интерфейс приложения с защищенными маршрутами.
 */
function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Показываем индикатор загрузки пока проверяется аутентификация
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  // Если пользователь не аутентифицирован, показываем страницу входа
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Основной layout приложения для аутентифицированных пользователей
  return (
    <div className="min-h-screen bg-background">
      {/* Верхняя панель с логотипом, названием и информацией о пользователе */}
      <Header />
      
      <div className="flex max-w-7xl mx-auto">
        {/* Боковая навигация для десктопов (скрыта на мобильных) */}
        <Sidebar />
        
        {/* Основная область контента с отступом для sidebar на больших экранах */}
        <main className="flex-1 lg:pl-64 pb-20 lg:pb-0">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {/* Маршрутизация между страницами приложения */}
            <Switch>
              <Route path="/" component={Home} />                           {/* Главная - dashboard */}
              <Route path="/sponsors" component={Sponsors} />               {/* Управление спонсорами */}
              <Route path="/receipts" component={Receipts} />               {/* Поступления */}
              <Route path="/costs" component={Costs} />                     {/* Расходы */}
              <Route path="/funds" component={Funds} />                     {/* Фонды */}
              <Route path="/fund-transfers" component={FundTransfers} />    {/* Переводы между фондами */}
              <Route path="/fund-distributions" component={FundDistributions} /> {/* Распределение */}
              <Route path="/income-sources" component={IncomeSources} />    {/* Источники доходов */}
              <Route path="/nomenclature" component={Nomenclature} />       {/* Номенклатура */}
              <Route path="/expense-categories" component={ExpenseCategories} /> {/* Категории расходов */}
              <Route path="/reports" component={Reports} />                 {/* Отчеты */}
              <Route component={NotFound} />                                {/* 404 для неизвестных маршрутов */}
            </Switch>
          </div>
        </main>
      </div>
      
      {/* Мобильная навигация внизу экрана (видна только на мобильных) */}
      <MobileNav />
    </div>
  );
}

/**
 * Корневой компонент приложения
 * 
 * Инициализирует все провайдеры контекста:
 * - QueryClientProvider для React Query (кэширование и синхронизация данных с сервером)
 * - TooltipProvider для всплывающих подсказок компонентов
 * - Toaster для показа уведомлений пользователю
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
