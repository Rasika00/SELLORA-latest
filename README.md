# SELLORA
E-commerce platform for laptops

## Overview

Sellora is a modern e-commerce platform built with React, TypeScript, and TanStack Start. It provides a sleek, responsive shopping experience for laptop products with features like product browsing, detailed product pages, and a polished UI.

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) - Full-stack React framework
- **Routing**: [TanStack Router](https://tanstack.com/router) - Type-safe routing
- **UI Components**: [Radix UI](https://radix-ui.com/) - Accessible, unstyled components
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- **Forms**: [React Hook Form](https://react-hook-form.com/) with Zod validation
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: TypeScript

## Features

- 🛒 Product catalog with grid layout
- 📄 Detailed product pages with dynamic routing
- 🎨 Responsive design with Tailwind CSS
- ⚡ Fast HMR development with Vite
- 🔒 Type-safe routing and data fetching
- 🎯 Accessible UI components (Radix UI)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

```bash
# Install dependencies
npm install

# Start development server (Frontend)
npm run dev

# Start PostgreSQL Backend API server (Runs on port 3001)
npm run server

# Push Prisma schema to PostgreSQL database
npm run db:push

# Seed product catalog into PostgreSQL
npm run db:seed

# Open Prisma Studio GUI
npm run db:studio

# Build for production
npm run build
```

## PostgreSQL Database Setup

1. Copy `.env.example` to `.env` if not already present:
   ```env
   # Local PostgreSQL:
   DATABASE_URL="postgresql://postgres:password@localhost:5432/sellora?schema=public"

   # Or Cloud PostgreSQL (Neon, Supabase, Railway, Render):
   # DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
   ```
2. Push your schema to your PostgreSQL database:
   ```bash
   npm run db:push
   ```
3. Seed the initial laptop catalog (14+ products) into PostgreSQL:
   ```bash
   npm run db:seed
   ```
4. Start both the backend API and frontend:
   ```bash
   npm run server
   npm run dev
   ```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite frontend dev server (port 5173) |
| `npm run server` | Start PostgreSQL Express backend server (port 3001) |
| `npm run server:dev` | Start backend with file-watcher auto-reload |
| `npm run db:push` | Sync Prisma schema with PostgreSQL database |
| `npm run db:seed` | Populate 14+ laptops into PostgreSQL database |
| `npm run db:studio` | Interactive web GUI for PostgreSQL tables |
| `npm run build` | Build frontend for production |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## License

Private project 
