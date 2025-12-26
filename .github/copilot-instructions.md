# Copilot Instructions for Uptube

Welcome to the Uptube codebase! This document provides essential guidelines for AI coding agents to be productive in this project. Please follow these instructions to ensure consistency and alignment with the project's architecture and conventions.

## Project Overview

Uptube is a full-stack application with the following structure:

- **Frontend**: Located in the `app/` directory, built with TypeScript and React Native.
- **Backend**: Located in the `backend/` directory, built with TypeScript and Node.js.
- **Database**: Managed using Prisma ORM with migrations stored in `backend/prisma/migrations/`.

The backend serves as the API layer, handling requests, managing data, and integrating with external services.

## Key Conventions

### Backend

1. **Project Structure**:

   - Source code resides in `backend/src/`.
   - Routes are defined in `backend/src/routes/`.
   - Middleware is located in `backend/src/middlewares/`.
   - Utility functions are in `backend/src/utils/`.

2. **Environment Variables**:

   - Use `.env` for sensitive configurations. A sample is provided in `.env.sample`.

3. **Scripts**:

   - Start the backend: `bun run start` or `npm start`.
   - Run tests: `npm test`.

4. **Error Handling**:

   - Use the `ApiError` class in `backend/src/utils/error/` for consistent error responses.

5. **Authentication**:
   - Authentication middleware is in `backend/src/middlewares/auth/`.

### Frontend

1. **Project Structure**:

   - Pages are in `app/app/`.
   - Shared components are in `app/components/`.
   - Context providers are in `app/contexts/`.

2. **Styling**:

   - Tailwind CSS is configured in `app/tailwind.config.js`.

3. **Scripts**:

   - Start the frontend: `npm start` (from the `app/` directory).

4. **State Management**:
   - Use React Context API (e.g., `FeaturesContext.tsx`).

## Developer Workflows

### Backend

- **Run the Server**:

  ```bash
  cd backend
  bun run start
  ```

- **Run Tests**:

  ```bash
  npm test
  ```

- **Apply Prisma Migrations**:
  ```bash
  npx prisma migrate dev --name init
  ```

### Frontend

- **Start the App**:

  ```bash
  cd app
  npm start
  ```

- **Run Metro Bundler**:
  ```bash
  npm run start
  ```

## Integration Points

- **Database**: Prisma ORM is used for database management. Schema is defined in `backend/prisma/schema.prisma`.
- **Youtube APIs**: Backend modules (e.g., `backend/src/modules/yt/`) handle communication with external services like YouTube.

## Examples

### Backend Route Definition

Routes are defined in `backend/src/routes/`. Example:

```typescript
import { Router } from "express";
const router = Router();

router.get("/example", (req, res) => {
  res.json({ message: "Hello, world!" });
});

export default router;
```

### Frontend Component

Components are in `app/components/`. Example:

```tsx
import React from "react";

const Button: React.FC = () => (
  <button className="bg-blue-500 text-white px-4 py-2 rounded">Click Me</button>
);

export default Button;
```

## Notes

- Follow the existing folder structure and naming conventions.
- Use TypeScript for all new files.
- Document any new patterns or workflows in this file.

---

For questions or clarifications, refer to the `README.md` files in the `app/` and `backend/` directories.
