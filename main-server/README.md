# Backend API Project

This project is a backend API built with TypeScript. It provides the core functionality for handling requests, managing data, and serving as the backend for the application.

## Project Structure

### Root Directory

- **.env.sample**: Sample environment configuration file.
- **.gitignore**: Specifies files and directories to be ignored by Git.
- **app.config.json**: Application-specific configuration settings.
- **bun.lock**: Lock file for Bun package manager.
- **index.ts**: Entry point for the application.
- **package.json**: Lists project dependencies and scripts.
- **README.md**: Documentation for the project.
- **tsconfig.json**: TypeScript configuration file.

### `src/` Directory

Contains the source code for the application.

#### **app.ts**

- Initializes the application and sets up middleware.

#### **server.ts**

- Configures the server and listens for incoming requests.

#### **config/**

- **cors/**: CORS configuration.
- **env/**: Environment variable loading.
- **FLAGS/**: Feature flag configuration.
- **helmet/**: Helmet security configuration.
- **logger/**: Logger setup using Pino.

#### **middlewares/**

- **auth/**: Authentication middleware.
- **error/**: Error handling middleware (e.g., global error handler, validation).

#### **modules/**

- **common/**: Common controllers and utilities.
  - **controllers/**: Contains shared controllers.
- **user/**: User-related functionality.
  - **controllers/**: User-specific controllers.
  - **routers/**: User-specific routes.
  - **validators/**: User-specific validation schemas.

#### **routes/**

- **adminRouter.route.ts**: Routes for admin-related functionality.
- **app.route.ts**: Main application routes.
- **protectedRouter.route.ts**: Routes requiring authentication.
- **unprotectedRouter.route.ts**: Publicly accessible routes.

#### **types/**

- **global.d.ts**: Global type definitions.
- **common/**: Common type definitions.
- **error/**: Error-related type definitions.
- **request/**: Request-related type definitions.

#### **utils/**

- **auth-utils/**: Utility functions for authentication (e.g., token handling).
- **error/**: Utility functions for error handling (e.g., `ApiError` class).

## Getting Started

1. Clone the repository.
2. Install dependencies using `bun install` or `npm install`.
3. Set up your environment variables by copying `.env.sample` to `.env` and updating the values.
4. Run the application using `bun run start` or `npm start`.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
