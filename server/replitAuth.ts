/**
 * Система аутентификации через Replit OIDC для LakshmiApp
 * 
 * Этот модуль обеспечивает полную интеграцию с системой аутентификации Replit:
 * - Настройка OpenID Connect (OIDC) клиента для Replit
 * - Управление сессиями пользователей в PostgreSQL
 * - Автоматическое создание/обновление профилей пользователей
 * - Защита API маршрутов middleware аутентификации
 * - Обработка входа, выхода и обновления токенов
 */

import * as client from "openid-client";                    // OpenID Connect клиент
import { Strategy, type VerifyFunction } from "openid-client/passport"; // Passport стратегия для OIDC

import passport from "passport";                            // Библиотека аутентификации
import session from "express-session";                     // Управление сессиями
import type { Express, RequestHandler } from "express";    // Типы Express
import memoize from "memoizee";                            // Мемоизация для кэширования
import connectPg from "connect-pg-simple";                 // PostgreSQL хранилище сессий
import { storage } from "./storage";                       // Основное хранилище данных

// Проверяем наличие обязательных переменных окружения
if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

/**
 * Получение конфигурации OIDC от Replit с кэшированием
 * 
 * Функция мемоизирована для избежания повторных запросов к серверу обнаружения.
 * Кэш действует 1 час, после чего конфигурация обновляется автоматически.
 */
const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 } // Кэшируем на 1 час
);

/**
 * Настройка middleware для управления сессиями
 * 
 * Сессии хранятся в PostgreSQL для персистентности между перезапусками сервера.
 * Используются безопасные настройки cookies с httpOnly и secure флагами.
 * 
 * @returns Middleware для Express для управления сессиями
 */
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // Время жизни сессии: 1 неделя
  
  // Инициализация PostgreSQL хранилища для сессий
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,        // Строка подключения к БД
    createTableIfMissing: false,                // Не создаем таблицу автоматически
    ttl: sessionTtl,                           // Время жизни сессии в БД
    tableName: "sessions",                     // Название таблицы для сессий
  });
  
  return session({
    secret: process.env.SESSION_SECRET!,       // Секретный ключ для подписи сессий
    store: sessionStore,                       // PostgreSQL хранилище
    resave: false,                            // Не сохранять неизменные сессии
    saveUninitialized: false,                 // Не сохранять пустые сессии
    cookie: {
      httpOnly: true,                         // Защита от XSS атак
      secure: true,                           // Только через HTTPS
      maxAge: sessionTtl,                     // Время жизни cookie
    },
  });
}

/**
 * Обновление данных пользователя в сессии
 * 
 * Сохраняет токены доступа и claims из OIDC провайдера в объект пользователя.
 * Вызывается при успешной аутентификации и обновлении токенов.
 * 
 * @param user - Объект пользователя в сессии
 * @param tokens - Токены от OIDC провайдера с методами для получения claims
 */
function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();           // Данные пользователя из JWT токена
  user.access_token = tokens.access_token; // Токен доступа к API
  user.refresh_token = tokens.refresh_token; // Токен для обновления
  user.expires_at = user.claims?.exp;      // Время истечения токена
}

/**
 * Создание или обновление пользователя в системе
 * 
 * Автоматически вызывается при каждой успешной аутентификации.
 * Синхронизирует данные профиля из Replit с локальной базой данных.
 * 
 * @param claims - Claims из JWT токена Replit OIDC
 */
async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],                      // Уникальный ID пользователя из Replit
    email: claims["email"],                 // Email адрес
    firstName: claims["first_name"],        // Имя
    lastName: claims["last_name"],          // Фамилия
    profileImageUrl: claims["profile_image_url"], // URL аватара
  });
}

/**
 * Настройка системы аутентификации в Express приложении
 * 
 * Инициализирует все middleware и маршруты для аутентификации:
 * - Настройка proxy для правильной работы с HTTPS
 * - Подключение PostgreSQL сессий
 * - Инициализация Passport.js с OIDC стратегией
 * - Создание маршрутов входа/выхода
 * 
 * @param app - Express приложение
 */
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);        // Доверяем proxy серверам (для Replit)
  app.use(getSession());             // Подключаем управление сессиями
  app.use(passport.initialize());    // Инициализируем Passport
  app.use(passport.session());       // Поддержка сессий в Passport

  const config = await getOidcConfig(); // Получаем конфигурацию OIDC

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
