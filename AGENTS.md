# AGENTS.md

This file provides guidelines for AI agents working in this repository.

## Project Overview

A Next.js 16 web application with Convex backend, featuring AI agent orchestration, authentication, and a modern React UI.

**Stack:**
- Next.js 16 + React 19 + TypeScript 5
- Convex (backend database, actions, mutations)
- Tailwind CSS v4 + shadcn/ui
- Better-auth (authentication)
- AI SDK (agent orchestration)
- Bun (package manager)

## Build/Lint/Type Commands

```bash
# Development
bun run dev              # Start Next.js dev server
bun run convex           # Start Convex dev server

# Build
bun run build            # Production build
bun run start            # Start production server

# Code Quality
bun run type:check       # TypeScript type checking (tsc --noEmit)
bun run eslint:check     # ESLint check
bun run lint             # ESLint (alias)

# UI Components
bun run sad <component>  # Add shadcn component (shadcn@latest add)
```

**Note:** No test runner is configured. Add tests using your preferred framework (Vitest/Jest/Playwright) if needed.

## Code Style Guidelines

### Imports

Order and grouping:
1. React/Next imports
2. Third-party library imports (grouped by library)
3. `@/` alias imports (components, lib, hooks)
4. Relative imports (for files within the same feature)
5. Type-only imports marked with `import type`

```typescript
import { useState } from "react";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction, useMutation } from "convex/react";
import { useForm } from "react-hook-form";
import z from "zod";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { signOut } from "@/lib/auth/auth-client";
```

### Formatting

- **Indentation:** Tabs (4 spaces equivalent)
- **Quotes:** Double quotes for strings
- **Semicolons:** Required
- **Trailing commas:** Use in multi-line objects/arrays
- **Line width:** ~100 characters (soft limit)

### Naming Conventions

- **Components:** PascalCase (e.g., `Button`, `Header`)
- **Hooks:** camelCase prefixed with `use` (e.g., `useForm`)
- **Functions:** camelCase (e.g., `handleSignOut`, `createThread`)
- **Types/Interfaces:** PascalCase (e.g., `FormSchema`, `RemoteTool`)
- **Constants:** UPPER_SNAKE_CASE for true constants
- **Files:** camelCase for utilities, PascalCase for components
- **Convex:** camelCase for mutation/action names (e.g., `createThread`, `sendMessageToAgent`)

### TypeScript Types

- **Strict mode enabled** - no implicit any
- Use explicit return types for exported functions
- Use `interface` for object shapes, `type` for unions/complex types
- Prefer `type` over `interface` for component props when using `React.ComponentProps`
- Avoid `any` - use `unknown` or proper types (ESLint warns on explicit any)

```typescript
// Good
interface RemoteTool {
    name: string;
    description: string;
}

type JsonValue = string | number | null | { [key: string]: JsonValue };

// Component props
function Button({ className, variant }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {}
```

### Error Handling

- Use try-catch for async operations
- Always type errors: `error instanceof Error ? error.message : String(error)`
- Return error objects rather than throwing in Convex actions/mutations
- Handle loading states with Convex's `AuthLoading` component pattern

```typescript
try {
    const result = await someAsyncOperation();
    return result;
} catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: errorMessage };
}
```

## Project Structure

```
src/
  app/              # Next.js app router pages
    api/            # API routes
    globals.css     # Tailwind + CSS variables
    layout.tsx      # Root layout
    page.tsx        # Home page
  components/
    ui/             # shadcn/ui components
    layout/         # Layout components (Header, providers)
  lib/
    auth/           # Authentication client/server
    utils.ts        # Utility functions (cn, etc.)
  orchestrator/     # AI agent orchestration

convex/
  _generated/       # Auto-generated Convex code
  mutations/        # Convex mutations
  tools/            # Convex tools/actions
  agent.ts          # Agent configuration
  auth.ts           # Auth configuration
  chat.ts           # Chat actions
  schema.ts         # Database schema
```

## Key Patterns

### Convex

- Use `v` from `convex/values` for argument validation
- Import server functions from `_generated/server`
- Import API from `_generated/api` for client calls
- Actions for async/external operations, mutations for data changes

### React Components

- Use `"use client"` directive for client components
- Prefer Server Components by default (no directive)
- Use shadcn/ui components via `bun run sad <component>`
- Use `cn()` utility for conditional Tailwind classes

### Styling

- Tailwind CSS v4 with `@import` syntax
- CSS variables for theming (defined in globals.css)
- Use `className` for styling, avoid inline styles
- Dark mode support via `dark` class

### Environment Variables

Required variables (see `.env.example`):
- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CONVEX_URL`
- Auth provider credentials (Google OAuth)
- AI model configuration (`MODEL_NAME`)

## Important Notes

- Always run `bun run type:check` before committing
- Convex files are auto-generated - don't edit `_generated/` manually
- The project uses React Compiler (configured in next.config.ts)
- Authentication uses Google OAuth via better-auth
