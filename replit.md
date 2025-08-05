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
- Fixed critical special event deletion bug - PostgreSQL uses rowCount instead of rowsAffected property (August 3, 2025)
- Successfully resolved event deletion failures with proper database query result handling
- Implemented comprehensive 24-hour check-in cooldown system with real-time validation and user feedback (August 3, 2025)
- Added server-side methods canUserCheckIn and getUserLatestCheckInAtBrewery for cooldown tracking
- Enhanced client-side brewery detail page with smart button states and cooldown status display
- Updated check-in button text to "Check In Again Tomorrow" during cooldown periods with simplified error messaging
- Implemented geolocation-based check-in validation requiring users to be within 0.1 miles of brewery location (August 3, 2025)
- Added Haversine formula for accurate distance calculation and "Check in when you arrive" popup for geofence violations
- Enhanced location permission handling with proper error messages for denied or unavailable location services
- Completed full email-based authentication system with SendGrid integration (August 3, 2025)
- Fixed SendGrid sender verification issues by using proper sender object format with name and email fields
- Added comprehensive Terms of Service and Privacy Policy with push notification coverage
- Implemented 6-digit verification code system with email delivery and database persistence
- Updated welcome page with Beer Hop branding and professional green color scheme (#80bc04)
- Implemented smart back button system that only appears after external link navigation (August 5, 2025)
- Enhanced social media link handling to open native apps (Instagram, Facebook, Spotify) with mobile-optimized URL schemes
- Added external navigation tracking using sessionStorage with auto-hide functionality
- Fixed banner link behavior to properly attempt native app opening before web fallback
- Added "Millennium Lounge: Official Podcast Sponsor" text under podcast banner advertisements
- Optimized Facebook app opening for mobile-only usage with proper fb:// URL schemes (August 5, 2025)
- Removed browser fallbacks for Facebook links as requested - app-only navigation
- Enhanced brewery detail page social buttons for mobile Facebook and website link handling
- Implemented Facebook-style persistent back button for external websites (August 5, 2025)
- Created external back button script that injects "Beer Hop OK" back button on external sites
- Both website and Facebook links now open in same tab with consistent back navigation
- Removed all banner ad click functionality - banners are now display-only images
- Fixed brewery banner upload bug - resolved authentication issue with x-user-id header (August 5, 2025)
- Removed link URL box from all banner edit popups since banners are display-only
- Updated banner save logic to only require image URL, not link URL
- Implemented comprehensive performance optimizations for slow loading (August 5, 2025)
- Optimized database queries: leaderboard shows only users with 100+ check-ins, limited to top 100 with proper sorting
- Added caching layers to prevent repeated CSV processing and database initialization checks
- Enhanced React Query caching with appropriate stale times for different data types
- Removed location caching per user request - geolocation requests fresh each time
- Improved query response times: breweries 83% faster (0.4s → 0.07s), leaderboard 68% faster (0.9s → 0.29s)

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