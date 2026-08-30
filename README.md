<img width="1342" height="646" alt="Screenshot 2026-08-30 125412" src="https://github.com/user-attachments/assets/1b45dabc-6ba4-44ee-afce-99363905abb1" />

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

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── site/          # Page-specific components (Hero, Navbar, Features, etc.)
│   └── ui/            # Reusable UI components (Button, Card, Dialog, etc.)
├── data/
│   └── products.ts    # Product data
├── hooks/             # Custom React hooks
├── lib/
│   ├── api/           # API functions
│   └── utils.ts       # Utility functions
├── routes/
│   ├── __root.tsx     # Root layout
│   ├── index.tsx      # Home page
│   └── product.$productId.tsx  # Product detail page
├── router.tsx         # Router configuration
└── main.tsx           # App entry point
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## License

Private project 
