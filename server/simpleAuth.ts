/**
 * Простая система аутентификации для LakshmiApp
 * 
 * Реализует базовую аутентификацию с регистрацией/входом через логин и пароль:
 * - Хеширование паролей с использованием bcrypt
 * - Сессии для поддержания состояния входа
 * - Защищенные маршруты с middleware проверки
 * - API endpoints для регистрации, входа и выхода
 * 
 * Заменяет сложную систему OAuth на простое решение для 1-2 пользователей.
 */

import bcrypt from "bcryptjs";
import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { generateUserId } from "./utils/idGenerator";
import { handleValidationError, handleError, validateUserId } from "./utils/validation";
import { ok, created, unauthorized, badRequest, noContent } from "./utils/responseHelpers";
import { z } from "zod";

/**
 * Схема валидации для регистрации пользователя
 */
const registerSchema = z.object({
  username: z.string().min(3, "Логин должен содержать минимум 3 символа"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

/**
 * Схема валидации для входа пользователя
 */
const loginSchema = z.object({
  username: z.string().min(1, "Логин обязателен"),
  password: z.string().min(1, "Пароль обязателен"),
});

/**
 * Расширяем типы Express для поддержки пользователя в сессии
 */
// Extend Express Request type with user
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      username: string;
      firstName?: string;
      lastName?: string;
    };
  }
}

/**
 * Настройка middleware для управления сессиями
 */
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 неделя
  
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || 'lakshmi-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Для разработки, в продакшене должно быть true
      maxAge: sessionTtl,
    },
  });
}

/**
 * Middleware для проверки аутентификации
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session && (req.session as any).userId) {
    // Получаем данные пользователя из хранилища
    const userId = (req.session as any).userId;
    const user = storage.getUserById(userId);
    
    if (user) {
      req.user = {
        id: user.id,
        username: user.username!,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        claims: { sub: user.id } // Добавляем для совместимости с validateUserId
      };
      return next();
    }
  }
  
  return unauthorized(res, "Необходимо войти в систему");
}

/**
 * Хеширование пароля
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Проверка пароля
 */
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Настройка простой аутентификации
 */
export function setupSimpleAuth(app: Express) {
  // Настройка сессий
  app.use(getSession());

  /**
   * POST /api/auth/register - Регистрация нового пользователя
   */
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const { username, password, firstName, lastName } = validatedData;

      // Проверяем, не существует ли уже пользователь с таким логином
      const existingUser = storage.getUserByUsername(username);
      if (existingUser) {
        return badRequest(res, "Пользователь с таким логином уже существует");
      }

      // Хешируем пароль
      const hashedPassword = await hashPassword(password);

      // Создаем пользователя
      const userId = generateUserId();
      const newUser = {
        id: userId,
        username,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        email: null, // Не используем email в простой версии
        profileImageUrl: null,
      };

      await storage.upsertUser(newUser);

      // Автоматически логиним пользователя после регистрации
      (req.session as any).userId = userId;

      return created(res, {
        id: userId,
        username,
        firstName: firstName || null,
        lastName: lastName || null,
      });

    } catch (error) {
      if (handleValidationError(error, res)) return;
      handleError(error, res, "Ошибка при регистрации пользователя");
    }
  });

  /**
   * POST /api/auth/login - Вход пользователя
   */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { username, password } = validatedData;

      // Находим пользователя
      const user = storage.getUserByUsername(username);
      if (!user || !user.password) {
        return unauthorized(res, "Неправильный логин или пароль");
      }

      // Проверяем пароль
      const isPasswordValid = await verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return unauthorized(res, "Неправильный логин или пароль");
      }

      // Создаем сессию
      (req.session as any).userId = user.id;

      return ok(res, {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      });

    } catch (error) {
      if (handleValidationError(error, res)) return;
      handleError(error, res, "Ошибка при входе в систему");
    }
  });

  /**
   * POST /api/auth/logout - Выход пользователя
   */
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Ошибка при выходе:", err);
        return handleError(err, res, "Ошибка при выходе из системы");
      }
      return noContent(res);
    });
  });

  /**
   * GET /api/auth/user - Получение данных текущего пользователя
   */
  app.get("/api/auth/user", requireAuth, (req: Request, res: Response) => {
    return ok(res, req.user);
  });
}