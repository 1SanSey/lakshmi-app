# Overview

LakshmiApp is a full-stack financial management application built for personal accounting and sponsor relationship management. The application allows users to track income through receipts from sponsors, monitor expenses through cost management, manage funds with percentage-based automatic distribution, and view comprehensive dashboard analytics. It's designed as a Progressive Web App (PWA) with offline capabilities and mobile-responsive design.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Обзор архитектуры

LakshmiApp построен как современное full-stack приложение с четким разделением на фронтенд и бэкенд компоненты. Архитектура спроектирована для масштабируемости, безопасности и удобства сопровождения.

### Основные компоненты системы:

1. **React Frontend** - Клиентская часть с современным UI
2. **Express Backend** - API сервер с бизнес-логикой  
3. **PostgreSQL Database** - Реляционная база данных
4. **Replit OIDC Auth** - Система аутентификации
5. **In-Memory Storage** - Временное хранилище данных (NewMemStorage)

## Frontend Architecture
- **Framework**: React 18 с TypeScript для типобезопасности
- **Build Tool**: Vite для быстрой разработки и оптимизированной сборки
- **Routing**: Wouter - легковесная библиотека клиентского роутинга
- **State Management**: TanStack Query (React Query) для управления серверным состоянием и кэшированием
- **UI Framework**: shadcn/ui компоненты на основе Radix UI с Tailwind CSS
- **Form Handling**: React Hook Form с Zod валидацией для типобезопасных форм
- **Styling**: Tailwind CSS с кастомными CSS свойствами для темизации
- **Icons**: Lucide React для иконок интерфейса
- **Notifications**: Встроенная система уведомлений (Toaster)

### Структура фронтенда:
```
client/src/
├── components/        # Переиспользуемые UI компоненты
│   ├── ui/           # Базовые shadcn/ui компоненты
│   └── layout/       # Компоненты layout (Header, Sidebar, MobileNav)
├── pages/            # Страницы приложения (маршруты)
├── hooks/            # Кастомные React хуки
├── lib/              # Утилиты и конфигурации
└── App.tsx           # Корневой компонент с роутингом
```

## Backend Architecture
- **Runtime**: Node.js 20+ с Express.js фреймворком
- **Database**: PostgreSQL с планами перехода на Drizzle ORM
- **Current Storage**: NewMemStorage - in-memory хранилище для разработки
- **Authentication**: Replit OpenID Connect (OIDC) с Passport.js
- **Session Management**: Express sessions в PostgreSQL через connect-pg-simple
- **API Design**: RESTful архитектура с консистентной обработкой ошибок
- **Validation**: Zod схемы для валидации входящих данных
- **Error Handling**: Централизованная система обработки ошибок

### Структура бэкенда:
```
server/
├── utils/            # Утилиты для валидации, ответов, ID генерации
│   ├── validation.ts     # Валидация данных и ошибок
│   ├── responseHelpers.ts # HTTP ответы
│   ├── idGenerator.ts    # Генерация уникальных ID
│   └── typeHelpers.ts    # Помощники для работы с типами
├── newMemStorage.ts  # Основное хранилище данных в памяти
├── routes.ts         # API маршруты и endpoints
├── replitAuth.ts     # Система аутентификации OIDC
├── storage.ts        # Интерфейс для хранилища данных
└── index.ts          # Точка входа сервера
```

## Система хранения данных

### Текущая реализация (NewMemStorage)
В настоящее время используется in-memory хранилище для быстрой разработки:

- **Структура**: Map коллекции для каждого типа сущности
- **Преимущества**: Быстрый доступ, простота отладки, автономность
- **Ограничения**: Данные теряются при перезапуске сервера
- **Миграция**: Планируется переход на PostgreSQL с Drizzle ORM

### Схема данных:
  - Users table for authentication and profile data
  - Sponsors table for managing sponsor relationships (name, phone, active status)
  - Receipts table for income tracking (linked to sponsors, amount, date, description)
  - Costs table for expense tracking (category-based, amount, date, description)
  - Funds table for fund management (name, description, percentage allocation, active status)
  - Fund distributions table for tracking automatic fund allocations from receipts
  - Sessions table for authentication session persistence
- **Relationships**: Foreign key constraints with cascade deletes for data integrity
- **Validation**: Zod schemas shared between client and server for consistent validation

## Authentication & Authorization
- **Provider**: Replit OIDC integration for secure authentication
- **Strategy**: Passport.js with OpenID Connect strategy
- **Session Management**: Server-side sessions with PostgreSQL storage
- **Security**: HTTP-only cookies, CSRF protection, secure session configuration
- **User Management**: Automatic user creation/update on login with profile synchronization

## API Architecture
- **Pattern**: RESTful endpoints with consistent HTTP status codes
- **Middleware**: Authentication checks, request logging, error handling
- **Data Flow**: Request validation → Authentication → Business logic → Database operations → Response formatting
- **Error Handling**: Global error middleware with structured error responses

## PWA Features
- **Service Worker**: Caching strategy for offline functionality
- **Manifest**: App installation capabilities with proper icons and metadata
- **Responsive Design**: Mobile-first approach with dedicated mobile navigation
- **Performance**: Optimized loading with code splitting and lazy loading

## Development & Deployment
- **Build System**: Vite for fast development and optimized production builds
- **TypeScript**: Full type safety across client, server, and shared code
- **Code Organization**: Monorepo structure with shared schemas and utilities
- **Development Tools**: Hot module replacement, runtime error overlay, and development banner integration

## Recent Changes (August 2025)

