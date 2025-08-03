# Beer Hop Mobile App

## Overview

Beer Hop is a mobile-first web application that serves as a brewery discovery and check-in platform. The app allows users to discover local breweries, check into locations, listen to brewery-focused podcast episodes, track events, and compete on leaderboards. The application features a comprehensive brewery database with detailed information, social features like favorites and check-ins, and multimedia content including podcasts and event listings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built as a Single Page Application (SPA) using React with TypeScript. The application uses Wouter for client-side routing, providing a lightweight alternative to React Router. The UI is constructed with shadcn/ui components built on top of Radix UI primitives, ensuring accessibility and consistent design patterns. TanStack Query (React Query) handles all server state management, providing caching, background updates, and optimistic updates for a smooth user experience.

The application follows a mobile-first design approach with responsive layouts using Tailwind CSS. Custom CSS variables define a beer-themed color palette with amber, hops green, and brown tones. The component structure is organized with reusable UI components in the `components/ui` directory and page-specific components in `pages`.

### Backend Architecture
The backend is implemented as a REST API using Express.js with TypeScript. The server follows a simple three-layer architecture: routes handle HTTP requests and responses, a storage abstraction layer defines data operations, and the actual data storage implementation (currently appears to be in-memory but designed to be database-backed).

The API provides endpoints for users, breweries, check-ins, events, and podcast episodes. The server includes middleware for request logging, JSON parsing, and error handling. The application uses a build process that bundles the server code with esbuild for production deployment.

### Data Storage Solutions
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The schema defines six main entities: users, breweries, check-ins, events, podcast episodes, and badges. The application now uses DatabaseStorage for persistent data storage instead of in-memory storage.

Key recent changes (August 2025):
- Switched from MemStorage to DatabaseStorage for data persistence
- Updated brewery schema to remove 'about' field and add 'tapListUrl' field
- Removed slideshow functionality from brewery screens per user request
- All 70 authentic Oklahoma breweries from CSV are now properly stored in the database
- Implemented global podcast header image system - uploaded headers are permanent and visible to ALL users
- Fixed critical podcast header disappearance issue with bulletproof failsafe system (August 3, 2025)
- Installed official Beer Hop Podcast banner image - permanent for all users globally
- Redesigned brewery page button layout: full-width Check In, side-by-side View Taplist (pink) and Take Notes (#004121)
- Updated breweries list to show only city/state instead of full addresses with compact spacing
- Added global settings table in database for storing app-wide configuration like podcast header
- Implemented Special Events functionality with toggle between Special/Weekly Events (August 3, 2025)
- Added Special Events CSV data loading with multi-line field parsing support
- Created special event detail pages with full image display and ticket links
- Implemented admin/owner edit functionality for special events with permission-based access control
- Added ownerId field to special events schema for ownership tracking

The database schema supports complex relationships between entities, such as users having multiple check-ins and favorite breweries, breweries having associated podcast episodes, and a badge system based on check-in counts. Geographic data uses authentic latitude and longitude coordinates from the provided brewery coordinate CSV file, ensuring accurate distance calculations for Oklahoma breweries.

### State Management
Client-side state is managed through a combination of TanStack Query for server state and React's built-in state management for local UI state. The query client is configured with infinite stale time and disabled refetching to optimize for mobile usage patterns. Custom hooks handle geolocation services and responsive design breakpoints.

### Mobile-First Design
The application is specifically designed for mobile devices with a bottom navigation pattern, mobile-optimized layouts, and touch-friendly interactions. The CSS framework uses responsive design principles with mobile breakpoints and a constrained maximum width for larger screens.

## External Dependencies

### UI and Styling
- **Radix UI**: Provides accessible, unstyled UI primitives for building the component system
- **Tailwind CSS**: Utility-first CSS framework for styling with custom theming for brewery/beer aesthetics
- **Lucide React**: Icon library providing consistent iconography throughout the app
- **class-variance-authority**: Enables variant-based component styling patterns

### State Management and Data Fetching
- **TanStack React Query**: Handles server state management, caching, and background synchronization
- **Wouter**: Lightweight client-side routing library for navigation

### Backend Infrastructure
- **Express.js**: Web application framework for the REST API server
- **Drizzle ORM**: Type-safe ORM for PostgreSQL database operations
- **Drizzle Kit**: CLI tools for database migrations and schema management

### Database
- **PostgreSQL**: Primary database system (configured for Neon Database hosting)
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon Database

### Development and Build Tools
- **Vite**: Build tool and development server with React plugin support
- **TypeScript**: Type safety across the entire application stack
- **ESBuild**: Fast JavaScript bundler for production server builds

### Forms and Validation
- **React Hook Form**: Form state management and validation
- **Zod**: Schema validation library integrated with Drizzle for type safety
- **@hookform/resolvers**: Connects Zod schemas with React Hook Form

### Utilities
- **date-fns**: Date manipulation and formatting utilities
- **nanoid**: URL-safe unique ID generation
- **clsx**: Conditional className utility for dynamic styling