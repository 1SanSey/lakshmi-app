# Overview

This is a full-stack financial management application built for personal accounting and sponsor relationship management. The application allows users to track income through receipts from sponsors, monitor expenses through cost management, manage funds with percentage-based automatic distribution, and view comprehensive dashboard analytics. It's designed as a Progressive Web App (PWA) with offline capabilities and mobile-responsive design.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Client-side routing with Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Styling**: Tailwind CSS with CSS custom properties for theming and dark mode support

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit's OpenID Connect (OIDC) authentication system with Passport.js
- **Session Management**: Express sessions stored in PostgreSQL using connect-pg-simple
- **API Design**: RESTful API endpoints with consistent error handling and logging middleware

## Database Design
- **ORM**: Drizzle with PostgreSQL dialect for schema management and migrations
- **Schema Structure**:
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
- **Income Sources Architecture**: Completed major database restructuring for income sources with fund distribution
  - Removed percentage field from funds table as requested by user
  - Created income_sources table for managing income source types
  - Added income_source_fund_distributions table for percentage-based fund allocation per income source
  - Implemented receipt_items table for detailed receipt line items linked to sponsors
  - Updated newMemStorage.ts with complete implementation for new architecture
  - Built income sources management UI with fund distribution configuration modals
  - Added navigation for income sources in both desktop sidebar and mobile navigation
  - Fixed navigation warning by replacing nested anchor tags with div elements

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