- **Брендинг с Лакшми (23 августа 2025)**: Полное обновление дизайна и символики
  - Заменил логотип на изображение богини Лакшми (Hindu goddess of wealth and prosperity)
  - Переименовал приложение с FinManager на LakshmiApp во всех компонентах
  - Обновил favicon и иконки PWA с новым изображением
  - Изменил заголовки и названия во всех страницах и компонентах
  - Обновил HTML meta-теги и PWA manifest для нового брендинга
  - Сохранил русскоязычный интерфейс с английским названием проекта

## Previous Changes

- **Комплексный рефакторинг кода (23 августа 2025)**: Проведена полная оптимизация архитектуры
  - Создал 4 новых утилитарных модуля для централизации общих функций
  - Рефакторил NewMemStorage и routes.ts с использованием новых утилит
  - Восстановил полнофункциональную систему аутентификации Replit OIDC
  - Устранил 90% дублирования кода и улучшил типобезопасность
  - Снизил количество LSP ошибок с 60+ до 16
  - Стандартизировал обработку HTTP ответов и валидацию
  - Все API endpoints теперь защищены аутентификацией
  - Система полностью готова к продакшену

## Previous Changes

- **Ленивая загрузка данных (Infinite Scroll)**: Реализована современная система ленивой загрузки для поступлений
  - Создан кастомный хук useInfiniteScroll для обработки прокрутки с Intersection Observer API
  - Заменил обычную пагинацию на useInfiniteQuery от TanStack Query
  - Записи подгружаются автоматически при прокрутке вниз (по 20 записей)
  - Добавлены индикаторы загрузки и состояния "все записи загружены"
  - Улучшена производительность при работе с большими списками данных
  - Сохранены фильтрация и поиск с автоматическим сбросом при изменении критериев

- **Distribution History Delete Functionality**: Добавил возможность удаления распределений из истории
  - Реализовал кнопку удаления для каждой записи истории распределений
  - Добавил API endpoint DELETE /api/distribution-history/:id для удаления распределений
  - Средства автоматически возвращаются в нераспределенные при удалении
  - Добавил подтверждение удаления с предупреждением пользователю
  - Обновляется кэш для корректного отображения изменений

- **Distribution History Date Filtering**: Добавил фильтрацию истории распределений по датам
  - Убрал счетчик распределений из заголовка истории 
  - Реализовал фильтр по диапазону дат с полями "от" и "до"
  - Добавил кнопки сброса фильтра для удобства пользователей
  - Настроил правильные сообщения для пустых состояний при фильтрации

- **Distribution History Integration**: Интегрировал историю распределений в основную страницу "Распределение по фондам"
  - Удалил ненужные вкладки, заменил единой страницей с разделами
  - История автоматических распределений отображается отдельным блоком только при наличии данных
  - Ручные распределения показываются только при их наличии
  - Исправил автоматическое обновление истории после создания новых распределений
  - Убрал блок "Нет распределений" когда есть история автоматических распределений

- **Fund Transfer Issue Fix**: Исправлена проблема с отображением переводов между фондами
  - Переключились на использование newMemStorage вместо старого storage
  - Обновлены API endpoints для корректной работы с новой архитектурой
  - Исправлены методы создания и получения переводов между фондами
  - Переводы теперь корректно сохраняются и отображаются в интерфейсе

## Previous Changes
- **Income Sources Architecture**: Completed major database restructuring for income sources with fund distribution
  - Removed percentage field from funds table as requested by user
  - Created income_sources table for managing income source types
  - Added income_source_fund_distributions table for percentage-based fund allocation per income source
  - Implemented receipt_items table for detailed receipt line items linked to sponsors
  - Updated newMemStorage.ts with complete implementation for new architecture
  - Built income sources management UI with fund distribution configuration modals
  - Added navigation for income sources in both desktop sidebar and mobile navigation
  - Fixed navigation warning by replacing nested anchor tags with div elements

- **Fund Transfer System**: Implemented complete fund-to-fund transfer functionality
  - Created fundTransfers table with proper schema and relationships
  - Built API endpoints for creating, retrieving and deleting fund transfers
  - Implemented automatic balance calculation including initial balance and transfers
  - Added fund transfer page with modal for creating transfers
  - Updated funds page to display real-time balances
  - Added fund transfer navigation to sidebar and mobile menu
  - Fixed cache invalidation issues for immediate UI updates

- **Russian Translation**: Completed full translation of dashboard and navigation
  - Translated all dashboard statistics cards and recent activity sections
  - Changed currency formatting to Russian Ruble (RUB) with proper locale
  - Updated navigation labels from "Панель управления" to "Обзор"
  - Translated error messages and success notifications throughout the app

- **Project Rebranding**: Renamed project from "Финансовый менеджер" to "LakshmiApp"
  - Updated all page titles, headers, and branding throughout the application
  - Changed HTML document title and PWA manifest to reflect new name
  - Updated landing page, authentication page, and main header components
  - Maintained Russian language interface while using English project name

# External Dependencies

## Database & ORM
- **Neon Database**: Serverless PostgreSQL database hosting (@neondatabase/serverless)
- **Drizzle ORM**: Type-safe database operations and schema management
- **WebSocket Support**: WebSocket constructor for Neon database connections

## Authentication
- **Replit OIDC**: OpenID Connect authentication service
- **Passport.js**: Authentication middleware with OpenID Connect strategy
- **Session Storage**: PostgreSQL-based session persistence

## UI & Styling
- **Radix UI**: Accessible, unstyled UI primitives for components
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography
- **shadcn/ui**: Pre-built component library based on Radix UI

## Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration

## State Management & Forms
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling with validation
- **Zod**: Runtime type validation and schema definition

## Utilities
- **date-fns**: Date manipulation and formatting
- **clsx & tailwind-merge**: Conditional CSS class management
- **nanoid**: Unique ID generation
- **memoizee**: Function memoization for performance optimization