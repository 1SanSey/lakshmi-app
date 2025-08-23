# Overview

LakshmiApp is a full-stack financial management application for personal accounting and sponsor relationship management. It enables users to track income via receipts, monitor expenses, manage funds with percentage-based automatic distribution, and view comprehensive dashboard analytics. Designed as a Progressive Web App (PWA), it features offline capabilities and a mobile-responsive design. The project's vision is to provide a robust, scalable, and user-friendly solution for financial oversight, enhancing personal and sponsorship-based financial interactions with a strong emphasis on automation and data insights.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

LakshmiApp is a modern full-stack application with a clear separation between frontend and backend components, designed for scalability, security, and maintainability.

**Core Components:**
*   **React Frontend:** Client-side application with a modern UI.
*   **Express Backend:** API server housing business logic.
*   **PostgreSQL Database:** Relational database for persistent storage.
*   **Replit OIDC Auth:** Authentication system.
*   **In-Memory Storage (NewMemStorage):** Temporary data storage for development.

**Frontend Architecture:**
*   **Framework:** React 18 with TypeScript.
*   **Build Tool:** Vite.
*   **Routing:** Wouter.
*   **State Management:** TanStack Query for server state and caching.
*   **UI Framework:** shadcn/ui components built on Radix UI, styled with Tailwind CSS.
*   **Form Handling:** React Hook Form with Zod validation.
*   **Styling:** Tailwind CSS with custom CSS properties.
*   **Icons:** Lucide React.
*   **Notifications:** Integrated Toaster system.
*   **PWA Features:** Service Worker for caching, manifest for installation, responsive design, and performance optimizations (code splitting, lazy loading).

**Backend Architecture:**
*   **Runtime:** Node.js 20+ with Express.js.
*   **Database:** PostgreSQL (with plans for Drizzle ORM).
*   **Current Storage:** NewMemStorage (in-memory for development).
*   **Authentication:** Replit OpenID Connect (OIDC) via Passport.js.
*   **Session Management:** Express sessions persisted in PostgreSQL.
*   **API Design:** RESTful architecture with consistent error handling.
*   **Validation:** Zod schemas for input validation.
*   **Error Handling:** Centralized global error middleware.

**Data Storage:**
*   **Current:** NewMemStorage (in-memory) for rapid development. Data is volatile.
*   **Future:** Migration to PostgreSQL with Drizzle ORM for persistence.
*   **Schema:** Includes tables for Users, Sponsors, Receipts, Costs, Funds, Fund Distributions, and Sessions. Features foreign key constraints and Zod schema validation for data consistency across client and server.

**Authentication & Authorization:**
*   **Provider:** Replit OIDC.
*   **Strategy:** Passport.js OpenID Connect.
*   **Session Management:** Server-side sessions stored in PostgreSQL.
*   **Security:** Utilizes HTTP-only cookies, CSRF protection, and secure session configuration.
*   **User Management:** Automatic user creation/update upon login.

**API Architecture:**
*   **Pattern:** RESTful endpoints with standardized HTTP status codes.
*   **Middleware:** Includes authentication checks, request logging, and error handling.
*   **Data Flow:** Employs a structured flow: request validation → authentication → business logic → database operations → response formatting.

**Development & Deployment:**
*   **Build System:** Vite for development and optimized production builds.
*   **TypeScript:** Ensures full type safety across the entire codebase.
*   **Code Organization:** Monorepo structure with shared schemas and utilities.

# External Dependencies

**Database & ORM:**
*   **Neon Database:** Serverless PostgreSQL hosting.
*   **Drizzle ORM:** Type-safe database operations.
*   **WebSocket Support:** For Neon database connections.

**Authentication:**
*   **Replit OIDC:** OpenID Connect authentication service.
*   **Passport.js:** Authentication middleware.

**UI & Styling:**
*   **Radix UI:** Accessible, unstyled UI primitives.
*   **Tailwind CSS:** Utility-first CSS framework.
*   **Lucide React:** Icon library.
*   **shadcn/ui:** Pre-built component library.

**Development Tools:**
*   **Vite:** Build tool and development server.
*   **TypeScript:** Static type checking.
*   **ESBuild:** Fast JavaScript bundler.
*   **PostCSS:** CSS processing.

**State Management & Forms:**
*   **TanStack Query:** Server state management and caching.
*   **React Hook Form:** Form handling.
*   **Zod:** Runtime type validation and schema definition.

**Utilities:**
*   **date-fns:** Date manipulation and formatting.
*   **clsx & tailwind-merge:** Conditional CSS class management.
*   **nanoid:** Unique ID generation.
*   **memoizee:** Function memoization.