# replit.md

## Overview

This is a multimodal e-commerce search application that enables users to find products using text, voice, or image inputs. The app processes user queries through AI to extract search parameters, then displays matching products from various online retailers. Users can filter results, chat with an AI assistant about products, and view detailed product information in a modern marketplace interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React SPA** built with TypeScript and Vite for fast development and builds
- **Wouter** for lightweight client-side routing between landing page and marketplace
- **shadcn/ui** component library with Radix UI primitives and Tailwind CSS for consistent, accessible design
- **TanStack Query** for server state management and API caching
- **Custom hooks** for mobile detection and toast notifications

### Backend Architecture
- **Express.js** server with TypeScript for REST API endpoints
- **In-memory storage** with interface-based design allowing future database integration
- **File upload handling** using Multer for image and audio processing
- **Image processing** with Sharp for optimizing uploaded images
- **Development tooling** with Vite middleware for hot module replacement

### Database Design
- **Drizzle ORM** configured for PostgreSQL with comprehensive schema
- **Neon Database** integration for serverless PostgreSQL hosting
- **Core entities**: searches, products, chat messages, and filters with proper relationships
- **JSON fields** for flexible array storage (brands, categories)

### AI Integration
- **Google Gemini AI** (gemini-2.5-flash) for natural language processing
- **Multi-modal capabilities**: text analysis, image recognition, and voice transcription
- **Structured output** using JSON schema validation for consistent AI responses
- **Product search query extraction** from natural language descriptions

### Key Features
- **Multi-modal search**: Text input, voice recording, and image upload support
- **AI-powered chat**: Context-aware product recommendations and assistance
- **Advanced filtering**: Price range, brand, category, rating, and sorting options
- **Responsive design**: Mobile-first approach with adaptive layouts
- **Product comparison**: Grid and list view modes for product browsing

### External Dependencies

- **Google Gemini AI API** for natural language processing and image analysis
- **Neon Database** for PostgreSQL hosting and data persistence
- **Unsplash** for placeholder product images in mock data
- **Web APIs**: MediaRecorder for voice input, File API for image uploads
- **CDN Services**: Google Fonts for typography (Inter, Architects Daughter, DM Sans, Fira Code, Geist Mono)

### Development Tools
- **Replit-specific plugins** for development banner and cartographer integration
- **ESBuild** for production bundling and tree-shaking
- **PostCSS** with Tailwind CSS for styling compilation
- **TypeScript** with strict mode for type safety across client and server